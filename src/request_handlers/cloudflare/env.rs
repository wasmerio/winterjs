use ion::{
    class::NativeObject, function_spec, ClassDefinition, Context, Exception, Object, Promise,
    PromiseFuture, TracedHeap, Value,
};
use mozjs_sys::jsapi::JSFunctionSpec;
use runtime::{globals::fetch::Request as FetchRequest, promise::future_to_promise};

#[js_fn]
fn fetch_asset(cx: &Context, request: &FetchRequest) -> Promise {
    let request_heap = TracedHeap::new(request.reflector().get());

    unsafe {
        future_to_promise::<_, _, _, Exception>(cx, move |cx| async move {
            let request = FetchRequest::get_mut_private(&mut request_heap.root(&cx).into());

            let mut http_req = http::Request::builder()
                .uri(request.get_url())
                .method(request.method());

            for header in request.headers(&cx) {
                http_req = http_req.header(header.0.clone(), header.1.clone())
            }

            let request_body = request.take_body()?;
            let (cx, body_bytes) = cx.await_native_cx(|cx| request_body.into_bytes(cx)).await;
            let body_bytes = body_bytes?;
            let body = match body_bytes {
                Some(bytes) => hyper::Body::from(bytes),
                None => hyper::Body::empty(),
            };

            let http_req = http_req.body(body)?;

            let (parts, body) = http_req.into_parts();
            let request = super::super::Request { parts, body };

            let serve_file_promise =
                super::CloudflareRequestHandler::serve_static_file(&cx, request);
            let (_, static_file_response) = PromiseFuture::new(cx, &serve_file_promise).await;

            Ok(static_file_response
                .map_err(|e| Exception::Other(e.get()))?
                .get())
        })
        .expect("Future queue should be running")
    }
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(fetch_asset, "fetch", 1),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, global: &mut Object) -> bool {
    // Check for an existing globalThis.env, since that can also be used
    // to access environment variables in some environments and we may
    // add one later.
    let mut env = match global.get_as::<_, Object>(cx, "env", false, ()) {
        Some(o) => o,
        None => {
            let o = Object::new(cx);
            if !global.set_as(cx, "env", &Value::object(cx, &o)) {
                return false;
            }
            o
        }
    };

    let mut assets = Object::new(cx);
    if !unsafe { assets.define_methods(cx, FUNCTIONS) } {
        return false;
    }

    if !env.set_as(cx, "ASSETS", &Value::object(cx, &assets)) {
        return false;
    }

    true
}
