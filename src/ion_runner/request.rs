use std::collections::HashMap;

use bytes::Bytes;
pub use class::FetchRequest;
use ion::{
    conversions::{FromValue, ToValue},
    flags::IteratorFlags,
    typedarray::ArrayBuffer,
    Object, OwnedKey,
};

#[derive(Clone)]
pub struct Headers(pub HashMap<String, String>);

impl<'cx> ToValue<'cx> for Headers {
    fn to_value(&self, cx: &'cx ion::Context, value: &mut ion::Value) {
        let mut object = Object::new(cx);
        for (key, val) in &self.0 {
            object.set_as(cx, key, &val);
        }
        object.to_value(cx, value);
    }
}

impl<'cx> FromValue<'cx> for Headers {
    type Config = ();

    fn from_value<'v>(
        cx: &'cx ion::Context,
        value: &ion::Value<'v>,
        _strict: bool,
        _config: Self::Config,
    ) -> ion::Result<Self>
    where
        'cx: 'v,
    {
        if !value.handle().is_object() {
            return Err(ion::Error::new(
                "Headers value must be an object",
                ion::ErrorKind::Type,
            ));
        }

        let object = value.to_object(cx);

        let mut res = Self(Default::default());

        for key in object.keys(cx, Some(IteratorFlags::OWN_ONLY)) {
            let OwnedKey::String(key_str) = key.to_owned_key(cx) else {
                return Err(ion::Error::new(
                    "Headers key must be a string",
                    ion::ErrorKind::Type,
                ));
            };

            let val = object.get_as(cx, key, true, ()).ok_or_else(|| {
                ion::Error::new("Headers value must be a string", ion::ErrorKind::Type)
            })?;

            res.0.insert(key_str, val);
        }

        Ok(res)
    }
}

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

    use super::{Body, Headers};

    #[ion(into_value, no_constructor)]
    pub struct FetchRequest {
        pub(crate) path: String,
        pub(crate) method: String,
        pub(crate) headers: Headers,
        pub(crate) body: Body,
        pub(crate) response:
            Option<Either<*mut mozjs::jsapi::JSString, *mut mozjs::jsapi::JSObject>>,
    }

    impl FetchRequest {
        #[ion(get)]
        pub fn get_path(&self) -> String {
            self.path.clone()
        }

        pub fn get_method(&self) -> String {
            self.method.clone()
        }

        #[ion(get)]
        pub fn get_headers(&self) -> Headers {
            self.headers.clone()
        }

        #[ion(get)]
        pub fn get_body(&self) -> Body {
            self.body.clone()
        }

        pub fn text(&self) -> String {
            self.body
                .0
                .as_ref()
                .map(|body| String::from_utf8_lossy(body.as_ref()).into_owned())
                .unwrap_or_else(|| String::new())
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
