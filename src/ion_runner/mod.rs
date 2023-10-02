mod event_listener;
mod performance;
mod request;
mod response;
mod text_encoder;

use std::{collections::HashMap, path::Path, str::FromStr};

use anyhow::bail;
use bytes::Bytes;
use futures::future::Either;
use http::{header::ToStrError, HeaderName, HeaderValue};
use ion::{
    conversions::{FromValue, IntoValue},
    ClassDefinition, Context, ErrorReport, Promise, Value,
};
use mozjs::rust::{JSEngine, JSEngineHandle};
use runtime::{
    modules::{init_global_module, init_module, StandardModules},
    script::Script,
    RuntimeBuilder,
};

use self::{performance::PerformanceModule, text_encoder::TextEncoderModule};

pub static ENGINE: once_cell::sync::Lazy<JSEngineHandle> = once_cell::sync::Lazy::new(|| {
    let engine = JSEngine::init().expect("could not create engine");
    let handle = engine.handle();
    std::mem::forget(engine);
    handle
});

async fn handle_request(
    user_code: &str,
    req: http::request::Parts,
    body: Option<bytes::Bytes>,
) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
    let rt = mozjs::rust::Runtime::new(ENGINE.clone());

    let cx = Context::from_runtime(&rt);
    // TODO: module loader?
    let rt = RuntimeBuilder::<(), _>::new()
        .microtask_queue()
        .macrotask_queue()
        .standard_modules(Modules)
        .build(&cx);

    // Set polyfills up
    Script::compile_and_evaluate(rt.cx(), Path::new("setup.js"), include_str!("setup.js"))
        .map_err(|e| error_report_to_anyhow_error(&cx, e))?;

    rt.run_event_loop().await.unwrap();

    // Evaluate the user script, hopefully resulting in the fetch handler being registered
    Script::compile_and_evaluate(rt.cx(), Path::new("app.js"), user_code)
        .map_err(|e| error_report_to_anyhow_error(&cx, e))?;

    rt.run_event_loop().await.unwrap();

    let request = build_request(req, body)?;

    let mut request_value = Value::undefined(&cx);
    unsafe { Box::new(request).into_value(&cx, &mut request_value) };
    let request_object = request_value.to_object(&cx);

    let callback_rval = event_listener::invoke_fetch_event_callback(&cx, &[request_value])
        .map_err(|e| {
            e.map(|e| error_report_to_anyhow_error(&cx, e))
                .unwrap_or(anyhow::anyhow!("Script execution failed"))
        })?;

    let request = <request::FetchRequest as ion::ClassDefinition>::get_private(&request_object);

    let result = if let Some(response) = request.response.as_ref() {
        response.clone()
    } else if callback_rval.handle().is_object() || callback_rval.handle().is_string() {
        value_to_object_or_string(callback_rval)?
    } else {
        bail!("No response provided");
    };

    // Wait for a potential promise to finish running
    rt.run_event_loop().await.unwrap();

    let response = build_response(&cx, result);
    std::mem::forget(rt);
    std::mem::forget(cx);
    response
}

fn build_request<'cx>(
    req: http::request::Parts,
    body: Option<bytes::Bytes>,
) -> anyhow::Result<request::FetchRequest> {
    let body_bytes = body.as_ref().map(|b| b.as_ref());
    let body = match (&req.method, body_bytes) {
        (&http::Method::GET, _) | (&http::Method::HEAD, _) | (_, Some(b"")) | (_, None) => None,
        _ => body,
    };

    let request = request::FetchRequest {
        path: req.uri.to_string(),
        method: req.method.to_string(),
        headers: request::Headers(
            req.headers
                .iter()
                .map(|h| {
                    Result::<_, ToStrError>::Ok((
                        h.0.to_string(),
                        h.1.to_str().map(|x| x.to_string())?,
                    ))
                })
                .collect::<Result<HashMap<_, _>, _>>()?,
        ),
        body: request::Body(body),
        response: None,
    };

    Ok(request)
}

