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
    use futures::future::Either;
    use ion::{typedarray::ArrayBuffer, Context, Value};
    use mozjs::jsapi::JSObject;
    use mozjs_sys::jsgc::Heap;

    use super::Body;

    #[ion(into_value, no_constructor)]
    pub struct ExecuteRequest {
        pub(crate) url: Box<Heap<*mut JSObject>>,
        pub(crate) method: String,
        pub(crate) headers: runtime::globals::fetch::Headers,
        pub(crate) body: Body,
        pub(crate) response:
            Option<Either<*mut mozjs::jsapi::JSString, *mut mozjs::jsapi::JSObject>>,
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
        pub fn get_body(&self) -> Body {
            self.body.clone()
        }

        #[ion(name = "arrayBuffer")]
        pub fn array_buffer(&self) -> ArrayBuffer {
            match self.body.0 {
                Some(ref bytes) => ArrayBuffer::from(bytes.as_ref()),
                None => ArrayBuffer::from(&b""[..]),
            }
        }

        pub fn text(&self) -> String {
            self.body
                .0
                .as_ref()
                .map(|body| String::from_utf8_lossy(body.as_ref()).into_owned())
                .unwrap_or_else(|| String::new())
        }

        pub fn json(&self, cx: &Context) -> ion::Result<*mut JSObject> {
            let text = self.text();
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
                return Err(ion::Error::new(
                    "Failed to deserialize JSON",
                    ion::ErrorKind::Normal,
                ));
            }

            Ok((*result.to_object(cx)).get())
        }
    }
}
