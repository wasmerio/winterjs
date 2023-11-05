use ion::{function_spec, typedarray::ArrayBuffer, Context, Object};
use mozjs_sys::jsapi::{JSFunctionSpec, JSObject};

use super::algorithm::{sha::Sha, CryptoAlgorithm};

pub struct CryptoKey {}

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

pub enum KeyFormat {
    Raw,
    Spki,
    Pkcs8,
    Jwk,
}

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

const METHODS: &[JSFunctionSpec] = &[function_spec!(digest, 2), JSFunctionSpec::ZERO];

pub fn define<'cx>(cx: &'cx Context, mut obj: Object) -> bool {
    unsafe { obj.define_methods(cx, METHODS) }
}
