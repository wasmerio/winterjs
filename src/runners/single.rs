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
use ion::{Context, TracedHeap};
use mozjs::{jsapi::JSContext, jsval::JSVal};
use tokio::{
    select,
    sync::{oneshot, Mutex},
    task::LocalSet,
};

use crate::{
    builtins,
    request_handlers::{Either, Request, RequestHandler, UserCode},
    runners::ResponseData,
    sm_utils::{error_report_option_to_anyhow_error, JsApp, TwoStandardModules},
};

use super::{
    event_loop_stream::EventLoopStream,
    request_queue::{RequestFinishedHandler, RequestFinishedResult, RequestQueue},
};

// Used to ignore errors when sending responses back, since
// if the receiving end of the oneshot channel is dropped,
// there really isn't anything we can do
fn ignore_error<E>(_r: std::result::Result<(), E>) {}

async fn handle_requests_inner<H: RequestHandler + Copy + Unpin>(
    mut handler: H,
    user_code: UserCode,
    recv: &mut tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
    max_request_threads: u32,
) -> Result<(), anyhow::Error> {
    let is_module_mode = match user_code {
        UserCode::Script { .. } => false,
        UserCode::Directory(_) | UserCode::Module(_) => true,
    };

    let module_loader = is_module_mode.then(runtime::module::Loader::default);
    let standard_modules = TwoStandardModules(
        builtins::Modules {
            include_internal: is_module_mode,
            hardware_concurrency: max_request_threads,
        },
        handler.get_standard_modules(),
    );

    let js_app = JsApp::build(module_loader, Some(standard_modules));
    let cx = js_app.cx();
    let rt = js_app.rt();
    let mut event_loop_stream = EventLoopStream { app: &js_app };

    handler.evaluate_scripts(cx, &user_code)?;

    // Wait for any promises resulting from running the script to be resolved, giving
    // scripts a chance to initialize before accepting requests
    // Note we will return the error here if one happens, since an error happening
    // in this stage means the script didn't initialize successfully.
    rt.run_event_loop()
        .await
        .map_err(|e| error_report_option_to_anyhow_error(cx, e))?;

    let mut request_queue = RequestQueue::new(cx);

    let mut shutdown_requested = false;

    loop {
        if shutdown_requested && rt.event_loop_is_empty() && request_queue.is_empty() {
            break;
        }

        select! {
            msg = recv.recv() => {
                match msg {
                    None | Some(ControlMessage::Shutdown) => {
                        shutdown_requested = true;
                    },
                    Some(ControlMessage::Terminate) => {
                        request_queue.cancel_all(RequestCancelledReason::ServerShuttingDown);
                        return Ok(());
                    }
                    Some(ControlMessage::HandleRequest(req, resp_tx)) => {
                        if shutdown_requested {
                            ignore_error(resp_tx.send(ResponseData::ScriptError(Some(
                                anyhow!("New request received after shutdown requested")
                            ))));
                        } else {
                            handle_new_request(
                                cx,
                                handler,
                                &mut request_queue,
                                req,
                                resp_tx
                            );
                        }
                    }
                }
            }

            // Nothing to do
            _ = request_queue.next() => (),

            // Nothing to do here except check the error
            e = event_loop_stream.next() => {
                match e {
                    Some(Ok(())) => {
                        request_queue.cancel_unfinished(RequestCancelledReason::Unresolvable).await;
                    }
                    Some(Err(e)) => {
                        // Note: an error in this stage is an unhandled error happening in the request
                        // logic, and such an error should not terminate the whole request processing
                        // thread.
                        println!(
                            "Unhandled error from event loop: {}",
                            error_report_option_to_anyhow_error(cx, e)
                        );
                    },
                    None => unreachable!("EventLoopStream should never terminate")
                }
            }
        }
    }

    Ok(())
}

async fn handle_requests<H: RequestHandler + Copy + Unpin>(
    handler: H,
    user_code: UserCode,
    mut recv: tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
    max_request_threads: u32,
) {
    if let Err(e) = handle_requests_inner(handler, user_code, &mut recv, max_request_threads).await
    {
        // The request handling logic itself failed, so we send back the error
        // as long as the thread is alive and shutdown has not been requested.
        // This lets us report the error. The runner can shut us down as soon
        // as it discovers the error.

        let mut error = Some(e);

        loop {
            match recv.recv().await {
                None | Some(ControlMessage::Shutdown) | Some(ControlMessage::Terminate) => break,
                Some(ControlMessage::HandleRequest(_, resp_tx)) => {
                    ignore_error(resp_tx.send(ResponseData::ScriptError(error.take())))
                }
            }
        }
    }
}

