use ion::{
    class::Reflector,
    conversions::{FromValue, ToValue},
    Context, Error, ErrorKind, Heap, Result, Value,
};
use mozjs_sys::jsapi::JSObject;
use strum::{AsRefStr, EnumString};

use crate::enum_value;

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
pub struct CryptoKey {
    pub reflector: Reflector,
    pub extractable: bool,
    pub algorithm: Heap<*mut JSObject>,

    #[ion(no_trace)]
    pub key_type: KeyType,

    #[ion(no_trace)]
    pub usages: Vec<KeyUsage>,
}

impl CryptoKey {
    pub fn set_extractable(&mut self, extractable: bool) {
        self.extractable = extractable;
    }

    pub fn usages(&self) -> &Vec<KeyUsage> {
        &self.usages
    }

    pub fn set_usages(&mut self, usages: Vec<KeyUsage>) {
        self.usages = usages;
    }
}

#[js_class]
impl CryptoKey {
    #[ion(constructor)]
    pub fn constructor() -> Result<CryptoKey> {
        Err(Error::new("Cannot construct this type", ErrorKind::Type))
    }

    #[ion(get)]
    pub fn get_type(&self) -> KeyType {
        self.key_type
    }

    #[ion(get)]
    pub fn get_extractable(&self) -> bool {
        self.extractable
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
}
