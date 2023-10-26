use bytes::Bytes;
pub use class::ExecuteRequest;
use ion::{conversions::ToValue, typedarray::ArrayBuffer};

#[derive(Clone)]
pub struct Body(pub Option<Bytes>);

impl<'cx> ToValue<'cx> for Body {
    fn to_value(&self, cx: &'cx ion::Context, value: &mut ion::Value) {
        match self.0 {
            Some(ref bytes) => {
                let array = ArrayBuffer::from(bytes.as_ref());
                array.to_value(cx, value);
            }
            None => {
                ion::Value::undefined(cx).to_value(cx, value);
            }
        }
    }
}

#[js_class]
mod class {
    use http::header::CONTENT_TYPE;
    use ion::{typedarray::ArrayBuffer, ClassDefinition, Context, Value};
    use mozjs::jsapi::JSObject;
    use mozjs_sys::jsgc::Heap;
    use runtime::globals::form_data::FormData;

    use super::Body;

    #[ion(into_value, no_constructor)]
    pub struct ExecuteRequest {
        pub(crate) url: Box<Heap<*mut JSObject>>,
        pub(crate) method: String,
        pub(crate) headers: runtime::globals::fetch::Headers,
        pub(crate) body: Option<Body>,
    }

    impl ExecuteRequest {
        #[ion(get)]
        pub fn get_url(&self) -> *mut JSObject {
            self.url.get()
        }

        pub fn get_method(&self) -> String {
            self.method.clone()
        }

        #[ion(get)]
        pub fn get_headers(&self) -> runtime::globals::fetch::Headers {
            self.headers.clone()
        }

        #[ion(get)]
        pub fn get_body(&mut self, cx: &Context<'_>) -> ion::Result<*mut JSObject> {
            match self.body.take() {
                None => Err(ion::Error::new("Body already used", ion::ErrorKind::Normal)),
                Some(body) => {
                    let stream = runtime::globals::readable_stream::new_memory_backed(
                        cx,
                        body.0.unwrap_or(vec![].into()),
                    );

                    Ok((*stream).get())
                }
            }
        }

        #[ion(get, name = "bodyUsed")]
        pub fn get_body_used(&self) -> bool {
            self.body.is_none()
        }

        #[ion(name = "arrayBuffer")]
        pub async fn array_buffer(&mut self) -> ArrayBuffer {
            match self.body.take().and_then(|b| b.0) {
                Some(ref bytes) => ArrayBuffer::from(bytes.as_ref()),
                None => ArrayBuffer::from(&b""[..]),
            }
        }

        pub async fn text(&mut self) -> String {
            self.body
                .take()
                .and_then(|b| b.0)
                .as_ref()
                .map(|body| String::from_utf8_lossy(body.as_ref()).into_owned())
                .unwrap_or_else(|| String::new())
        }

        pub async fn json(&mut self, cx: &Context<'_>) -> ion::Result<*mut JSObject> {
            let text = self.text().await;
            let Some(str) = ion::String::new(cx, text.as_str()) else {
                return Err(ion::Error::new(
                    "Failed to allocate string",
                    ion::ErrorKind::Normal,
                ));
            };
            let mut result = Value::undefined(cx);
            if !unsafe {
                mozjs::jsapi::JS_ParseJSON1(
                    cx.as_ptr(),
                    str.handle().into(),
                    result.handle_mut().into(),
                )
            } {
                return Err(ion::Error::none());
            }

            Ok((*result.to_object(cx)).get())
        }

        #[ion(name = "formData")]
        pub async fn form_data(&mut self, cx: &Context<'_>) -> ion::Result<*mut JSObject> {
            let headers = self.get_headers();
            let Some(content_type) = headers.get(CONTENT_TYPE.to_string())? else {
                return Err(ion::Error::new(
                    "No content-type header, cannot decide form data format",
                    ion::ErrorKind::Type,
                ));
            };
            let content_type = content_type.to_string();

            let bytes = self.body.take().and_then(|b| b.0);

            let bytes = bytes.as_ref().map(|b| b.as_ref()).unwrap_or(&[][..]);

            if content_type.starts_with("application/x-www-form-urlencoded") {
                let parsed = form_urlencoded::parse(bytes.as_ref());
                let mut form_data = FormData::constructor();

                for (key, val) in parsed {
                    form_data.append_native_string(key.into_owned(), val.into_owned());
                }

                Ok(FormData::new_object(cx, form_data))
            } else if content_type.starts_with("multipart/form-data") {
                Err(ion::Error::new(
                    "multipart/form-data deserialization is not supported yet",
                    ion::ErrorKind::Normal,
                ))
            } else {
                Err(ion::Error::new(
                    "Invalid content-type, cannot decide form data format",
                    ion::ErrorKind::Type,
                ))
            }
        }
    }
}
