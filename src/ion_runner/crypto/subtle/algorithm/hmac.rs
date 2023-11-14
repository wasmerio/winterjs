use ion::{
    conversions::{ConversionBehavior, FromValue, ToValue},
    Context,
};

use crate::{
    ion_runner::crypto::subtle::{
        crypto_key::{CryptoKey, KeyFormat, KeyUsage},
        AlgorithmIdentifier, KeyData,
    },
    ionerr,
};

use super::CryptoAlgorithm;

macro_rules! validate_jwk_alg {
    ($hash_alg:ident, $jwk:ident, $name:expr, $jwk_name:expr) => {
        if let Some(jwk_alg) = $jwk.alg {
            if $hash_alg.name() == $name && jwk_alg != $jwk_name {
                ionerr!(
                    format!("alg field of JWK must be {}", $jwk_name).as_str(),
                    Normal
                );
            }
        }
    };
}

#[derive(FromValue)]
pub struct HmacImportParams {
    name: String,
    hash: String,
    #[ion(convert = ConversionBehavior::EnforceRange, strict)]
    length: u32,
}

#[derive(FromValue)]
pub struct HmacKeyAlgorithm {
    name: String,
    hash: String,
    #[ion(convert = ConversionBehavior::EnforceRange, strict)]
    length: u32,
}

#[derive(FromValue)]
pub struct HmacKeyGenParams {
    name: String,
    hash: String,
    #[ion(convert = ConversionBehavior::EnforceRange, strict)]
    length: u32,
}

pub struct Hmac;

impl CryptoAlgorithm for Hmac {
    fn name(&self) -> &'static str {
        "HMAC"
    }

    fn import_key(
        &self,
        cx: &Context,
        params: ion::Object,
        format: KeyFormat,
        key_data: KeyData,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<CryptoKey> {
        if usages
            .iter()
            .any(|u| !matches!(u, KeyUsage::Sign | KeyUsage::Verify))
        {
            return Err(ion::Error::new("Invalid key usage", ion::ErrorKind::Syntax));
        }

        let params = HmacImportParams::from_value(cx, &params.as_value(cx), false, ())?;
        let hash_alg = AlgorithmIdentifier::String(params.hash).get_algorithm(cx)?;

        let key_bytes = match format {
            KeyFormat::Raw => {
                let KeyData::BufferSource(buffer) = key_data else {
                    panic!("Invalid key format/key data combination, should be validated before passing in");
                };
                buffer.as_slice()
            }
            KeyFormat::Jwk => {
                let KeyData::Jwk(jwk) = key_data else {
                    panic!("Invalid key format/key data combination, should be validated before passing in");
                };
                if jwk.kty != "oct" {
                    ionerr!("kty member of JWK key must be 'oct'", Normal);
                }
                let Some(k) = jwk.k else {
                    ionerr!("Mandatory member k of JWK not specified", Normal);
                };

                validate_jwk_alg!(hash_alg, jwk, "SHA-1", "HS1");
                validate_jwk_alg!(hash_alg, jwk, "SHA-256", "HS256");
                validate_jwk_alg!(hash_alg, jwk, "SHA-384", "HS384");
                validate_jwk_alg!(hash_alg, jwk, "SHA-512", "HS512");

                /*
                If usages is non-empty and the use field of jwk is present and is not "sign", then throw a DataError.

                If the key_ops field of jwk is present, and is invalid according to the requirements of JSON Web Key [JWK] or does not contain all of the specified usages values, then throw a DataError.

                If the ext field of jwk is present and has the value false and extractable is true, then throw a DataError.  */

                k.as_bytes()
            }
            _ => {
                return Err(ion::Error::new(
                    "Unsupported key type",
                    ion::ErrorKind::Normal,
                ))
            }
        };

        ()
    }
}
