mod crypto;
mod event_listener;
mod fetch_event;
mod performance;

mod watch;
pub use watch::WatchRunner;

use std::{
    path::Path,
    pin::Pin,
    sync::{atomic::AtomicI32, Arc},
    time::Duration,
};

use anyhow::{anyhow, bail};
use async_trait::async_trait;
use futures::{
    future::Either,
    stream::{FuturesUnordered, StreamExt},
    Future,
};
use ion::{conversions::ToValue, script::Script, ClassDefinition, Context, ErrorReport, Promise};
use mozjs::{
    jsapi::PromiseState,
    rust::{JSEngine, JSEngineHandle, RealmOptions},
};
use runtime::{
    modules::{init_global_module, init_module, StandardModules},
    RuntimeBuilder,
};
use tokio::{select, sync::Mutex, task::LocalSet};
use tracing::debug;

use self::{fetch_event::FetchEvent, performance::PerformanceModule};

pub static ENGINE: once_cell::sync::Lazy<JSEngineHandle> = once_cell::sync::Lazy::new(|| {
    let engine = JSEngine::init().expect("could not create engine");
    let handle = engine.handle();
    std::mem::forget(engine);
    handle
});

#[macro_export]
macro_rules! ion_mk_err {
    ($msg:expr, $ty:ident) => {
        ion::Error::new($msg, ion::ErrorKind::$ty)
    };
}

#[macro_export]
macro_rules! ion_err {
    ($msg:expr, $ty:ident) => {
        return Err($crate::ion_mk_err!($msg, $ty));
    };
}

// Used to ignore errors when sending responses back, since
// if the receiving end of the oneshot channel is dropped,
// there really isn't anything we can do
fn ignore_error<E>(_r: std::result::Result<(), E>) {}

async fn handle_requests_inner(
    user_code: String,
    recv: &mut tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
) -> Result<(), anyhow::Error> {
    let mozjs_rt = mozjs::rust::Runtime::new(ENGINE.clone());

    let mut cx = Context::from_runtime(&mozjs_rt);
    let mut realm_options = RealmOptions::default();
    realm_options.creationOptions_.streams_ = true;
    // TODO: module loader?
    let rt = RuntimeBuilder::<(), _>::new()
        .microtask_queue()
        .macrotask_queue()
        .standard_modules(Modules)
        .realm_options(realm_options)
        .build(&mut cx);

    let cx = Context::from_runtime(&mozjs_rt);

    // Evaluate the user script, hopefully resulting in the fetch handler being registered
    Script::compile_and_evaluate(rt.cx(), Path::new("app.js"), user_code.as_str())
        .map_err(|e| error_report_to_anyhow_error(&cx, e))?;

    // Wait for any promises resulting from running the script to be resolved, giving
    // scripts a chance to initialize before accepting requests
    rt.run_event_loop()
        .await
        .map_err(|e| error_report_option_to_anyhow_error(&cx, e))?;

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
                        match start_request(&cx, req.req, req.body) {
                            Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
                            Ok(Either::Left(pending)) => requests.push((pending, resp_tx)),
                            Ok(Either::Right(resp)) => {
                                if let Some(fut) = resp.1 {
                                    stream_body_futures.push(fut);
                                }
                                ignore_error(resp_tx.send(ResponseData::Done(resp.0)))
                            },
                        }
                    }
                }
            }

            // Nothing to do here except check the error, the promises are checked further down
            e = rt.run_event_loop() => {
                e.map_err(|e| error_report_option_to_anyhow_error(&cx, e))?;
            }

            // Nothing to do
            _ = stream_body_futures.next(), if !stream_body_futures.is_empty() => {}

            // Nothing to do
            _ = tokio::time::sleep(poll_interval) => {}
        }

        // We have to do this convoluted bit of code because drain_filter is not stable
        let mut i = 0;
        while i < requests.len() {
            if requests[i].0.promise.state(&cx) != PromiseState::Pending {
                let (pending, resp_tx) = requests.swap_remove(i);
                let response = build_response_from_pending(&cx, pending);
                match response {
                    Ok(response) => {
                        if let Some(fut) = response.1 {
                            stream_body_futures.push(fut);
                        }
                        ignore_error(resp_tx.send(ResponseData::Done(response.0)));
                    }
                    Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
                }
            } else {
                i += 1;
            }
        }
    }

    rt.run_event_loop()
        .await
        .map_err(|e| error_report_option_to_anyhow_error(&cx, e))?;

    for (pending, resp_tx) in requests {
        let response = build_response_from_pending(&cx, pending);
        match response {
            Ok(response) => {
                if let Some(fut) = response.1 {
                    stream_body_futures.push(fut);
                }
                ignore_error(resp_tx.send(ResponseData::Done(response.0)));
            }
            Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
        }
    }

    while !stream_body_futures.is_empty() {
        stream_body_futures.next().await;
    }

    Ok(())
}

