use std::{
    cell::OnceCell,
    collections::HashMap,
    marker::PhantomData,
    path::{Path, PathBuf},
    sync::Arc,
};

use crate::{
    ion_mk_err,
    sm_utils::{self, error_report_option_to_anyhow_error},
};

use self::routes::Routes;

use super::{
    ByRefStandardModules, Either, NewRequestHandler, PendingResponse, ReadyResponse, Request,
    RequestHandler, UserCode,
};
use anyhow::{bail, Context as _, Result};
use http::Uri;
use ion::{ClassDefinition, Context, Function, Object, Promise, TracedHeap, Value};
use mozjs_sys::jsapi::JSFunction;
use runtime::{globals::fetch::Response as FetchResponse, promise::future_to_promise, ContextExt};
use static_web_server::{
    exts::path::PathExt,
    handler::{RequestHandler as SwsRequestHandler, RequestHandlerOpts as SwsRequestHandlerOpts},
};

mod context;
mod env;
mod routes;

// Still operating under the one-handler-per-thread model. The correct way
// would to attach this to the context in some way.
thread_local! {
    static SWS_OPTS: OnceCell<Arc<SwsRequestHandlerOpts>> = const { OnceCell::new() };
}

#[derive(Clone, Copy)]
pub struct New;

#[derive(Clone, Copy)]
pub struct Initialized;

#[derive(Clone, Copy)]
pub struct CloudflareRequestHandler<State> {
    _state: PhantomData<State>,
}

enum CloudflareRequestHandlerMode {
    // This mode gets picked if we get a file or a directory with a _worker.js
    // in it.
    // The function is exported fetch function, if running in module mode and
    // one is found. If not, we assume the script registered an event handler.
    SingleSourceFile,
    // TODO: support this mode
    // Directory(PathBuf),
}

use CloudflareRequestHandlerMode::*;

struct CloudflareRequestHandlerPrivate {
    mode: CloudflareRequestHandlerMode,

    // map of paths to modules. In SingleSourceFile mode, this contains exactly
    // one entry with an empty path for the key.
    modules: HashMap<PathBuf, CloudflareCodeModule>,

    routes: Option<Routes>,

    assets_dir_path: Option<PathBuf>,
}

struct CloudflareCodeModule {
    fetch_function: Option<TracedHeap<*mut JSFunction>>,
}

pub fn new_handler() -> CloudflareRequestHandler<New> {
    CloudflareRequestHandler::<New> {
        _state: PhantomData,
    }
}

impl NewRequestHandler for CloudflareRequestHandler<New> {
    type InitializedHandler = CloudflareRequestHandler<Initialized>;

    fn get_standard_modules(&self) -> Box<dyn super::ByRefStandardModules> {
        Box::new(CloudflareStandardModules)
    }

    fn evaluate_scripts(self, cx: &Context, code: &UserCode) -> Result<Self::InitializedHandler> {
        if unsafe { cx.get_private() }.app_data.is_some() {
            bail!("Internal error: evaluate_scripts should only be called once");
        }

        let private: CloudflareRequestHandlerPrivate;

        match code {
            UserCode::Script { code, file_name } => {
                sm_utils::evaluate_script(cx, code, file_name)?;
                // Note: can't use exports in script mode, so the only option is
                // an event handler
                private = CloudflareRequestHandlerPrivate {
                    mode: SingleSourceFile,
                    modules: Default::default(),
                    routes: None,
                    assets_dir_path: None,
                };
            }

            // TODO: I'm pretty sure more functionality needs to be shared between
            // Module mode and Directory mode.
            UserCode::Module(path) => {
                let dir_path = path.parent().expect("File path without a parent");
                let assets_path = dir_path.join("assets");
                let have_assets = std::fs::metadata(&assets_path).is_ok_and(|i| i.is_dir());

                if have_assets {
                    build_sws_request_handler(&assets_path);
                } else {
                    build_sws_request_handler(dir_path);
                }

                private = CloudflareRequestHandlerPrivate {
                    mode: SingleSourceFile,
                    modules: [(PathBuf::new(), eval_module(cx, path)?)]
                        .into_iter()
                        .collect(),
                    routes: None,
                    assets_dir_path: if have_assets { Some(assets_path) } else { None },
                };
            }

            UserCode::Directory(path) => match discover_worker_js(path)? {
                Some(worker_js_path) => {
                    let routes = Routes::try_parse(path)?;
                    if routes.is_none() {
                        tracing::info!(
                            "_routes.json file not found, all requests will be routed to _worker.js"
                        );
                    }
                    build_sws_request_handler(path);
                    private = CloudflareRequestHandlerPrivate {
                        mode: SingleSourceFile,
                        modules: [(PathBuf::new(), eval_module(cx, worker_js_path)?)]
                            .into_iter()
                            .collect(),
                        routes,
                        assets_dir_path: None,
                    };
                }
                None => {
                    bail!("Currently, only functions with a single entrypoint in _worker.js are supported");
                }
            },
        }

        let private: Box<dyn std::any::Any> = Box::<CloudflareRequestHandlerPrivate>::new(private);
        cx.set_app_data(private);

        Ok(CloudflareRequestHandler::<Initialized> {
            _state: PhantomData,
        })
    }

