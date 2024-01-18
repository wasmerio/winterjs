pub(super) mod algorithm;
pub(super) mod crypto_key;
pub(super) mod jwk;

use std::{borrow::Cow, marker::PhantomData};

use ion::{
    class::NativeObject, conversions::ToValue, function_spec, ClassDefinition, Context, Object,
    Promise, TracedHeap,
};
use mozjs_sys::jsapi::{JSFunctionSpec, JSObject};
use runtime::promise::future_to_promise;
use strum::ParseError;

use algorithm::{md5::Md5, sha::Sha, CryptoAlgorithm};

use crate::{
    builtins::crypto::subtle::crypto_key::{CryptoKey, KeyAlgorithm},
    ion_err,
};

use self::{
    algorithm::hmac::Hmac,
    crypto_key::{KeyFormat, KeyType, KeyUsage},
    jwk::JsonWebKey,
};

#[derive(FromValue)]
pub enum BufferSource<'cx> {
    #[ion(inherit)]
    ArrayBuffer(mozjs::typedarray::ArrayBuffer, PhantomData<&'cx ()>),
    #[ion(inherit)]
    ArrayBufferView(mozjs::typedarray::ArrayBufferView, PhantomData<&'cx ()>),
}

impl<'cx> BufferSource<'cx> {
    fn into_heap(self) -> HeapBufferSource {
        match self {
            Self::ArrayBuffer(b, _) => {
                HeapBufferSource::ArrayBuffer(TracedHeap::new(unsafe { *b.underlying_object() }))
            }
            Self::ArrayBufferView(b, _) => {
                HeapBufferSource::ArrayBufferView(TracedHeap::new(unsafe {
                    *b.underlying_object()
                }))
            }
        }
    }
}

pub enum HeapBufferSource {
    ArrayBuffer(TracedHeap<*mut JSObject>),
    ArrayBufferView(TracedHeap<*mut JSObject>),
}

impl HeapBufferSource {
    unsafe fn as_slice(&self) -> &[u8] {
        unsafe {
            match self {
                Self::ArrayBuffer(b) => {
                    &*(mozjs::typedarray::ArrayBuffer::from(b.get())
                        .expect("HeapBufferSource was not constructed correctly")
                        .as_slice() as *const _)
                }
                Self::ArrayBufferView(b) => {
                    &*(mozjs::typedarray::ArrayBufferView::from(b.get())
                        .expect("HeapBufferSource was not constructed correctly")
                        .as_slice() as *const _)
                }
            }
        }
    }
}

#[derive(FromValue)]
pub enum KeyData<'cx> {
    #[ion(inherit)]
    BufferSource(BufferSource<'cx>),
    #[ion(inherit)]
    Jwk(Box<JsonWebKey>),
}

impl<'cx> KeyData<'cx> {
    fn into_heap(self) -> HeapKeyData {
        match self {
            Self::BufferSource(b) => HeapKeyData::BufferSource(b.into_heap()),
            Self::Jwk(jwk) => HeapKeyData::Jwk(jwk),
        }
    }
}

pub enum HeapKeyData {
    BufferSource(HeapBufferSource),
    Jwk(Box<JsonWebKey>),
}

#[derive(FromValue)]
pub enum AlgorithmIdentifier<'cx> {
    #[ion(inherit)]
    Object(Object<'cx>),
    #[ion(inherit)]
    String(String),
}

impl<'cx> AlgorithmIdentifier<'cx> {
    fn get_algorithm_name(&self, cx: &Context) -> ion::Result<Cow<str>> {
        match self {
            Self::String(str) => Ok(Cow::Borrowed(str.as_str())),
            Self::Object(obj) => {
                if let Some(name) = obj.get(cx, "name") {
                    if name.get().is_string() {
                        Ok(Cow::Owned(
                            ion::String::from(cx.root_string(name.get().to_string())).to_owned(cx),
                        ))
                    } else {
                        ion_err!("name key of AlgorithmIdentifier must be a string", Type)
                    }
                } else {
                    ion_err!("AlgorithmIdentifier must have a name key", Type)
                }
            }
        }
    }

    fn get_algorithm(&self, cx: &Context) -> ion::Result<Box<dyn CryptoAlgorithm>> {
        let alg_name = self.get_algorithm_name(cx)?;

        match alg_name.to_ascii_lowercase().as_str() {
            "sha-1" => Ok(Box::new(Sha::Sha1)),
            "sha-256" => Ok(Box::new(Sha::Sha256)),
            "sha-384" => Ok(Box::new(Sha::Sha384)),
            "sha-512" => Ok(Box::new(Sha::Sha512)),
            "md5" => Ok(Box::new(Md5)),
            "hmac" => Ok(Box::new(Hmac)),

            _ => Err(ion::Error::new(
                "Unknown algorithm identifier",
                ion::ErrorKind::Normal,
            )),
        }
    }

    fn to_params(&self, cx: &'cx Context) -> Object<'cx> {
        match self {
            Self::String(_) => Object::new(cx),
            Self::Object(o) => cx.root_object((**o).get()).into(),
        }
    }
}

impl<'cx> ToValue<'cx> for AlgorithmIdentifier<'cx> {
    fn to_value(&self, cx: &'cx Context, value: &mut ion::Value) {
        match self {
            Self::Object(o) => o.to_value(cx, value),
            Self::String(s) => s.to_value(cx, value),
        }
    }
}

#[js_fn]
fn sign<'cx>(
    cx: &'cx Context,
    algorithm: AlgorithmIdentifier<'cx>,
    key: &CryptoKey,
    data: BufferSource,
) -> Option<Promise> {
    unsafe {
        let key = TracedHeap::new(key.reflector().get());
        let alg = algorithm.get_algorithm(cx);
        let params = TracedHeap::from_local(&algorithm.to_params(cx));
        let data = data.into_heap();

        future_to_promise(cx, move |cx| async move {
            let key = CryptoKey::get_private(&key.root(&cx).into());
            let alg = alg?;

            let key_alg = KeyAlgorithm::get_private(&key.algorithm.root(&cx).into());
            if alg.name().to_ascii_lowercase() != key_alg.name.to_ascii_lowercase() {
                ion_err!(
                    "Provided key does not correspond to specified algorithm",
                    Normal
                );
            }

            if !key.usages.iter().any(|u| matches!(u, KeyUsage::Sign)) {
                ion_err!("Key does not support the 'sign' operation", Normal);
            }

            Ok(alg.sign(&cx, &params.root(&cx).into(), key, data)?.get())
        })
    }
}

