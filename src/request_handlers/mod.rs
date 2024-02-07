use std::{ffi::OsString, path::PathBuf, pin::Pin};

use anyhow::{bail, Context as _, Result};
use futures::Future;
use ion::{Context, Object};
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
    /// Register any additional, handler-specific modules in module mode.
    fn init_modules(&self, cx: &Context, global: &mut Object) -> bool;

    /// Register any additional, handler-specific modules in global mode.
    fn init_globals(&self, cx: &Context, global: &mut Object) -> bool;

    /// Evaluate the user script(s) to prepare for request execution.
    fn evaluate_scripts(&self, cx: &Context, code: &UserCode) -> Result<()>;

    /// Start handling the given request.
    fn start_handling_request(
        &self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>>;

    /// Finish handling the request. The associated promise must be
    /// either fulfilled or rejected before calling this method.
    fn finish_request(&self, cx: Context, response: PendingResponse) -> Result<ReadyResponse>;
}

impl StandardModules for Box<dyn RequestHandler> {
    fn init(self, cx: &Context, global: &mut Object) -> bool {
        self.init_modules(cx, global)
    }

    fn init_globals(self, cx: &Context, global: &mut Object) -> bool {
        self.as_ref().init_globals(cx, global)
    }
}
