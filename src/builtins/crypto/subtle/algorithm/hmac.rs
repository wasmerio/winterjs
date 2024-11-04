use std::{borrow::Cow, fmt::Debug};

use base64::Engine;
use hmac::{digest::generic_array::ArrayLength, Mac};
use ion::{
    conversions::{ConversionBehavior, FromValue, ToValue},
    typedarray::ArrayBuffer,
    ClassDefinition, Context, Error, ErrorKind, Heap, Result,
};
use mozjs_sys::jsval::JSVal;

use crate::{
    builtins::crypto::subtle::{
        crypto_key::{generate_random_key, CryptoKey, KeyAlgorithm, KeyFormat, KeyType, KeyUsage},
        jwk::JsonWebKey,
        AlgorithmIdentifier, HeapKeyData,
    },
    ion_err, ion_mk_err,
};

use super::CryptoAlgorithm;

macro_rules! validate_jwk_alg {
    ($hash_alg:ident, $jwk:ident, $name:expr, $jwk_name:expr) => {
        if let Some(jwk_alg) = &$jwk.alg {
            if $hash_alg.name() == $name && jwk_alg != $jwk_name {
                ion_err!(format!("alg field of JWK must be {}", $jwk_name), Normal);
            }
        }
    };
}

// The standard has two separate dictionaries, but they're the
// exact same, so we use one.
#[derive(FromValue)]
pub struct HmacImportOrKeyGenParams<'cx> {
    hash: AlgorithmIdentifier<'cx>,
    #[ion(convert = ConversionBehavior::EnforceRange, strict)]
    length: Option<u32>,
}

#[js_class]
pub struct HmacKeyAlgorithm {
    base: KeyAlgorithm,

    hash: Heap<JSVal>, // AlgorithmIdentifier
    length: u32,

    // This should live on the CryptoKey object as per
    // the standard, but it makes more sense to keep it
    // here since we can't be sure every algorithm uses
    // a Vec<u8> and it'd be difficult to create a trait
    // or enum to cover all algorithms.
    key_data: Vec<u8>,
}

impl Debug for HmacKeyAlgorithm {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("HmacKeyAlgorithm")
            .field("algorithm", &self.base)
            .finish()
    }
}

impl HmacKeyAlgorithm {
    pub fn new(hash: Heap<JSVal>, length: u32, key_data: Vec<u8>) -> Self {
        Self {
            base: KeyAlgorithm {
                reflector: Default::default(),
                name: "HMAC",
            },

            hash,
            length,
            key_data,
        }
    }
}

#[js_class]
impl HmacKeyAlgorithm {
    #[ion(constructor)]
    pub fn constructor() -> Result<HmacKeyAlgorithm> {
        ion_err!("Cannot construct this type", Type);
    }

    #[ion(get)]
    pub fn get_hash(&self) -> JSVal {
        self.hash.get()
    }

    #[ion(get)]
    pub fn get_length(&self) -> u32 {
        self.length
    }
}

pub struct Hmac;

