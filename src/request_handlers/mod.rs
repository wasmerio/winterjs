use std::{ffi::OsString, path::PathBuf, pin::Pin};

use anyhow::{anyhow, bail, Context as _, Result};
use futures::Future;
use http::Uri;
use ion::{
    function::Opt, string::byte::ByteString, ClassDefinition, Context, Object, TracedHeap, Value,
};
use mozjs::jsval::JSVal;
use mozjs_sys::jsapi::JSObject;
use runtime::{
    globals::fetch::{
        hyper_body_to_stream, FetchBody, FetchBodyInner, HeaderEntry, HeadersInit,
        Request as FetchRequest, RequestInfo, RequestInit,
    },
    module::StandardModules,
};

pub mod cloudflare;
pub mod service_workers;
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
    fn finish_request(
        &mut self,
        cx: Context,
        response: Result<TracedHeap<JSVal>, TracedHeap<JSVal>>,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        match response {
            Err(error) => {
                let error = Value::from(error.root(&cx));
                let message = if error.get().is_object() {
                    error
                        .to_object(&cx)
                        .get(&cx, "message")
                        .ok()
                        .flatten()
                        .and_then(|v| {
                            if v.get().is_string() {
                                Some(
                                    ion::String::from(cx.root(v.get().to_string()))
                                        .to_owned(&cx)
                                        .unwrap_or_else(|e| {
                                            format!("Failed to read error message due to {e}")
                                        }),
                                )
                            } else {
                                None
                            }
                        })
                } else {
                    None
                }
                .unwrap_or("<No error message>".to_string());
                bail!("Script execution failed: {message}")
            }
            Ok(result) => self.finish_fulfilled_request(cx.duplicate(), result.root(&cx).into()),
        }
    }

    fn finish_fulfilled_request(
        &mut self,
        cx: Context,
        val: Value,
    ) -> Result<Either<PendingResponse, ReadyResponse>>;
}

pub trait ByRefStandardModules {
    fn init_modules(&self, cx: &Context, global: &Object) -> bool;

    fn init_globals(&self, cx: &Context, global: &Object) -> bool;
}

impl StandardModules for Box<dyn ByRefStandardModules> {
    fn init(self, cx: &Context, global: &Object) -> bool {
        self.init_modules(cx, global)
    }

    fn init_globals(self, cx: &Context, global: &Object) -> bool {
        self.as_ref().init_globals(cx, global)
    }
}

fn build_fetch_request(cx: &Context, request: Request) -> Result<*mut JSObject> {
    let body = match &request.parts.method {
        &http::Method::GET | &http::Method::HEAD => hyper::Body::empty(),
        _ => request.body,
    };

    let host = get_host(&request.parts.uri, &request.parts.headers)?;
    let uri = Uri::builder()
        .scheme("http")
        .authority(host)
        .path_and_query(
            request
                .parts
                .uri
                .path_and_query()
                .cloned()
                .unwrap_or("/".parse().unwrap()),
        )
        .build()
        .context("Failed to build request URI")?;

    tracing::debug!(%uri, "Computed request URI");

    let request_info = RequestInfo::String(uri.to_string());

    let header_entries = request
        .parts
        .headers
        .iter()
        .map(|h| {
            anyhow::Ok(HeaderEntry {
                name: ByteString::from(h.0.to_string().into())
                    .ok_or(anyhow!("Invalid characters in header name"))?,
                value: ByteString::from(h.1.to_str().map(|x| x.to_string().into())?)
                    .ok_or(anyhow!("Invalid characters in header value"))?,
            })
        })
        .collect::<Result<_, _>>()?;

    let request_init = RequestInit {
        method: Some(request.parts.method.to_string()),
        headers: Some(HeadersInit::Array(header_entries)),
        body: Some(FetchBody {
            body: FetchBodyInner::Stream(
                hyper_body_to_stream(cx, body)
                    .ok_or_else(|| anyhow!("Failed to create ReadableStream for request body"))?,
            ),
            kind: None,
            source: None,
        }),
        ..Default::default()
    };

    let request = FetchRequest::constructor(cx, request_info, Opt(Some(request_init)))
        .map_err(|e| anyhow!("Failed to construct request: {e:?}"))?;

    Ok(FetchRequest::new_object(cx, Box::new(request)))
}

pub fn get_host<'a>(uri: &'a http::Uri, headers: &'a http::HeaderMap) -> Result<&'a str> {
    if let Some(value) = headers.get(http::header::HOST) {
        let mut host = value.to_str().context("Failed to read host header")?;
        if let Some((a, _)) = host.split_once(':') {
            host = a;
        }
        if !host.is_empty() {
            return Ok(host);
        }
    }

    if let Some(host) = uri.host() {
        Ok(host)
    } else {
        Ok("app.wasmer.internal")
    }
}

fn build_response_from_fetch_response(
    cx: &Context,
    response: &mut runtime::globals::fetch::Response,
) -> Result<ReadyResponse> {
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
    Ok(ReadyResponse {
        response: hyper_response.body(body)?,
        body_future: future.map(|f| -> Pin<Box<dyn Future<Output = ()>>> { Box::pin(f) }),
    })
}
