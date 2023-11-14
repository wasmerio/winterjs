pub(super) mod algorithm;
pub(super) mod crypto_key;
pub(super) mod jwk;

use ion::{function_spec, typedarray::ArrayBuffer, Context, Object};
use mozjs_sys::jsapi::{JSFunctionSpec, JSObject};
use strum::ParseError;

use algorithm::{md5::Md5, sha::Sha, CryptoAlgorithm};

use self::{
    crypto_key::{CryptoKey, KeyFormat, KeyType, KeyUsage},
    jwk::JsonWebKey,
};

#[derive(FromValue)]
pub enum BufferSource {
    #[ion(inherit)]
    ArrayBuffer(mozjs::typedarray::ArrayBuffer),
    #[ion(inherit)]
    ArrayBufferView(mozjs::typedarray::ArrayBufferView),
}

impl BufferSource {
    pub fn as_slice(&self) -> &[u8] {
        match self {
            Self::ArrayBuffer(a) => unsafe { a.as_slice() },
            Self::ArrayBufferView(a) => unsafe { a.as_slice() },
        }
    }
}

#[derive(FromValue)]
pub enum KeyData {
    #[ion(inherit)]
    BufferSource(BufferSource),
    #[ion(inherit)]
    Jwk(JsonWebKey),
}

#[derive(FromValue)]
pub enum AlgorithmIdentifier {
    #[ion(inherit)]
    Object(*mut JSObject),
    #[ion(inherit)]
    String(String),
}

impl AlgorithmIdentifier {
    fn get_algorithm(&self, cx: &Context) -> ion::Result<Box<dyn CryptoAlgorithm>> {
        let name_string;
        let alg_name = match self {
            Self::String(str) => str.as_str(),
            Self::Object(obj) => {
                let obj = Object::from(cx.root_object(*obj));
                if let Some(name) = obj.get(cx, "name") {
                    if name.get().is_string() {
                        name_string =
                            ion::String::from(cx.root_string(name.get().to_string())).to_owned(cx);
                        name_string.as_str()
                    } else {
                        return Err(ion::Error::new(
                            "name key of AlgorithmIdentifier must be a string",
                            ion::ErrorKind::Type,
                        ));
                    }
                } else {
                    return Err(ion::Error::new(
                        "AlgorithmIdentifier must have a name key",
                        ion::ErrorKind::Type,
                    ));
                }
            }
        };

        match alg_name.to_ascii_lowercase().as_str() {
            "sha-1" => Ok(Box::new(Sha::Sha1)),
            "sha-256" => Ok(Box::new(Sha::Sha256)),
            "sha-384" => Ok(Box::new(Sha::Sha384)),
            "sha-512" => Ok(Box::new(Sha::Sha512)),
            "md5" => Ok(Box::new(Md5)),

            _ => Err(ion::Error::new(
                "Unknown algorithm identifier",
                ion::ErrorKind::Normal,
            )),
        }
    }

    fn into_params<'cx>(self, cx: &'cx Context) -> Object<'cx> {
        match self {
            Self::String(_) => Object::new(cx),
            Self::Object(o) => cx.root_object(o).into(),
        }
    }
}

#[js_fn]
async fn digest(
    cx: &Context<'_>,
    algorithm: AlgorithmIdentifier,
    data: BufferSource,
) -> ion::Result<ArrayBuffer> {
    let alg = algorithm.get_algorithm(cx)?;
    alg.digest(algorithm.into_params(cx), data)
}

#[js_fn]
async fn import_key(
    cx: &Context<'_>,
    key_format: KeyFormat,
    key_data: KeyData,
    algorithm: AlgorithmIdentifier,
    extractable: bool,
    key_usages: Vec<KeyUsage>,
) -> ion::Result<CryptoKey> {
    match (&key_format, &key_data) {
        (KeyFormat::Jwk, KeyData::Jwk(_))
        | (KeyFormat::Pkcs8, KeyData::BufferSource(_))
        | (KeyFormat::Raw, KeyData::BufferSource(_))
        | (KeyFormat::Spki, KeyData::BufferSource(_)) => (),
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

    let alg = algorithm.get_algorithm(cx)?;
    let key = alg.import_key(
        algorithm.into_params(cx),
        key_format,
        key_data,
        extractable,
        key_usages,
    )?;

    if matches!(key.key_type(), KeyType::Private | KeyType::Secret) && no_usages {
        return Err(ion::Error::new(
            "Private and secret keys must have a non-empty usages list.",
            ion::ErrorKind::Syntax,
        ));
    }

    Ok(key)
}

const METHODS: &[JSFunctionSpec] = &[function_spec!(digest, 2), JSFunctionSpec::ZERO];

pub fn define<'cx>(cx: &'cx Context, mut obj: Object) -> bool {
    unsafe { obj.define_methods(cx, METHODS) }
}

#[macro_export]
macro_rules! enum_value {
    ($e:ident) => {
        impl<'cx> FromValue<'cx> for $e {
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
                if !value.handle().is_string() {
                    Err(ion::Error::new(
                        "Value must be a string",
                        ion::ErrorKind::Type,
                    ))
                } else {
                    ion::String::from(cx.root_string(value.handle().to_string()))
                        .to_owned(cx)
                        .parse()
                        .map_err(crate::ion_runner::crypto::subtle::parse_error_to_type_error)
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
