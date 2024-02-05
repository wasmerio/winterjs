mod internal_js_modules;
mod watch;

pub use watch::WatchRunner;

use std::{
    ffi::OsString,
    path::{Path, PathBuf},
    pin::Pin,
    sync::{atomic::AtomicI32, Arc},
    time::Duration,
};

use anyhow::{anyhow, bail, Context as _};
use async_trait::async_trait;
use futures::{
    future::Either,
    stream::{FuturesUnordered, StreamExt},
    Future,
};
use ion::{
    conversions::ToValue, module::Module, script::Script, ClassDefinition, Context, ErrorReport,
    Promise,
};
use mozjs::{
    jsapi::{PromiseState, WeakRefSpecifier},
    rust::{JSEngine, JSEngineHandle, RealmOptions},
};
use runtime::{
    modules::{init_global_module, init_module, StandardModules},
    RuntimeBuilder,
};
use tokio::{select, sync::Mutex, task::LocalSet};
use tracing::debug;

use crate::builtins::{
    cache, core, crypto, event_listener,
    fetch_event::{self, FetchEvent},
    performance::PerformanceModule,
};

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
        return Err($crate::ion_mk_err!($msg, $ty))
    };
}

// Used to ignore errors when sending responses back, since
// if the receiving end of the oneshot channel is dropped,
// there really isn't anything we can do
fn ignore_error<E>(_r: std::result::Result<(), E>) {}