fn build_response<'cx>(
    cx: &'cx Context,
    value: Either<*mut mozjs::jsapi::JSString, *mut mozjs::jsapi::JSObject>,
) -> anyhow::Result<hyper::Response<hyper::Body>> {
    let value = match value {
        Either::Right(obj) if Promise::is_promise(&cx.root_object(obj)) => {
            let result = Promise::from(cx.root_object(obj)).unwrap().result(cx);
            value_to_object_or_string(result)?
        }
        _ => value.clone(),
    };

    // First, check if the value is a string or byte array
    let response = match value {
        Either::Left(str) => {
            let str = ion::String::from(cx.root_string(str)).to_owned(cx);
            Either::Left((Bytes::from(str.into_bytes()), "text/plain; charset=utf-8"))
        }
        Either::Right(obj) => {
            if let Ok(arr) = mozjs::typedarray::ArrayBuffer::from(obj) {
                Either::Left((
                    Bytes::from(unsafe { arr.as_slice() }.to_owned()),
                    "application/octet-stream",
                ))
            } else if let Ok(arr) = mozjs::typedarray::ArrayBufferView::from(obj) {
                Either::Left((
                    Bytes::from(unsafe { arr.as_slice() }.to_owned()),
                    "application/octet-stream",
                ))
            } else if let Ok(arr) = mozjs::typedarray::Uint8Array::from(obj) {
                Either::Left((
                    Bytes::from(unsafe { arr.as_slice() }.to_owned()),
                    "application/octet-stream",
                ))
            } else {
                Either::Right(Value::object(cx, &cx.root_object(obj).into()))
            }
        }
    };

    match response {
        // If it's a simple value, return it directly
        Either::Left((bytes, mime_type)) => {
            let mut hyper_response = hyper::Response::builder().status(200);
            let headers =
                anyhow::Context::context(hyper_response.headers_mut(), "Response has no headers")?;
            headers.append("Content-Type", HeaderValue::from_str(mime_type)?);
            Ok(hyper_response.body(hyper::Body::from(bytes))?)
        }

        // Else, construct a response from the response object
        Either::Right(value) => {
            let response = unsafe { response::Response::from_value(cx, &value, true, ()) }
                .map_err(|e| anyhow::anyhow!("Failed to read response object: {e:?}"))?;

            let mut hyper_response =
                hyper::Response::builder().status(response.status.unwrap_or(200));

            let headers =
                anyhow::Context::context(hyper_response.headers_mut(), "Response has no headers")?;
            if let Some(response_headers) = response.headers {
                for header in response_headers {
                    headers.append(
                        HeaderName::from_str(header.0.as_str())?,
                        HeaderValue::from_str(header.1.as_str())?,
                    );
                }
            }

            let body = match response.body {
                None => hyper::Body::empty(),
                Some(bytes) => hyper::Body::from(bytes),
            };

            Ok(hyper_response.body(body)?)
        }
    }
}

fn value_to_object_or_string(
    value: Value,
) -> anyhow::Result<Either<*mut mozjs::jsapi::JSString, *mut mozjs::jsapi::JSObject>> {
    if value.handle().is_string() {
        Ok(Either::Left(value.handle().to_string()))
    } else if value.handle().is_object() {
        Ok(Either::Right(value.handle().to_object()))
    } else {
        bail!("Value must be an object or a string")
    }
}

fn error_report_to_anyhow_error(cx: &Context, error_report: ErrorReport) -> anyhow::Error {
    // TODO: include stack
    anyhow::anyhow!("Runtime error: {}", error_report.exception.format(cx))
}

#[derive(Clone)]
pub struct IonRunner;

impl crate::server::RequestHandler for IonRunner {
    fn handle(
        &self,
        user_code: &str,
        _addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: Option<bytes::Bytes>,
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
        std::thread::scope(move |s| {
            s.spawn(move || {
                tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()
                    .unwrap()
                    .block_on(handle_request(user_code, req, body))
            })
            .join()
        })
        .unwrap()
    }
}

struct Modules;

impl StandardModules for Modules {
    fn init<'cx: 'o, 'o>(self, cx: &'cx Context, global: &mut ion::Object<'o>) -> bool {
        init_module::<PerformanceModule>(cx, global)
            && init_module::<TextEncoderModule>(cx, global)
            && init_module::<modules::Assert>(cx, global)
            && init_module::<modules::FileSystem>(cx, global)
            && init_module::<modules::Http>(cx, global)
            && init_module::<modules::PathM>(cx, global)
            && init_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && request::FetchRequest::init_class(cx, global).0
    }

    fn init_globals<'cx: 'o, 'o>(self, cx: &'cx Context, global: &mut ion::Object<'o>) -> bool {
        init_global_module::<PerformanceModule>(cx, global)
            && init_global_module::<TextEncoderModule>(cx, global)
            && init_global_module::<modules::Assert>(cx, global)
            && init_global_module::<modules::FileSystem>(cx, global)
            && init_global_module::<modules::Http>(cx, global)
            && init_global_module::<modules::PathM>(cx, global)
            && init_global_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && request::FetchRequest::init_class(cx, global).0
    }
}
