use std::fmt::Debug;

use ion::{
    class::NativeObject, flags::PropertyFlags, ClassDefinition, Context, Exception, Object,
    Promise, TracedHeap,
};
use mozjs_sys::jsapi::JSObject;
use runtime::{
    globals::fetch::Request as FetchRequest, globals::fetch::Response as FetchResponse,
    promise::future_to_promise,
};

use crate::ion_mk_err;

#[derive(FromValue, Debug)]
pub enum FetchInput<'cx> {
    #[ion(inherit)]
    Request(&'cx FetchRequest),
    #[ion(inherit)]
    Url(&'cx runtime::globals::url::URL),
    #[ion(inherit)]
    String(String),
}

enum FetchInputHeap {
    Request(TracedHeap<*mut JSObject>),
    Url(String),
}

#[js_fn]
fn fetch_asset<'cx>(cx: &'cx Context, input: FetchInput<'cx>) -> Option<Promise> {
    let input_heap = match input {
        FetchInput::Request(req) => FetchInputHeap::Request(TracedHeap::new(req.reflector().get())),
        FetchInput::Url(url) => FetchInputHeap::Url(url.to_string()),
        FetchInput::String(url) => FetchInputHeap::Url(url),
    };

    unsafe {
        future_to_promise::<_, _, _, Exception>(cx, move |cx| async move {
            let (cx, http_req) = match input_heap {
                FetchInputHeap::Request(request_heap) => {
                    let request =
                        FetchRequest::get_mut_private(&cx, &request_heap.root(&cx).into()).unwrap();

                    let mut http_req = http::Request::builder()
                        .uri(request.get_url())
                        .method(request.method());

                    for header in request.headers(&cx) {
                        http_req = http_req.header(header.0.clone(), header.1.clone())
                    }

                    let request_body = request.take_body(&cx)?;
                    let (cx, body_bytes) =
                        cx.await_native_cx(|cx| request_body.into_bytes(cx)).await;
                    let body = match body_bytes? {
                        Some(bytes) => hyper::Body::from(bytes),
                        None => hyper::Body::empty(),
                    };

                    (cx, http_req.body(body)?)
                }
                FetchInputHeap::Url(url) => {
                    // Apparently, cloudflare is OK with malformed URLs
                    let url = if url.starts_with("http:/") && url.chars().nth(6) != Some('/') {
                        url.replacen("http:/", "http://", 1)
                    } else if url.starts_with("https:/") && url.chars().nth(7) != Some('/') {
                        url.replacen("https:/", "https://", 1)
                    } else {
                        url
                    };

                    (
                        cx,
                        http::Request::builder()
                            .uri(url)
                            .method(http::Method::GET)
                            .body(hyper::Body::empty())?,
                    )
                }
            };

            let (parts, body) = http_req.into_parts();
            tracing::debug!(path = %parts.uri, "Serving static asset");

            let request = super::super::Request { parts, body };

            let url = url::Url::parse(request.parts.uri.to_string().as_str())?;
            let (cx, response) = cx.await_native(super::serve_static_file(request)).await;
            let response = response.map_err(|e| {
                tracing::debug!(error = ?e, "Failed to serve static asset");
                ion_mk_err!(format!("Failed to fetch static asset due to {e}"), Normal)
            })?;

            tracing::debug!(status = %response.status(), "Static asset served");
            let response = FetchResponse::from_hyper_response(&cx, response, url)?;
            Ok(FetchResponse::new_object(&cx, Box::new(response)))
        })
    }
}

pub fn new_env_object(cx: &Context) -> Object {
    let assets = Object::new(cx);
    assets.define_method(
        cx,
        "fetch",
        fetch_asset,
        1,
        PropertyFlags::CONSTANT_ENUMERATED,
    );

    let env = Object::new(cx);
    assert!(env.define_as(cx, "ASSETS", &assets, PropertyFlags::CONSTANT_ENUMERATED));

    env
}