#[js_fn]
fn verify<'cx>(
    cx: &'cx Context,
    algorithm: AlgorithmIdentifier<'cx>,
    key: &CryptoKey,
    signature: BufferSource,
    data: BufferSource,
) -> Option<Promise> {
    unsafe {
        let key = TracedHeap::new(key.reflector().get());
        let alg = algorithm.get_algorithm(cx);
        let params = TracedHeap::from_local(&algorithm.to_params(cx));
        let data = data.into_heap();
        let signature = signature.into_heap();

        future_to_promise(cx, move |cx| async move {
            let key = CryptoKey::get_private(&key.root(&cx).into());
            let alg = alg?;

            let key_alg = KeyAlgorithm::get_private(&key.algorithm.root(&cx).into());
            if alg.name().to_ascii_lowercase() != key_alg.name.to_ascii_lowercase() {
                ion_err!(
                    "Provided key does not correspond to specified algorithm",
                    Normal
                );
            }

            if !key.usages.iter().any(|u| matches!(u, KeyUsage::Verify)) {
                ion_err!("Key does not support the 'verify' operation", Normal);
            }

            alg.verify(&cx, &params.root(&cx).into(), key, signature, data)
        })
    }
}

#[js_fn]
fn digest<'cx>(
    cx: &'cx Context,
    algorithm: AlgorithmIdentifier<'cx>,
    data: BufferSource,
) -> Promise {
    Promise::new_from_result(cx, {
        algorithm
            .get_algorithm(cx)
            .and_then(|alg| alg.digest(cx, &algorithm.to_params(cx), data.into_heap()))
    })
}

#[js_fn]
fn generate_key<'cx>(
    cx: &'cx Context,
    algorithm: AlgorithmIdentifier<'cx>,
    extractable: bool,
    key_usages: Vec<KeyUsage>,
) -> Option<Promise> {
    unsafe {
        let alg = algorithm.get_algorithm(cx);
        let params = TracedHeap::from_local(&algorithm.to_params(cx));

        future_to_promise(cx, move |cx| async move {
            let alg = alg?;
            let key = alg.generate_key(&cx, &params.root(&cx).into(), extractable, key_usages)?;

            if matches!(key.key_type, KeyType::Secret | KeyType::Private) && key.usages.is_empty() {
                ion_err!(
                    "Usages must be specified for secret and private keys",
                    Syntax
                );
            }

            // TODO: handle CryptoKeyPair

            Ok(CryptoKey::new_object(&cx, Box::new(key)))
        })
    }
}

