use anyhow::anyhow;
use ion::conversions::ToValue;
use ion::string::byte::ByteString;
use ion::Heap;
use ion::{class::Reflector, ClassDefinition, Context, Promise};
use mozjs::jsapi::JSObject;
use runtime::globals::{fetch::Headers, url::URL};

use super::request::ExecuteRequest;

#[js_class]
pub struct FetchEvent {
    reflector: Reflector,
    pub(crate) request: Heap<*mut JSObject>,
    pub(crate) response: Option<Heap<*mut JSObject>>,
}

impl FetchEvent {
    pub fn try_new(
        cx: &Context,
        req: http::request::Parts,
        body: Option<bytes::Bytes>,
    ) -> anyhow::Result<Self> {
        let body_bytes = body.as_ref().map(|b| b.as_ref());
        let body = match (&req.method, body_bytes) {
            (&http::Method::GET, _) | (&http::Method::HEAD, _) | (_, Some(b"")) | (_, None) => None,
            _ => body,
        };

        let uri = format!("https://app.wasmer.internal{}", req.uri.to_string());
        let url = URL::construct(cx, &[uri.as_value(cx)]).unwrap();

        let mut headers = Headers::default();
        for h in &req.headers {
            headers
                .append(
                    ByteString::from(h.0.to_string().into())
                        .ok_or(anyhow!("Invalid characters in header name"))?,
                    ByteString::from(h.1.to_str().map(|x| x.to_string().into())?)
                        .ok_or(anyhow!("Invalid characters in header value"))?,
                )
                .map_err(|_| anyhow!("Failed to add header to Headers object"))?;
        }

        let request = Heap::new(ExecuteRequest::new_object(
            cx,
            Box::new(ExecuteRequest {
                reflector: Default::default(),
                url: Heap::new((*url).get()),
                method: req.method.to_string(),
                headers,
                body: Some(super::request::Body(body)),
            }),
        ));

        Ok(Self {
            reflector: Default::default(),
            request,
            response: None,
        })
    }
}

#[js_class]
impl FetchEvent {
    #[ion(constructor)]
    pub fn constructor() -> ion::Result<FetchEvent> {
        Err(ion::Error::new(
            "Cannot construct this class",
            ion::ErrorKind::Type,
        ))
    }

    #[ion(get)]
    pub fn get_request(&self) -> *mut JSObject {
        self.request.get()
    }

    #[ion(name = "respondWith")]
    pub fn respond_with(&mut self, cx: &Context, response: ion::Value) -> ion::Result<()> {
        match self.response {
            None => {
                if response.handle().is_object() {
                    let obj = response.handle().to_object();
                    let rooted = cx.root_object(obj);
                    if Promise::is_promise(&rooted)
                        || runtime::globals::fetch::Response::instance_of(cx, &rooted.into(), None)
                    {
                        self.response = Some(Heap::new(obj));
                        Ok(())
                    } else {
                        Err(ion::Error::new(
                            "Value must be a promise or an instance of Response",
                            ion::ErrorKind::Type,
                        ))
                    }
                } else {
                    Err(ion::Error::new(
                        "Value must be a promise or an instance of Response",
                        ion::ErrorKind::Type,
                    ))
                }
            }
            Some(_) => Err(ion::Error::new(
                "Response was already provided once",
                ion::ErrorKind::Normal,
            )),
        }
    }

    #[ion(name = "waitUntil")]
    pub fn wait_until(&self, _promise: ion::Promise) {
        // No need to do anything, the runtime will run the promise anyway
    }
}
