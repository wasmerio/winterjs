use ion::{
    class::Reflector,
    conversions::{FromValue, ToValue},
    Context, Error, ErrorKind, Heap, Result, Value,
};
use mozjs_sys::jsapi::JSObject;
use strum::{AsRefStr, EnumString};

use crate::{enum_value, ion_err};

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
    pub algorithm: Heap<*mut JSObject>, // KeyAlgorithm

    #[ion(no_trace)]
    pub key_type: KeyType,

    #[ion(no_trace)]
    pub usages: Vec<KeyUsage>,
}

impl CryptoKey {
    pub fn new(
        extractable: bool,
        algorithm: Heap<*mut JSObject>,
        key_type: KeyType,
        usages: Vec<KeyUsage>,
    ) -> Self {
        Self {
            reflector: Default::default(),
            extractable,
            algorithm,
            key_type,
            usages,
        }
    }

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

#[js_class]
pub struct KeyAlgorithm {
    pub reflector: Reflector,

    pub name: &'static str,
}

#[js_class]
impl KeyAlgorithm {
    #[ion(constructor)]
    pub fn constructor() -> Result<KeyAlgorithm> {
        ion_err!("This type cannot be constructed", Type);
    }

    #[ion(get)]
    pub fn get_name(&self) -> &'static str {
        self.name
    }
}