async fn handle_requests(
    user_code: String,
    mut recv: tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
) {
    if let Err(e) = handle_requests_inner(user_code, &mut recv).await {
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

struct ReadyResponse(
    hyper::Response<hyper::Body>,
    Option<Pin<Box<dyn Future<Output = ()>>>>,
);

struct PendingResponse {
    promise: ion::Promise,
}

fn start_request<'cx>(
    cx: &'cx Context,
    req: http::request::Parts,
    body: hyper::Body,
) -> anyhow::Result<Either<PendingResponse, ReadyResponse>> {
    let fetch_event = ion::Object::from(cx.root_object(FetchEvent::new_object(
        cx,
        Box::new(FetchEvent::try_new(&cx, req, body)?),
    )));

    let callback_rval =
        event_listener::invoke_fetch_event_callback(&cx, &[fetch_event.as_value(cx)]).map_err(
            |e| {
                e.map(|e| error_report_to_anyhow_error(&cx, e))
                    .unwrap_or(anyhow::anyhow!("Script execution failed"))
            },
        )?;

    if !callback_rval.get().is_undefined() {
        bail!("Script error: the fetch event handler should not return a value");
    }

    let fetch_event = FetchEvent::get_private(&fetch_event);

    match fetch_event.response.as_ref() {
        None => {
            bail!("Script error: FetchEvent.respondWith must be called with a Response object before returning")
        }
        Some(response) => {
            let response = ion::Object::from(response.root(cx));

            if Promise::is_promise(&response) {
                Ok(Either::Left(PendingResponse {
                    promise: unsafe { Promise::from_unchecked(response.into_local()) },
                }))
            } else {
                Ok(Either::Right(build_response(cx, response)?))
            }
        }
    }
}

// The promise must be fulfilled or rejected before calling this function,
// otherwise an error is returned
fn build_response_from_pending<'cx>(
    cx: &'cx Context,
    response: PendingResponse,
) -> anyhow::Result<ReadyResponse> {
    match response.promise.state(cx) {
        PromiseState::Pending => {
            bail!("Internal error: promise is not fulfilled yet");
        }
        PromiseState::Rejected => {
            let result = response.promise.result(cx);
            let message = result
                .to_object(cx)
                .get(cx, "message")
                .and_then(|v| {
                    if v.get().is_string() {
                        Some(ion::String::from(cx.root_string(v.get().to_string())).to_owned(cx))
                    } else {
                        None
                    }
                })
                .unwrap_or("<No error message>".to_string());
            bail!("Script execution failed: {message}")
        }
        PromiseState::Fulfilled => {
            let promise_result = response.promise.result(cx);
            if !promise_result.handle().is_object() {
                bail!("Script error: value provided to respondWith was not an object");
            }
            build_response(cx, promise_result.to_object(cx))
        }
    }
}

