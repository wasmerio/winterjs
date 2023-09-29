mod event_listener;
mod performance;
mod text_encoder;

use std::{collections::HashMap, path::Path, str::FromStr};

use bytes::Bytes;
use http::{header::ToStrError, HeaderName, HeaderValue};
use ion::{
    conversions::{FromValue, IntoValue},
    flags::IteratorFlags,
    Context, ErrorReport, OwnedKey, Promise, Value,
};
use modules::http::{
    header::{HeaderEntry, HeadersInit},
    request::{RequestBuilderOptions, RequestOptions},
    Resource,
};
use mozjs::{
    conversions::ConversionBehavior,
    rust::{JSEngine, JSEngineHandle},
};
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

    let request = build_request(&cx, req, body)?;

    let result = event_listener::invoke_fetch_event_callback(&cx, &[request]).map_err(|e| {
        e.map(|e| error_report_to_anyhow_error(&cx, e))
            .unwrap_or(anyhow::anyhow!("Script execution failed"))
    })?;

    // We only need to run the event loop if we don't have a result yet
    let result = if result.handle().is_object()
        && Promise::is_promise(&result.to_object(&cx).into_local())
    {
        let promise = Promise::from(result.to_object(&cx).into_local()).unwrap();

        rt.run_event_loop().await.unwrap();

        Promise::result(&promise, &cx)
    } else {
        result
    };

    let response = build_response(&cx, result);
    std::mem::forget(rt);
    std::mem::forget(cx);
    response
}

fn build_request<'cx>(
    cx: &'cx Context,
    req: http::request::Parts,
    body: Option<bytes::Bytes>,
) -> anyhow::Result<Value<'cx>> {
    let mut uri = req.uri;
    if let None = uri.host() {
        uri = http::Uri::from_str(format!("https://app.wasmer.internal{uri}").as_str())?;
    }

    let body_bytes = body.as_ref().map(|b| b.as_ref());
    let body = match (&req.method, body_bytes) {
        (&http::Method::GET, _) | (&http::Method::HEAD, _) | (_, Some(b"")) | (_, None) => None,
        _ => body,
    };

    let request = modules::http::Request::constructor(
        Resource::String(uri.to_string()),
        Some(RequestBuilderOptions {
            method: Some(req.method.to_string()),
            options: RequestOptions {
                body: body,
                headers: HeadersInit::Array(
                    req.headers
                        .iter()
                        .map(|h| {
                            Result::<_, ToStrError>::Ok(HeaderEntry {
                                name: h.0.to_string(),
                                value: h.1.to_str().map(|x| x.to_string())?,
                            })
                        })
                        .collect::<Result<Vec<_>, _>>()?,
                ),
                ..Default::default()
            },
        }),
    )
    .map_err(|e| anyhow::anyhow!("Failed to build request: {:?}", e))?;

    let mut value = Value::undefined(&cx);
    unsafe { Box::new(request).into_value(&cx, &mut value) };
    Ok(value)
}

fn build_response<'cx>(
    cx: &'cx Context,
    value: Value<'cx>,
) -> anyhow::Result<hyper::Response<hyper::Body>> {
    // First, check if the value is a string or byte array
    let plain_response = if value.handle().is_string() {
        let str = unsafe { <String as FromValue>::from_value(cx, &value, false, ()) }
            .map_err(|_| anyhow::anyhow!("Failed to read response string"))?;
        Some((Bytes::from(str.into_bytes()), "text/plain; charset=utf-8"))
    } else {
        let v = value.to_object(cx);
        if let Ok(arr) = mozjs::typedarray::ArrayBuffer::from(v.handle().get()) {
            Some((
                Bytes::from(unsafe { arr.as_slice() }.to_owned()),
                "application/octet-stream",
            ))
        } else if let Ok(arr) = mozjs::typedarray::ArrayBufferView::from(v.handle().get()) {
            Some((
                Bytes::from(unsafe { arr.as_slice() }.to_owned()),
                "application/octet-stream",
            ))
        } else if let Ok(arr) = mozjs::typedarray::Uint8Array::from(v.handle().get()) {
            Some((
                Bytes::from(unsafe { arr.as_slice() }.to_owned()),
                "application/octet-stream",
            ))
        } else {
            None
        }
    };

    if let Some((bytes, mime_type)) = plain_response {
        let mut hyper_response = hyper::Response::builder().status(200);
        let headers =
            anyhow::Context::context(hyper_response.headers_mut(), "Response has no headers")?;
        headers.append("Content-Type", HeaderValue::from_str(mime_type)?);
        return Ok(hyper_response.body(hyper::Body::from(bytes))?);
    }

    let response = unsafe { Response::from_value(cx, &value, true, ()) }
        .map_err(|e| anyhow::anyhow!("Failed to read response object: {e:?}"))?;

    let mut hyper_response = hyper::Response::builder().status(response.status.unwrap_or(200));

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

#[derive(FromValue)]
struct Response {
    #[ion(convert = ConversionBehavior::EnforceRange)]
    status: Option<u16>,

    #[ion(parser = |v| parse_headers(cx, v))]
    headers: Option<HashMap<String, String>>,

    #[ion(parser = |v| parse_body(cx, v))]
    body: Option<Bytes>,
}

fn parse_headers<'cx>(cx: &'cx Context, v: Value<'cx>) -> ion::Result<HashMap<String, String>> {
    if v.handle().is_null() {
        return Ok(Default::default());
    }

    let o = v.to_object(cx);
    let mut res = HashMap::new();
    for key in o.keys(cx, Some(IteratorFlags::OWN_ONLY)) {
        let OwnedKey::String(key_str) = key.to_owned_key(cx) else {
            return Err(ion::Error::new(
                "Header keys must be strings",
                ion::ErrorKind::Type,
            ));
        };
        let val = o.get(cx, key).unwrap();
        let val_str = unsafe { <String as FromValue>::from_value(cx, &val, false, ()) }?;
        res.insert(key_str, val_str);
    }
    Ok(res)
}

fn parse_body<'cx>(cx: &'cx Context, v: Value<'cx>) -> ion::Result<Bytes> {
    if v.handle().is_string() {
        let str = unsafe { <String as FromValue>::from_value(cx, &v, false, ()) }?;
        Ok(Bytes::from(str.into_bytes()))
    } else {
        let v = v.to_object(cx);
        if let Ok(arr) = mozjs::typedarray::ArrayBuffer::from(v.handle().get()) {
            Ok(Bytes::from(unsafe { arr.as_slice() }.to_owned()))
        } else if let Ok(arr) = mozjs::typedarray::ArrayBufferView::from(v.handle().get()) {
            Ok(Bytes::from(unsafe { arr.as_slice() }.to_owned()))
        } else if let Ok(arr) = mozjs::typedarray::Uint8Array::from(v.handle().get()) {
            Ok(Bytes::from(unsafe { arr.as_slice() }.to_owned()))
        } else {
            return Err(ion::Error::new(
                "Unexpected type for response.body",
                ion::ErrorKind::Type,
            ));
        }
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
    }
}
