mod base64;
mod event_listener;
mod fetch_event;
mod performance;
mod request;

use std::{path::Path, str::FromStr};

use anyhow::{anyhow, bail};
use bytes::Bytes;
use futures::future::Either;
use http::{HeaderName, HeaderValue};
use ion::{
    conversions::IntoValue, script::Script, ClassDefinition, Context, ErrorReport, Promise, Value,
};
use mozjs::{
    jsapi::PromiseState,
    rust::{JSEngine, JSEngineHandle},
};
use runtime::{
    modules::{init_global_module, init_module, StandardModules},
    RuntimeBuilder,
};
use tokio::task::LocalSet;

use self::{fetch_event::class::FetchEvent, performance::PerformanceModule};

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

    // Evaluate the user script, hopefully resulting in the fetch handler being registered
    Script::compile_and_evaluate(rt.cx(), Path::new("app.js"), user_code)
        .map_err(|e| error_report_to_anyhow_error(&cx, e))?;

    rt.run_event_loop().await.unwrap();

    let fetch_event = FetchEvent::try_new(&cx, req, body)?;

    let mut request_value = Value::undefined(&cx);
    Box::new(fetch_event).into_value(&cx, &mut request_value);
    let request_object = request_value.to_object(&cx);

    let callback_rval = event_listener::invoke_fetch_event_callback(&cx, &[request_value])
        .map_err(|e| {
            e.map(|e| error_report_to_anyhow_error(&cx, e))
                .unwrap_or(anyhow::anyhow!("Script execution failed"))
        })?;

    let event = fetch_event::FetchEvent::get_private(&request_object);

    let result = if let Some(response) = event.response.as_ref() {
        response.clone()
    } else if callback_rval.handle().is_object() || callback_rval.handle().is_string() {
        value_to_object_or_string(callback_rval)?
    } else {
        bail!("No response provided");
    };

    // Wait for a potential promise to finish running
    rt.run_event_loop().await.unwrap();

    build_response(&cx, result).await
}

async fn build_response<'cx>(
    cx: &'cx Context<'_>,
    value: Either<*mut mozjs::jsapi::JSString, *mut mozjs::jsapi::JSObject>,
) -> anyhow::Result<hyper::Response<hyper::Body>> {
    let value = match value {
        Either::Right(obj) if Promise::is_promise(&cx.root_object(obj)) => {
            let promise = Promise::from(cx.root_object(obj)).unwrap();
            match promise.state() {
                PromiseState::Pending => bail!("Event loop finished but promise is still pending"),
                PromiseState::Rejected => {
                    let result = promise.result(cx);
                    let message = result
                        .to_object(cx)
                        .get(cx, "message")
                        .and_then(|v| {
                            if v.get().is_string() {
                                Some(
                                    ion::String::from(cx.root_string(v.get().to_string()))
                                        .to_owned(cx),
                                )
                            } else {
                                None
                            }
                        })
                        .unwrap_or("<No error message>".to_string());
                    bail!("Script execution failed: {message}")
                }
                PromiseState::Fulfilled => {
                    let result = promise.result(cx);
                    value_to_object_or_string(result)?
                }
            }
        }
        _ => value,
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
            let obj = value.to_object(cx);
            if !runtime::globals::fetch::Response::instance_of(cx, &obj, None) {
                // TODO: support plain objects
                bail!("If an object is returned, it must be an instance of Response");
            }

            let response = runtime::globals::fetch::Response::get_private(&obj);

            let mut hyper_response = hyper::Response::builder().status(response.get_status());

            let headers =
                anyhow::Context::context(hyper_response.headers_mut(), "Response has no headers")?;
            let response_headers = response.get_headers_object();
            for header in response_headers.iter() {
                headers.append(
                    HeaderName::from_str(header.0.as_str())?,
                    HeaderValue::from_str(header.1.to_str()?)?,
                );
            }

            let body = response
                .read_to_bytes()
                .await
                .map_err(|e| anyhow!("Failed to read response body: {e:?}"))?;

            Ok(hyper_response.body(hyper::Body::from(body))?)
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
                    .block_on(async move {
                        let local_set = LocalSet::new();
                        local_set
                            .run_until(handle_request(user_code, req, body))
                            .await
                    })
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
            && init_module::<modules::Assert>(cx, global)
            && init_module::<modules::FileSystem>(cx, global)
            && init_module::<modules::PathM>(cx, global)
            && init_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && request::ExecuteRequest::init_class(cx, global).0
            && fetch_event::FetchEvent::init_class(cx, global).0
            && base64::define(cx, global)
    }

    fn init_globals<'cx: 'o, 'o>(self, cx: &'cx Context, global: &mut ion::Object<'o>) -> bool {
        init_global_module::<PerformanceModule>(cx, global)
            && init_global_module::<modules::Assert>(cx, global)
            && init_global_module::<modules::FileSystem>(cx, global)
            && init_global_module::<modules::PathM>(cx, global)
            && init_global_module::<modules::UrlM>(cx, global)
            && event_listener::define(cx, global)
            && request::ExecuteRequest::init_class(cx, global).0
            && fetch_event::FetchEvent::init_class(cx, global).0
            && base64::define(cx, global)
    }
}