fn build_response<'cx>(
    cx: &'cx Context,
    mut value: ion::Object<'cx>,
) -> anyhow::Result<ReadyResponse> {
    if !runtime::globals::fetch::Response::instance_of(cx, &value, None) {
        // TODO: support plain objects
        bail!("If an object is returned, it must be an instance of Response");
    }

    let response = runtime::globals::fetch::Response::get_mut_private(&mut value);

    let mut hyper_response = hyper::Response::builder().status(response.get_status());

    let headers =
        anyhow::Context::context(hyper_response.headers_mut(), "Response has no headers")?;
    let response_headers = response.get_headers_object(cx);
    for header in response_headers.iter() {
        headers.append(header.0.clone(), header.1.clone());
    }

    let body = response
        .take_body()
        .map_err(|e| anyhow!("Failed to read response body: {e:?}"))?;

    let (body, future) = body
        .into_http_body(cx.duplicate())
        .map_err(|e| anyhow!("Failed to create HTTP body: {e:?}"))?;
    Ok(ReadyResponse(
        hyper_response.body(body)?,
        future.map(|f| -> Pin<Box<dyn Future<Output = ()>>> { Box::pin(f) }),
    ))
}

fn error_report_to_anyhow_error(cx: &Context, error_report: ErrorReport) -> anyhow::Error {
    // TODO: include stack
    anyhow::anyhow!("Runtime error: {}", error_report.exception.format(cx))
}

fn error_report_option_to_anyhow_error(
    cx: &Context,
    error_report: Option<ErrorReport>,
) -> anyhow::Error {
    match error_report {
        Some(e) => error_report_to_anyhow_error(cx, e),
        None => anyhow!("Unknown runtime error"),
    }
}

pub struct RequestData {
    _addr: std::net::SocketAddr,
    req: http::request::Parts,
    body: hyper::Body,
}

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
pub struct IonRunner {
    threads: Vec<WorkerThreadInfo>,
    max_threads: usize,
    user_code: String,
}

pub type SharedIonRunner = Arc<Mutex<IonRunner>>;

impl IonRunner {
    pub fn new(max_threads: usize, user_code: String) -> Self {
        if max_threads == 0 {
            panic!("max_threads must be at least 1");
        }

        Self {
            threads: vec![],
            max_threads,
            user_code,
        }
    }

    pub fn new_request_handler(max_threads: usize, user_code: String) -> Arc<Mutex<Self>> {
        Arc::new(Mutex::new(Self::new(max_threads, user_code)))
    }

    fn spawn_thread(&mut self) -> &WorkerThreadInfo {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        let user_code = self.user_code.clone();
        let join_handle = std::thread::spawn(move || {
            tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap()
                .block_on(async move {
                    let local_set = LocalSet::new();
                    local_set.run_until(handle_requests(user_code, rx)).await
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
impl crate::server::RequestHandler for Arc<Mutex<IonRunner>> {
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

struct Modules;

impl StandardModules for Modules {
    fn init(self, cx: &Context, global: &mut ion::Object) -> bool {
        init_module::<PerformanceModule>(cx, global)
            && init_module::<crypto::CryptoModule>(cx, global)
            && init_module::<modules::Assert>(cx, global)
            && init_module::<modules::FileSystem>(cx, global)
            && init_module::<modules::PathM>(cx, global)
            && init_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && fetch_event::FetchEvent::init_class(cx, global).0
            && crypto::define(cx, global)
    }

    fn init_globals(self, cx: &Context, global: &mut ion::Object) -> bool {
        init_global_module::<PerformanceModule>(cx, global)
            && init_global_module::<crypto::CryptoModule>(cx, global)
            && init_global_module::<modules::Assert>(cx, global)
            && init_global_module::<modules::FileSystem>(cx, global)
            && init_global_module::<modules::PathM>(cx, global)
            && init_global_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && fetch_event::FetchEvent::init_class(cx, global).0
            && crypto::define(cx, global)
    }
}
