use anyhow::anyhow;
use ion::string::byte::ByteString;
use ion::Heap;
use ion::{class::Reflector, ClassDefinition, Context, Promise};
use mozjs::jsapi::JSObject;
use runtime::globals::fetch::{FetchBody, HeaderEntry, HeadersInit, Request};
use runtime::globals::fetch::{FetchBodyInner, RequestInfo, RequestInit};

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
        body: hyper::Body,
    ) -> anyhow::Result<Self> {
        let body = match &req.method {
            &http::Method::GET | &http::Method::HEAD => hyper::Body::empty(),
            _ => body,
        };

        let uri = format!("https://app.wasmer.internal{}", req.uri.to_string());
        let request_info = RequestInfo::String(uri);

        let header_entries = req
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
            method: Some(req.method.to_string()),
            headers: Some(HeadersInit::Array(header_entries)),
            body: Some(FetchBody {
                body: FetchBodyInner::HyperBody(body),
                kind: None,
                source: None,
            }),
            ..Default::default()
        };

        let request = Request::constructor(cx, request_info, Some(request_init))
            .map_err(|e| anyhow!("Failed to construct request: {e:?}"))?;
        let request = Heap::new(Request::new_object(cx, Box::new(request)));

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
