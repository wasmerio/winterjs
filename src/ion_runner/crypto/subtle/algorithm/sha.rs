use ion::{typedarray::ArrayBuffer, Context};
use sha2::Digest;

use super::CryptoAlgorithm;

pub enum Sha {
    Sha1,
    Sha256,
    Sha384,
    Sha512,
}

impl CryptoAlgorithm for Sha {
    fn name(&self) -> &'static str {
        match self {
            Self::Sha1 => "SHA-1",
            Self::Sha256 => "SHA-256",
            Self::Sha384 => "SHA-384",
            Self::Sha512 => "SHA-512",
        }
    }

    fn get_jwk_identifier(&self) -> ion::Result<&'static str> {
        Ok(match self {
            Self::Sha1 => "HS1",
            Self::Sha256 => "HS256",
            Self::Sha384 => "HS384",
            Self::Sha512 => "HS512",
        })
    }

    fn digest(
        &self,
        _cx: &Context,
        _params: &ion::Object,
        data: super::BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        match self {
            Self::Sha1 => {
                let data = sha1::Sha1::digest(data.as_slice());
                Ok(ArrayBuffer::from(&*data))
            }

            Self::Sha256 => {
                let data = sha2::Sha256::digest(data.as_slice());
                Ok(ArrayBuffer::from(&*data))
            }

            Self::Sha384 => {
                let data = sha2::Sha384::digest(data.as_slice());
                Ok(ArrayBuffer::from(&*data))
            }

            Self::Sha512 => {
                let data = sha2::Sha512::digest(data.as_slice());
                Ok(ArrayBuffer::from(&*data))
            }
        }
    }

    fn get_key_length(&self, _cx: &Context, _params: &ion::Object) -> ion::Result<usize> {
        match self {
            Self::Sha1 => Ok(20),
            Self::Sha256 => Ok(64),
            Self::Sha384 => Ok(48),
            Self::Sha512 => Ok(512),
        }
    }
}
