//! Note: I called this "single" to signal the fact that it receives a single
//! piece (or set) of JS code and runs it forever, as opposed to watching for
//! changes. It's a terrible name, I know, but I can't think of a better one
//! right now. Maybe I'll rename it later.

use std::{
    sync::{atomic::AtomicI32, Arc},
    time::{Duration, Instant},
};

use anyhow::anyhow;
use async_trait::async_trait;
use futures::StreamExt;
use tokio::{sync::Mutex, task::LocalSet};

use crate::{
    request_handlers::{RequestHandler, UserCode},
    runners::{request_loop::handle_requests, ResponseData},
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
pub struct SingleRunner<H: RequestHandler + Copy + Unpin> {
    threads: Vec<WorkerThreadInfo>,
    max_threads: usize,
    handler: H,
    user_code: UserCode,
    shut_down: bool,
}

pub type SharedSingleRunner<H> = Arc<Mutex<SingleRunner<H>>>;

impl<H: RequestHandler + Copy + Unpin> SingleRunner<H> {
    pub fn new(max_threads: usize, handler: H, user_code: UserCode) -> Self {
        if max_threads == 0 {
            panic!("max_threads must be at least 1");
        }

        Self {
            threads: vec![],
            max_threads,
            handler,
            user_code,
            shut_down: false,
        }
    }

    pub fn new_request_handler(
        handler: H,
        max_threads: usize,
        user_code: UserCode,
    ) -> SharedSingleRunner<H> {
        Arc::new(Mutex::new(Self::new(max_threads, handler, user_code)))
    }

    fn spawn_thread(&mut self) -> &WorkerThreadInfo {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        let handler = self.handler;
        let user_code = self.user_code.clone();
        let max_threads = self.max_threads;
        let join_handle = std::thread::spawn(move || {
            tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap()
                .block_on(async move {
                    let local_set = LocalSet::new();
                    local_set
                        .run_until(handle_requests(handler, user_code, rx, max_threads as u32))
                        .await
                })
        });
        let worker = WorkerThreadInfo {
            thread: join_handle,
            channel: tx,
            in_flight_requests: Arc::new(AtomicI32::new(0)),
        };
        self.threads.push(worker);
        let spawned_index = self.threads.len() - 1;
        tracing::debug!("Starting new handler thread #{spawned_index}");
        &self.threads[spawned_index]
    }

    fn find_or_spawn_thread(&mut self) -> Option<&WorkerThreadInfo> {
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
                return Some(&self.threads[t.0]);
            }
        }

        // Step 2: can we spawn a new thread?
        if self.threads.len() < self.max_threads {
            tracing::debug!("Spawning new request handler thread");
            return Some(self.spawn_thread());
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
        Some(&self.threads[min.0])
    }
}

#[async_trait]
impl<H: RequestHandler + Copy + Unpin> crate::server::Runner for SharedSingleRunner<H> {
    async fn handle(
        &self,
        _addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
        let mut this = self.lock().await;
        let Some(thread) = this.find_or_spawn_thread() else {
            let response = hyper::Response::builder()
                .status(503)
                .body(hyper::Body::from("Server is shutting down"))
                .expect("Failed to construct 503 response");
            return Ok(response);
        };

        let request_count = thread.in_flight_requests.clone();
        let increment_guard = IncrementGuard::new(request_count);

        let (tx, rx) = tokio::sync::oneshot::channel();

        thread.channel.send(ControlMessage::HandleRequest(
            RequestData { _addr, req, body },
            tx,
        ))?;

        // explicitly drop mutex guard to unlock mutex
        drop(this);

        let response = rx.await?;

        drop(increment_guard);

        // TODO: handle script errors
        match response {
            ResponseData::Done(resp) => Ok(resp),
            ResponseData::RequestError(err) => Err(err),
            ResponseData::ScriptError(err) => {
                if let Some(err) = err {
                    println!("{err:?}");
                }
                Err(anyhow!("Error encountered while evaluating user script"))
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
