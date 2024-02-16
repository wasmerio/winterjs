//! Note: I called this "single" to signal the fact that it receives a single
//! piece (or set) of JS code and runs it forever, as opposed to watching for
//! changes. It's a terrible name, I know, but I can't think of a better one
//! right now. Maybe I'll rename it later.

use std::{
    sync::{atomic::AtomicI32, Arc},
    time::Duration,
};

use anyhow::anyhow;
use async_trait::async_trait;
use futures::stream::{FuturesUnordered, StreamExt};
use ion::{Context, ErrorReport};
use mozjs::jsapi::PromiseState;
use tokio::{select, sync::Mutex, task::LocalSet};
use tracing::debug;

use crate::{
    builtins::{self},
    request_handlers::{Either, Request, RequestHandler, UserCode},
    sm_utils::{error_report_option_to_anyhow_error, JsApp, TwoStandardModules},
};

// Used to ignore errors when sending responses back, since
// if the receiving end of the oneshot channel is dropped,
// there really isn't anything we can do
fn ignore_error<E>(_r: std::result::Result<(), E>) {}

async fn handle_requests_inner(
    mut handler: Box<dyn RequestHandler>,
    user_code: UserCode,
    recv: &mut tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
) -> Result<(), anyhow::Error> {
    let is_module_mode = match user_code {
        UserCode::Script { .. } => false,
        UserCode::Directory(_) | UserCode::Module(_) => true,
    };

    let module_loader = is_module_mode.then(runtime::module::Loader::default);
    let standard_modules = TwoStandardModules(
        builtins::Modules {
            include_internal: is_module_mode,
        },
        handler.get_standard_modules(),
    );

    let js_app = JsApp::build(module_loader, Some(standard_modules));
    let cx = js_app.cx();
    let rt = js_app.rt();

    handler.evaluate_scripts(cx, &user_code)?;

    // Wait for any promises resulting from running the script to be resolved, giving
    // scripts a chance to initialize before accepting requests
    // Note we will return the error here if one happens, since an error happening
    // in this stage means the script didn't initialize successfully.
    rt.run_event_loop()
        .await
        .map_err(|e| error_report_option_to_anyhow_error(cx, e))?;

    let mut requests = vec![];

    // Every 1ms, we stop waiting for the event loop and check existing requests.
    // This lets us send back ready responses before the entire event loop is done,
    // at which point *all* requests will have been handled.
    let poll_interval = Duration::from_millis(1);

    let mut stream_body_futures = FuturesUnordered::new();

    loop {
        select! {
            msg = recv.recv() => {
                match msg {
                    None | Some(ControlMessage::Shutdown) => break,
                    Some(ControlMessage::HandleRequest(req, resp_tx)) => {
                        match handler.start_handling_request(cx.duplicate(), Request{parts:  req.req, body: req.body}) {
                            Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
                            Ok(Either::Left(pending)) => requests.push((pending, resp_tx)),
                            Ok(Either::Right(resp)) => {
                                if let Some(fut) = resp.body_future {
                                    stream_body_futures.push(fut);
                                }
                                ignore_error(resp_tx.send(ResponseData::Done(resp.response)))
                            },
                        }
                    }
                }
            }

            // Nothing to do here except check the error, the promises are checked further down
            e = rt.run_event_loop() => {
                // Note: an error in this stage is an unhandled error happening in the request
                // logic, and such an error should not terminate the whole request processing
                // thread.
                handle_event_loop_result(&cx.duplicate(), e)
            }

            // Nothing to do
            _ = stream_body_futures.next(), if !stream_body_futures.is_empty() => {}

            // Nothing to do
            _ = tokio::time::sleep(poll_interval), if !rt.event_loop_is_empty() => {}
        }

        // We have to do this convoluted bit of code because drain_filter is not stable
        let mut i = 0;
        while i < requests.len() {
            if requests[i].0.promise.state(&cx.duplicate()) != PromiseState::Pending {
                let (pending, resp_tx) = requests.swap_remove(i);
                let response = handler.finish_request(cx.duplicate(), pending);
                match response {
                    Ok(Either::Left(pending)) => requests.push((pending, resp_tx)),
                    Ok(Either::Right(response)) => {
                        if let Some(fut) = response.body_future {
                            stream_body_futures.push(fut);
                        }
                        ignore_error(resp_tx.send(ResponseData::Done(response.response)));
                    }
                    Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
                }
            } else {
                i += 1;
            }
        }
    }

    // Wait for all pending requests to be resolved, which may
    // happen in multiple stages.
    while !requests.is_empty() {
        handle_event_loop_result(&cx.duplicate(), rt.run_event_loop().await);

        let mut new_pending_responses = vec![];
        for (pending, resp_tx) in requests {
            let response = handler.finish_request(cx.duplicate(), pending);
            match response {
                Ok(Either::Left(pending)) => new_pending_responses.push((pending, resp_tx)),
                Ok(Either::Right(response)) => {
                    if let Some(fut) = response.body_future {
                        stream_body_futures.push(fut);
                    }
                    ignore_error(resp_tx.send(ResponseData::Done(response.response)));
                }
                Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
            }
        }

        requests = new_pending_responses;
    }

    // Wait for any pending promises to be resolved
    handle_event_loop_result(&cx.duplicate(), rt.run_event_loop().await);

    // Wait for all stream bodies to be written
    while !stream_body_futures.is_empty() {
        stream_body_futures.next().await;
    }

    Ok(())
}

