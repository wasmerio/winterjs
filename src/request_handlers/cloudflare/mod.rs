use std::{
    cell::OnceCell,
    path::{Path, PathBuf},
    sync::Arc,
};

use crate::sm_utils;

use self::response::FetchAssetResponse;

use super::{
    ByRefStandardModules, Either, PendingResponse, ReadyResponse, Request, RequestHandler, UserCode,
};
use anyhow::{bail, Context as _, Result};
use ion::{ClassDefinition, Context, Object, Value};
use runtime::promise::future_to_promise;
use static_web_server::handler::{
    RequestHandler as SwsRequestHandler, RequestHandlerOpts as SwsRequestHandlerOpts,
};

mod response;

// Still operating under the one-handler-per-thread model. The correct way
// would to attach this to the context in some way.
thread_local! {
    static SWS_OPTS: OnceCell<Arc<SwsRequestHandlerOpts>> = OnceCell::new();
}

pub struct CloudflareRequestHandler(Option<CloudflareRequestHandlerInner>);

impl Clone for CloudflareRequestHandler {
    fn clone(&self) -> Self {
        // This is terrible, leaky, highly coupled design, but: runners only
        // clone request handlers to pass one into a new worker thread, at
        // which point the handler is not yet initialized. In fact, the main
        // handler stored in the runner is *never* initialized.
        if self.0.is_some() {
            panic!("Cannot clone CloudflareRequestHandler after initialization");
        }

        Self(None)
    }
}

enum CloudflareRequestHandlerInner {
    SingleSourceFile,
    WorkerJs(PathBuf),
    Directory(PathBuf),
}

use CloudflareRequestHandlerInner::*;

impl CloudflareRequestHandler {
    pub fn new() -> Self {
        Self(None)
    }

    fn get_inner(&self) -> anyhow::Result<&CloudflareRequestHandlerInner> {
        self.0.as_ref().context(
            "Internal error: evaluation_scripts should be called before using CloudflareRequestHandler"
        )
    }

    fn build_sws_request_handler(path: impl AsRef<Path>) {
        SWS_OPTS.with(move |s| {
            s.get_or_init(|| {
                let path = path.as_ref().to_path_buf();

                Arc::new(static_web_server::handler::RequestHandlerOpts {
                    advanced_opts: None,
                    basic_auth: String::new(),
                    // TODO: have WinterJS-themed defaults
                    page404: std::fs::read(path.join("404.html")).unwrap_or_default(),
                    page50x: std::fs::read(path.join("50x.html")).unwrap_or_default(),
                    page_fallback: std::fs::read(path.join("_fallback.html")).unwrap_or_default(),
                    root_dir: path,
                    compression: true,
                    compression_static: false,
                    dir_listing: false,
                    dir_listing_format: static_web_server::directory_listing::DirListFmt::Html,
                    dir_listing_order: 0,
                    cache_control_headers: true,
                    cors: None,
                    ignore_hidden_files: true,
                    log_remote_address: false,
                    redirect_trailing_slash: false,
                    security_headers: true,
                })
            });
        })
    }

    pub fn get_sws_request_handler() -> SwsRequestHandler {
        SWS_OPTS.with(|h| SwsRequestHandler {
            opts: h
                .get()
                .expect(
                    "Internal error: SWS handler should be initialized before serving static files",
                )
                .clone(),
        })
    }

    fn serve_static_file(cx: &Context, req: Request) -> ion::Promise {
        unsafe {
            future_to_promise::<_, _, _, ion::Error>(cx, move |cx| async move {
                let mut hyper_req = hyper::Request::from_parts(req.parts, req.body);
                let (cx, response) = cx
                    .await_native(Self::get_sws_request_handler().handle(&mut hyper_req, None))
                    .await;
                Ok(FetchAssetResponse::new_object(&cx, response))
            })
        }
        .expect("Internal error: future queue should be initialized")
    }
}

impl RequestHandler for CloudflareRequestHandler {
    fn get_standard_modules(&self) -> Box<dyn super::ByRefStandardModules> {
        Box::new(CloudflareStandardModules)
    }

    fn evaluate_scripts(&mut self, cx: &Context, code: &UserCode) -> Result<()> {
        if self.0.is_some() {
            bail!("Internal error: evaluate_scripts should only be called once");
        }

        match code {
            UserCode::Script { code, file_name } => {
                sm_utils::evaluate_script(cx, code, file_name)?;
                self.0 = Some(SingleSourceFile);
            }

            UserCode::Module(path) => {
                sm_utils::evaluate_module(cx, path)?;
                self.0 = Some(SingleSourceFile);
            }

            UserCode::Directory(path) => {
                let worker_js_path = path.join("_worker.js");
                match std::fs::metadata(&worker_js_path) {
                    Ok(metadata) if metadata.is_file() => {
                        sm_utils::evaluate_module(cx, &worker_js_path)?;
                        Self::build_sws_request_handler(path);
                        self.0 = Some(WorkerJs(path.clone()));
                    }
                    Ok(_) => {
                        bail!("If _worker.js exists, it must be a script file");
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                        // No actual evaluation takes place in this case
                        Self::build_sws_request_handler(path);
                        self.0 = Some(Directory(path.clone()));
                    }
                    Err(e) => {
                        return Err(e).context("Failed to look up metadata for ./_worker.js");
                    }
                }
            }
        }

        Ok(())
    }

    fn start_handling_request(
        &mut self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        match self.get_inner()? {
            // TODO: run scripts too? :D
            Directory(_) => Ok(Either::Left(PendingResponse {
                promise: Self::serve_static_file(&cx, request),
            })),
            _ => todo!(),
        }
    }

    fn finish_fulfilled_request(&mut self, cx: Context, val: Value) -> Result<ReadyResponse> {
        if !val.handle().is_object() {
            bail!("Script error: the value returned from handlers must be an object");
        }
        build_response(&cx, val.to_object(&cx))
    }
}

struct CloudflareStandardModules;

impl ByRefStandardModules for CloudflareStandardModules {
    fn init_modules(&self, cx: &Context, global: &mut Object) -> bool {
        self.init_globals(cx, global)
    }

    fn init_globals(&self, cx: &Context, global: &mut Object) -> bool {
        self::response::FetchAssetResponse::init_class(cx, global).0
    }
}

fn build_response(cx: &Context, mut result: Object) -> Result<ReadyResponse> {
    if self::response::FetchAssetResponse::instance_of(&cx, &result, None) {
        let resp = self::response::FetchAssetResponse::get_mut_private(&mut result);
        Ok(ReadyResponse {
            response: resp
                .take_response()
                .context("Internal error: FetchAssetResponse was already used")??,
            body_future: None,
        })
    } else {
        todo!()
    }
}
