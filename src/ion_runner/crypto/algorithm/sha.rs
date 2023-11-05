use ion::typedarray::ArrayBuffer;
use sha2::Digest;

use super::CryptoAlgorithm;

pub enum Sha {
    Sha1,
    Sha256,
    Sha384,
    Sha512,
}

impl CryptoAlgorithm for Sha {
    fn digest(&self, _params: ion::Object, data: super::BufferSource) -> ion::Result<ArrayBuffer> {
        match self {
            Self::Sha1 => {
                let data = sha1::Sha1::digest(unsafe { data.as_slice() });
                Ok(ArrayBuffer::from(&*data))
            }

            Self::Sha256 => {
                let data = sha2::Sha256::digest(unsafe { data.as_slice() });
                Ok(ArrayBuffer::from(&*data))
            }

            Self::Sha384 => {
                let data = sha2::Sha384::digest(unsafe { data.as_slice() });
                Ok(ArrayBuffer::from(&*data))
            }

            Self::Sha512 => {
                let data = sha2::Sha512::digest(unsafe { data.as_slice() });
                Ok(ArrayBuffer::from(&*data))
            }
        }
    }
}