async fn handle_requests(
    handler: Box<dyn RequestHandler>,
    user_code: UserCode,
    mut recv: tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
) {
    if let Err(e) = handle_requests_inner(handler, user_code, &mut recv).await {
        // The request handling logic itself failed, so we send back the error
        // as long as the thread is alive and shutdown has not been requested.
        // This lets us report the error. The runner can shut us down as soon
        // as it discovers the error.

        let mut error = Some(e);

        loop {
            match recv.recv().await {
                None | Some(ControlMessage::Shutdown) => break,
                Some(ControlMessage::HandleRequest(_, resp_tx)) => {
                    ignore_error(resp_tx.send(ResponseData::ScriptError(error.take())))
                }
            }
        }
    }
}

fn handle_event_loop_result(cx: &Context, r: Result<(), Option<ErrorReport>>) {
    if let Err(e) = r {
        println!(
            "Unhandled error from event loop: {}",
            error_report_option_to_anyhow_error(cx, e)
        )
    }
}

pub struct RequestData {
    _addr: std::net::SocketAddr,
    req: http::request::Parts,
    body: hyper::Body,
}

#[derive(Debug)]
pub enum ResponseData {
    Done(hyper::Response<hyper::Body>),
    RequestError(anyhow::Error),

    // The error can only be returned once, so future calls to the
    // thread will return None instead
    ScriptError(Option<anyhow::Error>),
}

pub enum ControlMessage {
    HandleRequest(RequestData, tokio::sync::oneshot::Sender<ResponseData>),
    Shutdown,
}

impl std::fmt::Debug for ControlMessage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HandleRequest(_, _) => write!(f, "HandleRequest"),
            Self::Shutdown => write!(f, "Shutdown"),
        }
    }
}

pub struct WorkerThreadInfo {
    thread: std::thread::JoinHandle<()>,
    channel: tokio::sync::mpsc::UnboundedSender<ControlMessage>,
    in_flight_requests: Arc<AtomicI32>,
}

// TODO: clean shutdown
// TODO: replace failing threads
pub struct SingleRunner {
    threads: Vec<WorkerThreadInfo>,
    max_threads: usize,
    handler: Box<dyn RequestHandler>,
    user_code: UserCode,
}

pub type SharedSingleRunner = Arc<Mutex<SingleRunner>>;

impl SingleRunner {
    pub fn new(max_threads: usize, handler: Box<dyn RequestHandler>, user_code: UserCode) -> Self {
        if max_threads == 0 {
            panic!("max_threads must be at least 1");
        }

        Self {
            threads: vec![],
            max_threads,
            handler,
            user_code,
        }
    }

    pub fn new_request_handler(
        handler: Box<dyn RequestHandler>,
        max_threads: usize,
        user_code: UserCode,
    ) -> Arc<Mutex<Self>> {
        Arc::new(Mutex::new(Self::new(max_threads, handler, user_code)))
    }

    fn spawn_thread(&mut self) -> &WorkerThreadInfo {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        let handler = self.handler.clone();
        let user_code = self.user_code.clone();
        let join_handle = std::thread::spawn(move || {
            tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap()
                .block_on(async move {
                    let local_set = LocalSet::new();
                    local_set
                        .run_until(handle_requests(handler, user_code, rx))
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
        debug!("Starting new handler thread #{spawned_index}");
        &self.threads[spawned_index]
    }

    fn find_or_spawn_thread(&mut self) -> &WorkerThreadInfo {
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
                debug!("Using idle handler thread #{}", t.0);
                return &self.threads[t.0];
            }
        }

        // Step 2: can we spawn a new thread?
        if self.threads.len() < self.max_threads {
            return self.spawn_thread();
        }

        // Step 3: find the thread with the least active requests
        // unwrap safety: request_counts can never be empty
        let min = request_counts.iter().min_by_key(|t| t.1).unwrap();
        debug!(
            "Reusing busy handler thread #{} with in-flight request count {}",
            min.0,
            self.threads[min.0]
                .in_flight_requests
                .load(std::sync::atomic::Ordering::SeqCst)
        );
        &self.threads[min.0]
    }
}

#[async_trait]
impl crate::server::Runner for Arc<Mutex<SingleRunner>> {
    async fn handle(
        &self,
        _addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
        let mut this = self.lock().await;
        let thread = this.find_or_spawn_thread();

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