async fn handle_requests_inner(
    user_code: UserCode,
    recv: &mut tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
) -> Result<(), anyhow::Error> {
    let is_module_mode = matches!(user_code, UserCode::Module(_));

    let mozjs_rt = mozjs::rust::Runtime::new(ENGINE.clone());

    let mut cx = Context::from_runtime(&mozjs_rt);
    let mut realm_options = RealmOptions::default();
    realm_options.creationOptions_.streams_ = true;
    realm_options.creationOptions_.weakRefs_ = WeakRefSpecifier::EnabledWithCleanupSome;
    // TODO: module loader?
    let rt_builder = RuntimeBuilder::<_, _>::new()
        .microtask_queue()
        .macrotask_queue()
        .standard_modules(Modules {
            include_internal: is_module_mode,
        })
        .realm_options(realm_options);

    let rt_builder = if is_module_mode {
        rt_builder.modules(runtime::modules::Loader::default())
    } else {
        rt_builder
    };

    let rt = rt_builder.build(&mut cx);

    let cx = Context::from_runtime(&mozjs_rt);

    // Evaluate the user script, hopefully resulting in the fetch handler being registered
    // Script::compile_and_evaluate(rt.cx(), Path::new("app.js"), user_code.as_str())
    //     .map_err(|e| error_report_to_anyhow_error(&cx, e))?;

    match user_code {
        UserCode::Script { code, file_name } => {
            Script::compile_and_evaluate(rt.cx(), Path::new(&file_name), code.as_str())
                .map_err(|e| error_report_to_anyhow_error(&cx, e))?;
        }
        UserCode::Module(path) => {
            let file_name = path
                .file_name()
                .ok_or(anyhow!("Failed to get file name from script path"))
                .map(|f| f.to_string_lossy().into_owned())?;

            let code = std::fs::read_to_string(&path).context("Failed to read script file")?;

            Module::compile_and_evaluate(&cx, &file_name, Some(&path), &code).map_err(|e| {
                error_report_option_to_anyhow_error(&cx, Some(e.report)).context(format!(
                    "Error while loading module during {:?} step",
                    e.kind
                ))
            })?;
        }
    }

    // Wait for any promises resulting from running the script to be resolved, giving
    // scripts a chance to initialize before accepting requests
    // Note we will return the error here if one happens, since an error happening
    // in this stage means the script didn't initialize successfully.
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
                        match start_request(cx.duplicate(), req.req, req.body) {
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
                // Note: an error in this stage is an unhandled error happening in the request
                // logic, and such an error should not terminate the whole request processing
                // thread.
                handle_event_loop_result(&cx.duplicate(), e)
            }

            // Nothing to do
            _ = stream_body_futures.next(), if !stream_body_futures.is_empty() => {}

            // Nothing to do
            _ = tokio::time::sleep(poll_interval) => {}
        }

        // We have to do this convoluted bit of code because drain_filter is not stable
        let mut i = 0;
        while i < requests.len() {
            if requests[i].0.promise.state(&cx.duplicate()) != PromiseState::Pending {
                let (pending, resp_tx) = requests.swap_remove(i);
                let response = build_response_from_pending(cx.duplicate(), pending);
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

    handle_event_loop_result(&cx.duplicate(), rt.run_event_loop().await);

    for (pending, resp_tx) in requests {
        let response = build_response_from_pending(cx.duplicate(), pending);
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
    user_code: UserCode,
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

fn handle_event_loop_result(cx: &Context, r: Result<(), Option<ErrorReport>>) {
    if let Err(e) = r {
        println!(
            "Unhandled error from event loop: {}",
            error_report_option_to_anyhow_error(cx, e)
        )
    }
}

struct ReadyResponse(
    hyper::Response<hyper::Body>,
    Option<Pin<Box<dyn Future<Output = ()>>>>,
);

struct PendingResponse {
    promise: ion::Promise,
}

fn start_request(
    cx: Context,
    req: http::request::Parts,
    body: hyper::Body,
) -> anyhow::Result<Either<PendingResponse, ReadyResponse>> {
    let fetch_event = ion::Object::from(cx.root_object(FetchEvent::new_object(
        &cx,
        Box::new(FetchEvent::try_new(&cx, req, body)?),
    )));

    let callback_rval =
        event_listener::invoke_fetch_event_callback(&cx, &[fetch_event.as_value(&cx)]).map_err(
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
            let response = ion::Object::from(response.root(&cx));

            if Promise::is_promise(&response) {
                Ok(Either::Left(PendingResponse {
                    promise: unsafe { Promise::from_unchecked(response.into_local()) },
                }))
            } else {
                Ok(Either::Right(build_response(&cx, response)?))
            }
        }
    }
}

// The promise must be fulfilled or rejected before calling this function,
// otherwise an error is returned
fn build_response_from_pending(
    cx: Context,
    response: PendingResponse,
) -> anyhow::Result<ReadyResponse> {
    match response.promise.state(&cx) {
        PromiseState::Pending => {
            bail!("Internal error: promise is not fulfilled yet");
        }
        PromiseState::Rejected => {
            let result = response.promise.result(&cx);
            let message = result
                .to_object(&cx)
                .get(&cx, "message")
                .and_then(|v| {
                    if v.get().is_string() {
                        Some(ion::String::from(cx.root_string(v.get().to_string())).to_owned(&cx))
                    } else {
                        None
                    }
                })
                .unwrap_or("<No error message>".to_string());
            bail!("Script execution failed: {message}")
        }
        PromiseState::Fulfilled => {
            let promise_result = response.promise.result(&cx);
            if !promise_result.handle().is_object() {
                bail!("Script error: value provided to respondWith was not an object");
            }
            build_response(&cx, promise_result.to_object(&cx))
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
    match error_report.stack {
        Some(stack) => anyhow::anyhow!(
            "Script error: {}\nat:\n{}",
            error_report.exception.format(cx),
            stack.format()
        ),
        None => anyhow::anyhow!("Runtime error: {}", error_report.exception.format(cx)),
    }
}

fn error_report_option_to_anyhow_error(
    cx: &Context,
    error_report: Option<ErrorReport>,
) -> anyhow::Error {
    match error_report {
        Some(e) => error_report_to_anyhow_error(cx, e),
        None => anyhow!("Unknown script error"),
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

#[derive(Clone, Debug)]
pub enum UserCode {
    Script { code: String, file_name: OsString },
    Module(PathBuf),
}

impl UserCode {
    pub async fn from_path(path: &PathBuf, script: bool) -> anyhow::Result<Self> {
        if script {
            let code = tokio::fs::read_to_string(&path).await.with_context(|| {
                format!("Could not read Javascript file at '{}'", path.display())
            })?;
            let file_name = path
                .file_name()
                .map(|p| p.to_os_string())
                .unwrap_or(OsString::from("app.js"));
            Ok(Self::Script { code, file_name })
        } else {
            let path = runtime::wasi_polyfills::canonicalize(path)
                .context("Failed to canonicalize root module path")?;
            let metadata = tokio::fs::metadata(&path)
                .await
                .context("Failed to read module file")?;
            if !metadata.is_file() {
                bail!("Path does not point to a file: {}", path.display());
            }
            Ok(Self::Module(path))
        }
    }
}

// TODO: clean shutdown
// TODO: replace failing threads
pub struct IonRunner {
    threads: Vec<WorkerThreadInfo>,
    max_threads: usize,
    user_code: UserCode,
}

pub type SharedIonRunner = Arc<Mutex<IonRunner>>;

impl IonRunner {
    pub fn new(max_threads: usize, user_code: UserCode) -> Self {
        if max_threads == 0 {
            panic!("max_threads must be at least 1");
        }

        Self {
            threads: vec![],
            max_threads,
            user_code,
        }
    }

    pub fn new_request_handler(max_threads: usize, user_code: UserCode) -> Arc<Mutex<Self>> {
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

struct Modules {
    include_internal: bool,
}

impl StandardModules for Modules {
    fn init(self, cx: &Context, global: &mut ion::Object) -> bool {
        let result = init_module::<PerformanceModule>(cx, global)
            && init_module::<core::CoreModule>(cx, global)
            && init_module::<modules::Assert>(cx, global)
            && init_module::<modules::FileSystem>(cx, global)
            && init_module::<modules::PathM>(cx, global)
            && init_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && fetch_event::FetchEvent::init_class(cx, global).0
            && crypto::define(cx, global)
            && cache::define(cx, global);

        if self.include_internal {
            result && internal_js_modules::define(cx)
        } else {
            result
        }
    }

    fn init_globals(self, cx: &Context, global: &mut ion::Object) -> bool {
        if self.include_internal {
            tracing::error!(
                "Internal error: trying to initialize internal modules in global object mode"
            );
            return false;
        }

        init_global_module::<PerformanceModule>(cx, global)
            && init_global_module::<modules::Assert>(cx, global)
            && init_global_module::<modules::FileSystem>(cx, global)
            && init_global_module::<modules::PathM>(cx, global)
            && init_global_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && fetch_event::FetchEvent::init_class(cx, global).0
            && crypto::define(cx, global)
            && cache::define(cx, global)
    }
}