fn handle_new_request<H: RequestHandler + Copy + Unpin>(
    cx: &Context,
    mut handler: H,
    request_queue: &mut RequestQueue<RequestFinishedCallback<H>>,
    req: RequestData,
    resp_tx: oneshot::Sender<ResponseData>,
) {
    tracing::trace!(%req.req.method, %req.req.uri, ?req.req.headers, "Incoming request");
    match handler.start_handling_request(
        cx.duplicate(),
        Request {
            parts: req.req,
            body: req.body,
        },
    ) {
        Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
        Ok(Either::Left(pending)) => request_queue.push(
            pending,
            RequestFinishedCallback {
                cx: cx.as_ptr(),
                handler,
                resp_tx: Some(resp_tx),
            },
        ),
        Ok(Either::Right(resp)) => {
            if let Some(fut) = resp.body_future {
                request_queue.push_continuation(fut);
            }
            ignore_error(resp_tx.send(ResponseData::Done(resp.response)))
        }
    }
}

#[derive(Clone, Copy)]
enum RequestCancelledReason {
    Unresolvable,
    ServerShuttingDown,
}

struct RequestFinishedCallback<H: RequestHandler + Copy + Unpin> {
    cx: *mut JSContext,
    handler: H,
    resp_tx: Option<oneshot::Sender<ResponseData>>,
}

impl<H: RequestHandler + Copy + Unpin> RequestFinishedCallback<H> {
    fn get_resp_tx(&mut self) -> oneshot::Sender<ResponseData> {
        self.resp_tx
            .take()
            .expect("resp_tx should be used once only")
    }
}

impl<H: RequestHandler + Copy + Unpin> RequestFinishedHandler for RequestFinishedCallback<H> {
    type CancelReason = RequestCancelledReason;

    fn request_finished(
        &mut self,
        result: Result<TracedHeap<JSVal>, TracedHeap<JSVal>>,
    ) -> RequestFinishedResult {
        let response = self
            .handler
            .finish_request(unsafe { Context::new_unchecked(self.cx) }, result);
        match response {
            Ok(Either::Left(pending)) => RequestFinishedResult::Pending(pending.promise),
            Ok(Either::Right(response)) => {
                ignore_error(
                    self.get_resp_tx()
                        .send(ResponseData::Done(response.response)),
                );

                if let Some(fut) = response.body_future {
                    RequestFinishedResult::HasContinuation(fut)
                } else {
                    RequestFinishedResult::Done
                }
            }
            Err(f) => {
                ignore_error(self.get_resp_tx().send(ResponseData::RequestError(f)));
                RequestFinishedResult::Done
            }
        }
    }

    fn request_cancelled(&mut self, reason: RequestCancelledReason) {
        match reason {
            RequestCancelledReason::Unresolvable => {
                let response = hyper::Response::builder()
                    .status(500)
                    .body(hyper::Body::from("The request could not be completed"))
                    .expect("Failed to construct 500 response");
                ignore_error(self.get_resp_tx().send(ResponseData::Done(response)));
                tracing::warn!(
                    "Request deemed impossible to complete since all IO-related promises \
                have been resolved but the request's promise is still in pending state"
                );
            }

            RequestCancelledReason::ServerShuttingDown => {
                let response = hyper::Response::builder()
                    .status(503)
                    .body(hyper::Body::from("Server is shutting down"))
                    .expect("Failed to construct 503 response");

                ignore_error(self.get_resp_tx().send(ResponseData::Done(response)));
            }
        }
    }
}

pub struct RequestData {
    _addr: std::net::SocketAddr,
    req: http::request::Parts,
    body: hyper::Body,
}

pub enum ControlMessage {
    HandleRequest(RequestData, tokio::sync::oneshot::Sender<ResponseData>),
    Shutdown,
    Terminate,
}

impl std::fmt::Debug for ControlMessage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HandleRequest(_, _) => write!(f, "HandleRequest"),
            Self::Shutdown => write!(f, "Shutdown"),
            Self::Terminate => write!(f, "Terminate"),
        }
    }
}

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
