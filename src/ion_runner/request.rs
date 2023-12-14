use bytes::Bytes;
use http::header::CONTENT_TYPE;
use ion::{
    class::{NativeObject, Reflector},
    conversions::ToValue,
    string::byte::ByteString,
    typedarray::ArrayBuffer,
    ClassDefinition, Context, Heap, Promise, Value,
};
use mozjs::jsapi::JSObject;
use runtime::globals::form_data::FormData;

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
pub struct ExecuteRequest {
    pub(crate) reflector: Reflector,
    pub(crate) url: Heap<*mut JSObject>,
    pub(crate) method: String,
    pub(crate) headers: runtime::globals::fetch::Headers,
    #[ion(no_trace)]
    pub(crate) body: Option<Body>,
}

impl ExecuteRequest {
    fn text_impl(&mut self) -> String {
        self.body
            .take()
            .and_then(|b| b.0)
            .as_ref()
            .map(|body| String::from_utf8_lossy(body.as_ref()).into_owned())
            .unwrap_or_else(|| String::new())
    }
}

#[js_class]
impl ExecuteRequest {
    #[ion(constructor)]
    pub fn constructor() -> ion::Result<ExecuteRequest> {
        Err(ion::Error::new(
            "Cannot construct this class",
            ion::ErrorKind::Type,
        ))
    }

    #[ion(get)]
    pub fn get_url(&self) -> *mut JSObject {
        self.url.get()
    }

    pub fn get_method(&self) -> String {
        self.method.clone()
    }

    #[ion(get)]
    pub fn get_headers(&self) -> *mut JSObject {
        self.headers.reflector().get()
    }

    #[ion(get)]
    pub fn get_body(&mut self, cx: &Context) -> ion::Result<*mut JSObject> {
        match self.body.take() {
            None => Err(ion::Error::new("Body already used", ion::ErrorKind::Normal)),
            Some(body) => {
                let stream = ion::ReadableStream::from_bytes(cx, body.0.unwrap_or(vec![].into()));

                Ok((*stream).get())
            }
        }
    }

    #[ion(get, name = "bodyUsed")]
    pub fn get_body_used(&self) -> bool {
        self.body.is_none()
    }

    #[ion(name = "arrayBuffer")]
    pub fn array_buffer<'cx>(&'cx mut self, cx: &'cx Context) -> Promise {
        Promise::new_resolved(
            cx,
            match self.body.take().and_then(|b| b.0) {
                Some(ref bytes) => ArrayBuffer::from(bytes.as_ref()),
                None => ArrayBuffer::from(&b""[..]),
            },
        )
    }

    pub fn text<'cx>(&'cx mut self, cx: &'cx Context) -> Promise {
        Promise::new_resolved(cx, self.text_impl())
    }

    pub fn json<'cx>(&'cx mut self, cx: &'cx Context) -> Promise {
        Promise::new_from_result(cx, 'f: {
            let text = self.text_impl();
            let Some(str) = ion::String::copy_from_str(cx, text.as_str()) else {
                break 'f Err(ion::Error::new(
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
                break 'f Err(ion::Error::none());
            }

            Ok((*result.to_object(cx)).get())
        })
    }

    #[ion(name = "formData")]
    pub fn form_data<'cx>(&'cx mut self, cx: &'cx Context) -> Promise {
        Promise::new_from_result(cx, 'f: {
            let content_type_string = ByteString::from(CONTENT_TYPE.to_string().into()).unwrap();
            let Some(content_type) = self.headers.get(content_type_string).unwrap() else {
                break 'f Err(ion::Error::new(
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

                Ok(FormData::new_object(cx, Box::new(form_data)))
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
        })
    }
}
