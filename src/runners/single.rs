//! Note: I called this "single" to signal the fact that it receives a single
//! piece (or set) of JS code and runs it forever, as opposed to watching for
//! changes. It's a terrible name, I know, but I can't think of a better one
//! right now. Maybe I'll rename it later.

use std::{
    sync::{atomic::AtomicI32, Arc},
    time::{Duration, Instant},
};

use async_trait::async_trait;
use tokio::sync::Mutex;

use crate::{
    js_app::JsApp,
    request_handlers::{NewRequestHandler, UserCode},
    runners::{
        generate_error_response, generate_internal_error, request_loop::handle_requests,
        ResponseData,
    },
};

use super::request_loop::{ControlMessage, RequestData};

pub struct WorkerThreadInfo {
    thread: std::thread::JoinHandle<()>,
    channel: tokio::sync::mpsc::UnboundedSender<ControlMessage>,
    in_flight_requests: Arc<AtomicI32>,
}

impl WorkerThreadInfo {
    pub fn is_finished(&self) -> bool {
        self.thread.is_finished()
    }
}

// TODO: replace failing threads
pub struct SingleRunner<N: NewRequestHandler> {
    threads: Vec<WorkerThreadInfo>,
    max_threads: usize,
    shut_down: bool,
    new_handler: N,
    user_code: UserCode,
    script_init_error: Option<anyhow::Error>,
}

pub type SharedSingleRunner<N> = Arc<Mutex<SingleRunner<N>>>;

impl<N: NewRequestHandler> SingleRunner<N> {
    pub fn new(max_threads: usize, new_handler: N, user_code: UserCode) -> Self {
        if max_threads == 0 {
            panic!("max_threads must be at least 1");
        }

        Self {
            threads: vec![],
            max_threads,
            shut_down: false,
            new_handler,
            user_code,
            script_init_error: None,
        }
    }

    pub fn new_request_handler(
        max_threads: usize,
        new_handler: N,
        user_code: UserCode,
    ) -> SharedSingleRunner<N> {
        Arc::new(Mutex::new(Self::new(max_threads, new_handler, user_code)))
    }

    async fn spawn_thread(&mut self) -> anyhow::Result<&WorkerThreadInfo> {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        let (init_tx, init_rx) = tokio::sync::oneshot::channel();

        let new_handler = self.new_handler;
        let user_code = self.user_code.clone();
        let concurrency = self.max_threads as u32;

        let join_handle = std::thread::spawn(move || {
            let app = match JsApp::build(new_handler, concurrency, &user_code) {
                Ok(app) => app,
                Err(e) => {
                    init_tx.send(Err(e)).expect("spawn_thread dropped dead");
                    return;
                }
            };
            crate::tokio_utils::run_in_single_thread_runtime(async move {
                match app.warmup().await {
                    Ok(()) => {
                        init_tx.send(Ok(())).expect("spawn_thread dropped dead");
                    }
                    Err(e) => {
                        init_tx.send(Err(e)).expect("spawn_thread dropped dead");
                        return;
                    }
                }
                handle_requests(app, rx).await
            })
        });

        // Catch script parsing/evaluation errors and report them
        match init_rx.await {
            Err(_) => panic!("New request handler thread disappeared!"),
            Ok(Err(e)) => return Err(e),
            Ok(Ok(())) => (),
        }

        let worker = WorkerThreadInfo {
            thread: join_handle,
            channel: tx,
            in_flight_requests: Arc::new(AtomicI32::new(0)),
        };
        self.threads.push(worker);
        let spawned_index = self.threads.len() - 1;
        tracing::debug!("Starting new handler thread #{spawned_index}");
        Ok(&self.threads[spawned_index])
    }

    async fn find_or_spawn_thread(&mut self) -> Option<anyhow::Result<&WorkerThreadInfo>> {
        if self.shut_down {
            return None;
        }

        let request_counts = self
            .threads
            .iter()
            .enumerate()
            .map(|(idx, t)| {
                (
                    idx,
                    t.in_flight_requests
                        .load(std::sync::atomic::Ordering::SeqCst),
                )
            })
            .collect::<Vec<_>>();

        // Step 1: are there any idle threads?
        for t in &request_counts {
            if t.1 <= 0 {
                tracing::debug!("Using idle handler thread #{}", t.0);
                return Some(Ok(&self.threads[t.0]));
            }
        }

        // Step 2: can we spawn a new thread?
        if self.threads.len() < self.max_threads {
            tracing::debug!("Spawning new request handler thread");
            return Some(self.spawn_thread().await);
        }

        // Step 3: find the thread with the least active requests
        // unwrap safety: request_counts can never be empty
        let min = request_counts.iter().min_by_key(|t| t.1).unwrap();
        tracing::debug!(
            "Reusing busy handler thread #{} with in-flight request count {}",
            min.0,
            self.threads[min.0]
                .in_flight_requests
                .load(std::sync::atomic::Ordering::SeqCst)
        );
        Some(Ok(&self.threads[min.0]))
    }
}