#[js_fn]
fn import_key<'cx>(
    cx: &'cx Context,
    key_format: KeyFormat,
    key_data: KeyData,
    algorithm: AlgorithmIdentifier<'cx>,
    extractable: bool,
    key_usages: Vec<KeyUsage>,
) -> Option<Promise> {
    unsafe {
        let alg = algorithm.get_algorithm(cx);
        let params = TracedHeap::from_local(&algorithm.to_params(cx));
        let key_data = key_data.into_heap();

        future_to_promise(cx, move |cx| async move {
            match (&key_format, &key_data) {
                (KeyFormat::Jwk, HeapKeyData::Jwk(_))
                | (KeyFormat::Pkcs8, HeapKeyData::BufferSource(_))
                | (KeyFormat::Raw, HeapKeyData::BufferSource(_))
                | (KeyFormat::Spki, HeapKeyData::BufferSource(_)) => (),
                (KeyFormat::Jwk, _) => {
                    return Err(ion::Error::new(
                        "When keyFormat is 'jwk', keyData must be a JsonWebKey",
                        ion::ErrorKind::Type,
                    ))
                }
                (_, _) => {
                    return Err(ion::Error::new(
                        "keyData must be a BufferSource",
                        ion::ErrorKind::Type,
                    ))
                }
            }

            let no_usages = key_usages.is_empty();

            let alg = alg?;
            let key = alg.import_key(
                &cx,
                &params.root(&cx).into(),
                key_format,
                key_data,
                extractable,
                key_usages,
            )?;

            if matches!(key.get_type(), KeyType::Private | KeyType::Secret) && no_usages {
                return Err(ion::Error::new(
                    "Private and secret keys must have a non-empty usages list.",
                    ion::ErrorKind::Syntax,
                ));
            }

            ion::Result::Ok(CryptoKey::new_object(&cx, Box::new(key)))
        })
    }
}

#[js_fn]
fn export_key(cx: &Context, key_format: KeyFormat, key: &CryptoKey) -> Option<Promise> {
    unsafe {
        let key_heap = TracedHeap::new(key.reflector().get());
        future_to_promise(cx, move |cx| async move {
            let key = CryptoKey::get_private(&key_heap.root(&cx).into());
            let alg_obj = key.algorithm.root(&cx).into();
            let alg = KeyAlgorithm::get_private(&alg_obj);
            let alg = AlgorithmIdentifier::String(alg.name.to_string()).get_algorithm(&cx)?;
            if !key.extractable {
                ion_err!("Key cannot be exported", Normal);
            }
            Ok(alg.export_key(&cx, key_format, key)?.get())
        })
    }
}

const METHODS: &[JSFunctionSpec] = &[
    function_spec!(digest, 2),
    function_spec!(sign, 3),
    function_spec!(verify, 4),
    function_spec!(generate_key, "generateKey", 3),
    function_spec!(import_key, "importKey", 5),
    function_spec!(export_key, "exportKey", 2),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, mut obj: Object) -> bool {
    unsafe { obj.define_methods(cx, METHODS) }
}

#[macro_export]
macro_rules! enum_value {
    ($e:ident) => {
        impl<'cx> FromValue<'cx> for $e {
            type Config = ();

            fn from_value(
                cx: &'cx ion::Context,
                value: &ion::Value,
                _strict: bool,
                _config: Self::Config,
            ) -> ion::Result<Self> {
                if !value.handle().is_string() {
                    Err(ion::Error::new(
                        "Value must be a string",
                        ion::ErrorKind::Type,
                    ))
                } else {
                    ion::String::from(cx.root_string(value.handle().to_string()))
                        .to_owned(cx)
                        .parse()
                        .map_err($crate::builtins::crypto::subtle::parse_error_to_type_error)
                }
            }
        }

        impl<'cx> ToValue<'cx> for $e {
            fn to_value(&self, cx: &'cx ion::Context, value: &mut ion::Value) {
                self.as_ref().to_value(cx, value)
            }
        }
    };
}

pub(crate) fn parse_error_to_type_error(_: ParseError) -> ion::Error {
    ion::Error::new("Invalid value for enum type", ion::ErrorKind::Type)
}