    fn specialize_with_scripts(
        self,
        cx: &Context,
        code: &UserCode,
    ) -> Result<Self::InitializedHandler> {
        self.evaluate_scripts(cx, code)
    }

    fn get_main_module_path(&self, code: &UserCode) -> Result<String> {
        match code {
            UserCode::Script { file_name, .. } => Ok(file_name.to_string_lossy().into_owned()),
            UserCode::Module(path) => Ok(path.to_string_lossy().into_owned()),
            UserCode::Directory(path) => Ok(discover_worker_js(path)?
                .context("Failed to discover worker file")?
                .to_string_lossy()
                .into_owned()),
        }
    }
}

impl RequestHandler for CloudflareRequestHandler<Initialized> {
    fn start_handling_request(
        &self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        if !should_route_to_function(&cx, &request.parts.uri)? {
            return Ok(Either::Left(PendingResponse {
                promise: unsafe {
                    future_to_promise::<_, _, _, ion::Error>(&cx, move |cx| async move {
                        let uri = super::build_request_uri(&request).map_err(|e| {
                            ion_mk_err!(format!("Failed to parse request URI: {e}"), Normal)
                        })?;
                        let url = url::Url::parse(uri.to_string().as_str())?;
                        let (cx, response) = cx.await_native(serve_static_file(request)).await;
                        let response = response.map_err(|e| {
                            ion_mk_err!(format!("Failed to fetch static asset due to {e}"), Normal)
                        })?;
                        let response = FetchResponse::from_hyper_response(&cx, response, url)?;
                        Ok(FetchResponse::new_object(&cx, Box::new(response)))
                    })
                    .expect("Future queue must be initialized")
                },
            }));
        }

        let private = get_private(&cx)?;
        match private.mode {
            SingleSourceFile => start_request(&cx, request, private.modules.get(&PathBuf::new())),
        }
    }

    fn finish_fulfilled_request(
        &self,
        cx: Context,
        val: Value,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        if !val.handle().is_object() {
            bail!("Script error: the value returned from handlers must be an object");
        }
        build_response(&cx, val.to_object(&cx))
    }
}

struct CloudflareStandardModules;

impl ByRefStandardModules for CloudflareStandardModules {
    fn init_modules(&self, cx: &Context, global: &Object) -> bool {
        self.init_globals(cx, global)
    }

    fn init_globals(&self, cx: &Context, global: &Object) -> bool {
        global.set_as(cx, "self", &(**global).get())
            && super::service_workers::define(cx, global)
            && self::context::define(cx, global)
    }
}

const WORKER_JS_SEARCH_PATHS: &[&str] = &["_worker.js", "_worker/index.js", "_worker.js/index.js"];

fn discover_worker_js(root: impl AsRef<Path>) -> Result<Option<PathBuf>> {
    for path in WORKER_JS_SEARCH_PATHS {
        let path = root.as_ref().join(path);
        match std::fs::metadata(&path) {
            Ok(m) if m.is_file() => return Ok(Some(path)),
            Ok(_) => (),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            Err(e) => {
                return Err(e).with_context(|| {
                    format!("Failed to look up metadata for path {}", path.display())
                })
            }
        }
    }

    Ok(None)
}

fn eval_module(cx: &Context, path: impl AsRef<Path>) -> anyhow::Result<CloudflareCodeModule> {
    let module = sm_utils::evaluate_module(cx, path)?;
    let ns = module.module_namespace(cx);
    let fetch_func = ns
        .get(cx, "default")
        .ok()
        .flatten()
        .and_then(|def| {
            if def.handle().is_object() {
                def.to_object(cx).get(cx, "fetch").ok().flatten()
            } else {
                tracing::warn!("Expected exported default to be an object");
                None
            }
        })
        .and_then(|fetch| {
            let fetch_func = fetch
                .handle()
                .is_object()
                .then(|| {
                    let obj = fetch.to_object(cx);
                    Function::from_object(cx, &obj)
                })
                .flatten();
            if fetch_func.is_none() {
                tracing::warn!("Expected exported default.fetch to be a function");
            }
            fetch_func
        });
    Ok(CloudflareCodeModule {
        fetch_function: fetch_func.map(|f| TracedHeap::from_local(&f)),
    })
}