#[async_trait]
impl<N: NewRequestHandler> super::Runner for SharedSingleRunner<N> {
    async fn handle(
        &self,
        _addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> hyper::Response<hyper::Body> {
        // TODO: I believe this lock can be a serious contention point,
        // we should find a different way to handle things here. Maybe
        // a work-stealing queue? A multi-consumer message broadcaster?
        // Any such approach would also need a way to keep the workers
        // handling similar amounts of load.
        let mut this = self.lock().await;

        if this.script_init_error.is_some() {
            return generate_error_response(500, "Scripts failed to initialize".into());
        }

        let thread = match this.find_or_spawn_thread().await {
            None => {
                return generate_error_response(503, "Server is shutting down".into());
            }
            Some(Err(e)) => {
                tracing::error!(?e, "Error in initial script evaluation");
                this.script_init_error = Some(e);
                return generate_error_response(500, "Scripts failed to initialize".into());
            }
            Some(Ok(thread)) => thread,
        };

        let request_count = thread.in_flight_requests.clone();
        let increment_guard = IncrementGuard::new(request_count);

        let (tx, rx) = tokio::sync::oneshot::channel();

        if let Err(e) = thread.channel.send(ControlMessage::HandleRequest(
            RequestData { _addr, req, body },
            tx,
        )) {
            tracing::error!(?e, "Failed to send control message to worker thread");
            return generate_internal_error();
        };

        // explicitly drop mutex guard to unlock mutex
        drop(this);

        let response = match rx.await {
            Ok(r) => r,
            Err(e) => {
                tracing::error!(?e, "Failed to receive response from worker thread");
                return generate_internal_error();
            }
        };

        drop(increment_guard);

        match response {
            ResponseData::Done(resp) => resp,
            ResponseData::RequestError(err) => {
                tracing::error!(?err, "Script error");
                // TODO: this should be a CLI switch
                #[cfg(debug_assertions)]
                {
                    generate_error_response(500, format!("{err:?}").into())
                }
                #[cfg(not(debug_assertions))]
                {
                    generate_error_response(500, "Script execution failed".into())
                }
            }
            ResponseData::InternalError(err) => {
                tracing::error!(?err, "Internal error in worker thread");
                generate_internal_error()
            }
        }
    }

    async fn shutdown(&self, timeout: Option<Duration>) {
        tracing::info!("Shutting down...");

        let mut this = self.lock().await;
        this.shut_down = true;
        for thread in &this.threads {
            if !thread.is_finished() {
                _ = thread.channel.send(ControlMessage::Shutdown);
            }
        }
        // Drop the lock handle so incoming requests can receive an
        // error response
        drop(this);

        let shutdown_started = Instant::now();

        loop {
            let this = self.lock().await;
            if this.threads.iter().any(|t| !t.is_finished()) {
                if let Some(timeout) = timeout {
                    if shutdown_started.elapsed() >= timeout {
                        tracing::warn!(
                            "Clean shutdown timeout was reached before all \
                            requests could finish processing"
                        );
                        for t in &this.threads {
                            if !t.is_finished() {
                                _ = t.channel.send(ControlMessage::Terminate);
                            }
                        }
                        break;
                    }
                }

                tracing::debug!("Still waiting for threads to quit...");
                tokio::time::sleep(Duration::from_secs(1)).await;
            } else {
                break;
            }
        }

        tracing::info!(
            "Shutdown completed in {} seconds",
            shutdown_started.elapsed().as_secs()
        );
    }
}

struct IncrementGuard {
    value: Arc<AtomicI32>,
}

impl IncrementGuard {
    fn new(value: Arc<AtomicI32>) -> Self {
        value.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        Self { value }
    }
}

impl Drop for IncrementGuard {
    fn drop(&mut self) {
        self.value.fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
    }
}
