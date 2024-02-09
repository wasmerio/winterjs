use std::{ffi::OsString, path::PathBuf, pin::Pin};

use anyhow::{bail, Context as _, Result};
use futures::Future;
use ion::{Context, Object, Value};
use mozjs::jsapi::PromiseState;
use runtime::modules::StandardModules;

pub mod cloudflare;
pub mod wintercg;

#[derive(Clone, Debug)]
pub enum UserCode {
    Script { code: String, file_name: OsString },
    Module(PathBuf),
    Directory(PathBuf),
}

impl UserCode {
    pub async fn from_path(path: &PathBuf, script_mode: bool) -> anyhow::Result<Self> {
        let path = runtime::wasi_polyfills::canonicalize(path)
            .context("Failed to canonicalize root module path")?;
        let path_metadata = tokio::fs::metadata(&path)
            .await
            .context("Failed to get metadata for provided code path")?;

        if path_metadata.is_dir() {
            if script_mode {
                bail!("Cannot use a directory in script mode, specify the path to the script file instead")
            } else {
                Ok(Self::Directory(path.clone()))
            }
        } else if script_mode {
            let code = tokio::fs::read_to_string(&path).await.with_context(|| {
                format!("Could not read Javascript file at '{}'", path.display())
            })?;
            let file_name = path
                .file_name()
                .map(|p| p.to_os_string())
                .unwrap_or(OsString::from("app.js"));
            Ok(Self::Script { code, file_name })
        } else {
            Ok(Self::Module(path))
        }
    }
}

pub struct Request {
    pub parts: http::request::Parts,
    pub body: hyper::Body,
}

pub enum Either<A, B> {
    Left(A),
    Right(B),
}

pub struct ReadyResponse {
    pub response: hyper::Response<hyper::Body>,
    pub body_future: Option<Pin<Box<dyn Future<Output = ()>>>>,
}

pub struct PendingResponse {
    pub promise: ion::Promise,
}

#[dyn_clonable::clonable]
pub trait RequestHandler: Clone + Send + Sync + 'static {
    // Registers additional modules required for the handler to work
    fn get_standard_modules(&self) -> Box<dyn ByRefStandardModules>;

    /// Evaluate the user script(s) to prepare for request execution.
    fn evaluate_scripts(&mut self, cx: &Context, code: &UserCode) -> Result<()>;

    /// Start handling the given request.
    fn start_handling_request(
        &mut self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>>;

    /// Finish handling the request. The associated promise must be
    /// either fulfilled or rejected before calling this method.
    fn finish_request(&mut self, cx: Context, response: PendingResponse) -> Result<ReadyResponse> {
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
                            Some(
                                ion::String::from(cx.root_string(v.get().to_string()))
                                    .to_owned(&cx),
                            )
                        } else {
                            None
                        }
                    })
                    .unwrap_or("<No error message>".to_string());
                bail!("Script execution failed: {message}")
            }
            PromiseState::Fulfilled => {
                let promise_result = response.promise.result(&cx);
                self.finish_fulfilled_request(cx.duplicate(), promise_result)
            }
        }
    }

    fn finish_fulfilled_request(&mut self, cx: Context, val: Value) -> Result<ReadyResponse>;
}

pub trait ByRefStandardModules {
    fn init_modules(&self, cx: &Context, global: &mut Object) -> bool;

    fn init_globals(&self, cx: &Context, global: &mut Object) -> bool;
}

impl StandardModules for Box<dyn ByRefStandardModules> {
    fn init(self, cx: &Context, global: &mut Object) -> bool {
        self.init_modules(cx, global)
    }

    fn init_globals(self, cx: &Context, global: &mut Object) -> bool {
        self.as_ref().init_globals(cx, global)
    }
}