fn should_route_to_function(cx: &Context, uri: &Uri) -> Result<bool> {
    let private = get_private(&cx)?;

    if let Some(ref routes) = private.routes {
        if !routes.should_route_to_function(uri.path()) {
            return Ok(false);
        }
    }

    if let Some(ref assets_path) = private.assets_dir_path {
        // TODO: shouldn't use blocking call here
        match std::fs::metadata(assets_path.join(
            // Need to strip the initial / to make it a relative path
            &uri.path()[1..],
        )) {
            Ok(m) if m.is_file() => return Ok(false),
            Ok(_) => return Ok(true),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(true),
            Err(e) => return Err(e.into()),
        }
    }

    Ok(true)
}

fn start_request(
    cx: &Context,
    request: Request,
    module: Option<&CloudflareCodeModule>,
) -> Result<Either<PendingResponse, ReadyResponse>> {
    match module.and_then(|m| m.fetch_function.as_ref()) {
        Some(func) => {
            let request = Value::object(
                cx,
                &cx.root(super::build_fetch_request(cx, request)?).into(),
            );
            let env = Value::object(cx, &env::new_env_object(cx));
            let ctx = Value::object(cx, &cx.root(context::Context::new_obj(cx)).into());
            let result = Function::from(func.root(cx))
                .call(cx, &Object::null(cx), &[request, env, ctx])
                .map_err(|e| error_report_option_to_anyhow_error(cx, e))?;
            if !result.handle().is_object() {
                bail!("Script error: value returned from the fetch function should be an object");
            }
            let result_obj = result.to_object(cx);
            if Promise::is_promise(&result_obj) {
                Ok(Either::Left(PendingResponse {
                    promise: unsafe { Promise::from_unchecked(result_obj.into_local()) },
                }))
            } else {
                build_response(cx, result_obj)
            }
        }

        None => super::service_workers::start_request(cx, request),
    }
}

fn build_response(cx: &Context, result: Object) -> Result<Either<PendingResponse, ReadyResponse>> {
    if Promise::is_promise(&result) {
        // in the case of env.ASSETS.fetch, we must return a promise,
        // which will be returned immediately, as in:
        //     return env.ASSETS.fetch(request);
        // So we need to receive that promise here and still wait for
        // it to be resolved. Note, we run our native futures by
        // turning them into promises so they're polled as part of
        // the main event loop.
        Ok(Either::Left(PendingResponse {
            promise: unsafe { Promise::from_unchecked(result.into_local()) },
        }))
    } else if FetchResponse::instance_of(cx, &result) {
        let response = FetchResponse::get_mut_private(cx, &result).unwrap();
        super::build_response_from_fetch_response(cx, response).map(Either::Right)
    } else {
        bail!("Script error: Unsupported object received, must be an instance of Response")
    }
}

fn get_private(cx: &Context) -> anyhow::Result<&CloudflareRequestHandlerPrivate> {
    if unsafe { cx.get_private() }.app_data.is_none() {
        bail!("Internal error: evaluate_scripts should be called before using CloudflareRequestHandler");
    }

    Ok(unsafe { cx.get_app_data::<CloudflareRequestHandlerPrivate>() })
}

fn build_sws_request_handler(path: impl AsRef<Path>) {
    tracing::debug!(path = ?path.as_ref(), "Building Static Web Server");
    SWS_OPTS.with(move |s| {
        s.get_or_init(|| {
            let path = path.as_ref().to_path_buf();

            Arc::new(static_web_server::handler::RequestHandlerOpts {
                advanced_opts: None,
                basic_auth: String::new(),
                // TODO: have WinterJS-themed defaults
                page404: std::fs::read(path.join("404.html")).unwrap_or_default(),
                page50x: std::fs::read(path.join("500.html")).unwrap_or_default(),
                page_fallback: std::fs::read(path.join("_fallback.html")).unwrap_or_default(),
                // We need to allow hidden paths if the root path itself is
                // hidden, otherwise every response is a 404
                ignore_hidden_files: !path.is_hidden(),
                root_dir: path,
                compression: true,
                compression_static: false,
                dir_listing: false,
                dir_listing_format: static_web_server::directory_listing::DirListFmt::Html,
                dir_listing_order: 0,
                cache_control_headers: true,
                cors: None,
                log_remote_address: false,
                redirect_trailing_slash: false,
                security_headers: true,
            })
        });
    })
}

fn get_sws_request_handler() -> ion::Result<SwsRequestHandler> {
    SWS_OPTS.with(|h| {
        Ok(SwsRequestHandler {
            opts: h
                .get()
                .ok_or_else(|| {
                    ion_mk_err!(
                        "To allow static files to be served, WinterJS must be run \
                            with the JS_PATH argument pointing to a directory",
                        Normal
                    )
                })?
                .clone(),
        })
    })
}

async fn serve_static_file(req: Request) -> ion::Result<hyper::Response<hyper::Body>> {
    let mut hyper_req = hyper::Request::from_parts(req.parts, req.body);
    let response = get_sws_request_handler()?
        .handle(&mut hyper_req, None)
        .await;
    response.map_err(|e| ion_mk_err!(format!("Failed to fetch static asset due to: {e}"), Normal))
}
