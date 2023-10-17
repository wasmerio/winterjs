pub use class::FetchEvent;

#[js_class]
pub mod class {
    use anyhow::anyhow;
    use futures::future::Either;
    use ion::{ClassDefinition, Context, Object, Value};
    use mozjs::jsapi::{HandleValueArray, JSObject, JSString};
    use mozjs::rooted;
    use mozjs_sys::jsgc::Heap;
    use mozjs_sys::jsval::ObjectValue;
    use runtime::globals::{fetch::Headers, url::Url};

    use super::super::request::ExecuteRequest;

    #[ion(into_value, no_constructor)]
    pub struct FetchEvent {
        pub(crate) request: Box<Heap<*mut JSObject>>,
        pub(crate) response: Option<Either<*mut JSString, *mut JSObject>>,
    }

    impl FetchEvent {
        #[ion(skip)]
        pub fn try_new(
            cx: &Context,
            req: http::request::Parts,
            body: Option<bytes::Bytes>,
        ) -> anyhow::Result<Self> {
            let body_bytes = body.as_ref().map(|b| b.as_ref());
            let body = match (&req.method, body_bytes) {
                (&http::Method::GET, _) | (&http::Method::HEAD, _) | (_, Some(b"")) | (_, None) => {
                    None
                }
                _ => body,
            };

            let uri = format!("https://app.wasmer.internal{}", req.uri.to_string());
            let url_class = Url::class_info(cx);

            let mut url = Object::new(cx);
            let arg1 = Value::string(cx, uri.as_str());
            let args_array = [arg1.get()];
            let args = unsafe { HandleValueArray::from_rooted_slice(&args_array) };
            rooted!(in(cx.as_ptr()) let fn_obj = ObjectValue(unsafe { mozjs::jsapi::JS_GetFunctionObject(url_class.constructor) }));
            unsafe {
                mozjs::jsapi::Construct1(
                    cx.as_ptr(),
                    fn_obj.handle().into(),
                    &args,
                    url.handle_mut().into(),
                )
            };

            let mut headers = Headers::default();
            for h in &req.headers {
                headers
                    .append(h.0.to_string(), h.1.to_str().map(|x| x.to_string())?)
                    .map_err(|_| anyhow!("Failed to add header to Headers object"))?;
            }

            let request = Heap::boxed(ExecuteRequest::new_object(
                cx,
                ExecuteRequest {
                    url: Heap::boxed((*url).get()),
                    method: req.method.to_string(),
                    headers,
                    body: super::super::request::Body(body),
                },
            ));

            Ok(Self {
                request,
                response: None,
            })
        }

        #[ion(get)]
        pub fn get_request(&self) -> *mut JSObject {
            self.request.get()
        }

        #[ion(name = "respondWith")]
        pub fn respond_with(&mut self, response: ion::Value) -> ion::Result<()> {
            match self.response {
                None => {
                    if response.handle().is_object() {
                        self.response = Some(Either::Right(response.handle().to_object()));
                        Ok(())
                    } else if response.handle().is_string() {
                        self.response = Some(Either::Left(response.handle().to_string()));
                        Ok(())
                    } else {
                        Err(ion::Error::new(
                            "Response must be an object or a string",
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
    }
}
