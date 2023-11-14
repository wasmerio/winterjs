use ion::conversions::{FromValue, ToValue};
use strum::{AsRefStr, EnumString};

use crate::enum_value;

pub use class::CryptoKey;

#[derive(EnumString, AsRefStr, Clone, Copy)]
#[strum(serialize_all = "camelCase")]
pub enum KeyType {
    Public,
    Private,
    Secret,
}

enum_value!(KeyType);

#[derive(EnumString, AsRefStr, Clone, Copy)]
#[strum(serialize_all = "camelCase")]
pub enum KeyUsage {
    Encrypt,
    Decrypt,
    Sign,
    Verify,
    DeriveKey,
    DeriveBits,
    WrapKey,
    UnwrapKey,
}

enum_value!(KeyUsage);

#[derive(EnumString, AsRefStr, Clone, Copy)]
#[strum(serialize_all = "lowercase")]
pub enum KeyFormat {
    Raw,
    Spki,
    Pkcs8,
    Jwk,
}

enum_value!(KeyFormat);

#[js_class]
mod class {
    use ion::{conversions::ToValue, Context, Value};
    use mozjs::{gc::Traceable, jsapi::Heap};
    use mozjs_sys::jsapi::{JSObject, JSTracer};

    use super::{KeyType, KeyUsage};

    #[ion(into_value, no_constructor)]
    pub struct CryptoKey {
        pub(super) key_type: KeyType,
        pub(super) extractable: bool,
        pub(super) algorithm: Box<Heap<*mut JSObject>>,
        pub(super) usages: Vec<KeyUsage>,
    }

    impl CryptoKey {
        #[ion(get)]
        pub fn get_type(&self) -> KeyType {
            self.key_type
        }

        #[ion(skip)]
        pub fn key_type(&self) -> KeyType {
            self.key_type
        }

        #[ion(get)]
        pub fn get_extractable(&self) -> bool {
            self.extractable
        }

        #[ion(skip)]
        pub fn extractable(&self) -> bool {
            self.extractable
        }

        #[ion(skip)]
        pub fn set_extractable(&mut self, extractable: bool) {
            self.extractable = extractable;
        }

        #[ion(get)]
        pub fn get_algorithm(&self) -> *mut JSObject {
            self.algorithm.get()
        }

        #[ion(get)]
        pub fn get_usages<'cx>(&self, cx: &'cx Context) -> Value<'cx> {
            let mut val = Value::undefined(cx);
            self.usages.to_value(cx, &mut val);
            val
        }

        #[ion(skip)]
        pub fn usages(&self) -> &Vec<KeyUsage> {
            &self.usages
        }

        #[ion(skip)]
        pub fn set_usages(&mut self, usages: Vec<KeyUsage>) {
            self.usages = usages;
        }
    }

    unsafe impl Traceable for CryptoKey {
        unsafe fn trace(&self, trc: *mut JSTracer) {
            self.algorithm.trace(trc);
        }
    }
}