impl CryptoAlgorithm for Hmac {
    fn name(&self) -> &'static str {
        "HMAC"
    }

    fn sign<'cx>(
        &self,
        cx: &'cx Context,
        _params: &ion::Object,
        key: &CryptoKey,
        data: Vec<u8>,
    ) -> ion::Result<ArrayBuffer<'cx>> {
        let key_alg = key.algorithm.root(cx).into();
        if !HmacKeyAlgorithm::instance_of(cx, &key_alg) {
            ion_err!("The provided key is not an HMAC key", Type);
        }

        let key_alg = HmacKeyAlgorithm::get_private(cx, &key_alg).unwrap();
        let hash_alg =
            AlgorithmIdentifier::from_value(cx, &key_alg.hash.root(cx).into(), false, ())?;

        let vec = sign(cx, &hash_alg, &key_alg.key_data, data.as_slice())?;
        ArrayBuffer::copy_from_bytes(cx, &vec[..])
            .ok_or_else(|| Error::new("Failed to allocate array", ErrorKind::Normal))
    }

    fn verify(
        &self,
        cx: &Context,
        params: &ion::Object,
        key: &CryptoKey,
        signature: Vec<u8>,
        data: Vec<u8>,
    ) -> ion::Result<bool> {
        let calculated = self.sign(cx, params, key, data)?;
        let calc_buf = unsafe { calculated.as_slice() };
        let sign_buf = signature.as_slice();
        Ok(calc_buf == sign_buf)
    }

    fn generate_key(
        &self,
        cx: &Context,
        params: &ion::Object,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<CryptoKey> {
        if usages
            .iter()
            .any(|u| !matches!(u, KeyUsage::Sign | KeyUsage::Verify))
        {
            ion_err!(
                "Invalid key usage specified; only 'sign' and 'verify' are allowed",
                Syntax
            );
        }

        let key_length = self.get_key_length(cx, params)?;
        let key_data = generate_random_key(key_length / 8, &mut rand::thread_rng());

        let params = HmacImportOrKeyGenParams::from_value(cx, &params.as_value(cx), false, ())?;

        // Make sure the algorithm identifier is valid
        let _ = params.hash.get_algorithm(cx)?;

        let alg = HmacKeyAlgorithm::new(
            Heap::new(params.hash.as_value(cx).get()),
            key_length as u32,
            key_data,
        );
        let alg = HmacKeyAlgorithm::new_object(cx, Box::new(alg));

        Ok(CryptoKey::new(
            extractable,
            Heap::new(alg),
            KeyType::Secret,
            usages,
        ))
    }

    fn import_key(
        &self,
        cx: &Context,
        params: &ion::Object,
        format: KeyFormat,
        key_data: HeapKeyData,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<CryptoKey> {
        if usages
            .iter()
            .any(|u| !matches!(u, KeyUsage::Sign | KeyUsage::Verify))
        {
            return Err(ion::Error::new("Invalid key usage", ion::ErrorKind::Syntax));
        }

        let params = HmacImportOrKeyGenParams::from_value(cx, &params.as_value(cx), false, ())?;
        let hash_alg = params.hash.get_algorithm(cx)?;

        let key_bytes = match format {
            KeyFormat::Raw => {
                let HeapKeyData::Buffer(buffer) = &key_data else {
                    panic!("Invalid key format/key data combination, should be validated before passing in");
                };
                Cow::Borrowed(buffer.as_slice())
            }
            KeyFormat::Jwk => {
                let HeapKeyData::Jwk(jwk) = key_data else {
                    panic!("Invalid key format/key data combination, should be validated before passing in");
                };
                if jwk.kty != "oct" {
                    ion_err!("kty member of JWK key must be 'oct'", Normal);
                }
                let Some(k) = jwk.k else {
                    ion_err!("Mandatory member k of JWK not specified", Normal);
                };

                validate_jwk_alg!(hash_alg, jwk, "SHA-1", "HS1");
                validate_jwk_alg!(hash_alg, jwk, "SHA-256", "HS256");
                validate_jwk_alg!(hash_alg, jwk, "SHA-384", "HS384");
                validate_jwk_alg!(hash_alg, jwk, "SHA-512", "HS512");

                if let Some(r#use) = jwk.r#use {
                    if r#use != "sign" && !usages.is_empty() {
                        ion_err!("use member of JWK key must be 'sign'", Normal);
                    }
                }

                if let Some(key_ops) = jwk.key_ops {
                    if usages
                        .iter()
                        .any(|u| !key_ops.iter().any(|o| o.as_str() == u.as_ref()))
                    {
                        ion_err!(
                            "key_ops member of JWK must include all specified usages",
                            Normal
                        );
                    }
                }

                if let Some(ext) = jwk.ext {
                    if !ext && extractable {
                        ion_err!(
                            "ext member of JWK must be true when extractable is specified as true",
                            Normal
                        );
                    }
                }

                Cow::Owned(
                    base64::prelude::BASE64_STANDARD.decode(k).map_err(|_| {
                        ion_mk_err!("Invalid base64 data in k field of JWK", Normal)
                    })?,
                )
            }
            _ => {
                return Err(ion::Error::new(
                    "Unsupported key type",
                    ion::ErrorKind::Normal,
                ))
            }
        };

        let mut length = key_bytes.len() as u32 * 8;
        if length == 0 {
            ion_err!("Key length cannot be zero", Normal);
        }

        if let Some(params_length) = params.length {
            if params_length > length || params_length <= length - 8 {
                ion_err!("Key data length must match the specified length", Normal);
            }
            length = params_length;
        }

        let algorithm = HmacKeyAlgorithm::new_object(
            cx,
            Box::new(HmacKeyAlgorithm::new(
                Heap::from_local(&params.hash.as_value(cx)),
                length,
                key_bytes.into_owned(),
            )),
        );

        Ok(CryptoKey::new(
            extractable,
            Heap::new(algorithm),
            KeyType::Secret,
            usages,
        ))
    }

    fn export_key<'cx>(
        &self,
        cx: &'cx Context,
        format: KeyFormat,
        key: &CryptoKey,
    ) -> ion::Result<ion::Value<'cx>> {
        let alg = key.algorithm.root(cx).into();
        if !HmacKeyAlgorithm::instance_of(cx, &alg) {
            ion_err!(
                "The algorithm of the key should be an instance of HmacKeyAlgorithm",
                Type
            );
        }

        let alg = HmacKeyAlgorithm::get_private(cx, &alg).unwrap();

        match format {
            KeyFormat::Raw => {
                let ab = ArrayBuffer::copy_from_bytes(cx, alg.key_data.as_ref())
                    .ok_or_else(|| Error::new("Failed to allocate array", ErrorKind::Normal))?;
                Ok(ab.as_value(cx))
            }

            KeyFormat::Jwk => {
                let key_data = base64::prelude::BASE64_STANDARD_NO_PAD.encode(&alg.key_data);
                let hash_alg =
                    AlgorithmIdentifier::from_value(cx, &alg.hash.root(cx).into(), false, ())?;
                let alg = hash_alg.get_algorithm(cx)?;
                let jwk = JsonWebKey {
                    kty: "oct".to_string(),
                    k: Some(key_data),
                    alg: Some(alg.get_jwk_identifier()?.to_string()),
                    key_ops: Some(key.usages.iter().map(|u| u.as_ref().to_string()).collect()),
                    ext: Some(key.extractable),
                    ..Default::default()
                };
                Ok(jwk.as_value(cx))
            }

            _ => ion_err!("Unsupported key type", Normal),
        }
    }

    fn get_key_length(&self, cx: &Context, params: &ion::Object) -> ion::Result<usize> {
        let params = HmacImportOrKeyGenParams::from_value(cx, &params.as_value(cx), false, ())?;

        match params.length {
            None => {
                let alg = params.hash.get_algorithm(cx)?;
                return alg.get_key_length(cx, &params.hash.to_params(cx));
            }
            Some(length) => {
                if length > 0 {
                    return Ok(length as usize);
                }
            }
        }

        ion_err!("Key length is unknown", Type);
    }
}

fn sign(
    cx: &Context,
    alg_id: &AlgorithmIdentifier,
    key_data: &[u8],
    data: &[u8],
) -> Result<Vec<u8>> {
    let alg_name = alg_id.get_algorithm_name(cx)?;

    match alg_name.to_ascii_lowercase().as_str() {
        "sha-1" => Ok(sign_generic(
            hmac::Hmac::<sha1::Sha1>::new_from_slice(key_data)?,
            data,
        )),
        "sha-256" => Ok(sign_generic(
            hmac::Hmac::<sha2::Sha256>::new_from_slice(key_data)?,
            data,
        )),
        "sha-384" => Ok(sign_generic(
            hmac::Hmac::<sha2::Sha384>::new_from_slice(key_data)?,
            data,
        )),
        "sha-512" => Ok(sign_generic(
            hmac::Hmac::<sha2::Sha512>::new_from_slice(key_data)?,
            data,
        )),

        _ => ion_err!("Unsupported algorithm for HMAC hash", Type),
    }
}

fn sign_generic<OS: ArrayLength<u8> + 'static>(
    mut mac: impl Mac<OutputSize = OS>,
    data: &[u8],
) -> Vec<u8> {
    mac.update(data);
    mac.finalize().into_bytes().to_vec()
}
