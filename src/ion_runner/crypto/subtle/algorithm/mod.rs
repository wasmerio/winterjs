pub mod hmac;
pub mod md5;
pub mod sha;

use ion::{typedarray::ArrayBuffer, Context, Object, Value};

use super::{
    crypto_key::{CryptoKey, KeyFormat, KeyUsage},
    BufferSource, KeyData,
};

#[allow(unused_variables)]
pub trait CryptoAlgorithm {
    fn name(&self) -> &'static str;

    fn get_jwk_identifier(&self) -> ion::Result<&'static str> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn encrypt(
        &self,
        cx: &Context,
        params: &Object,
        key: &CryptoKey,
        data: BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn decrypt(
        &self,
        cx: &Context,
        params: &Object,
        key: &CryptoKey,
        data: BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn sign(
        &self,
        cx: &Context,
        params: &Object,
        key: &CryptoKey,
        data: BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn verify(
        &self,
        cx: &Context,
        params: &Object,
        key: &CryptoKey,
        signature: BufferSource,
        data: BufferSource,
    ) -> ion::Result<bool> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn digest(
        &self,
        cx: &Context,
        params: &Object,
        data: BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn derive_bits(
        &self,
        cx: &Context,
        params: &Object,
        base_key: CryptoKey,
        length: usize,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn wrap_key(
        &self,
        cx: &Context,
        params: &Object,
        format: KeyFormat,
        key: &CryptoKey,
        wrapping_key: CryptoKey,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn unwrap_key(
        &self,
        cx: &Context,
        params: &Object,
        format: KeyFormat,
        wrapped_key: BufferSource,
        unwrapping_key: &CryptoKey,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn generate_key(
        &self,
        cx: &Context,
        params: &Object,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<CryptoKey> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn import_key(
        &self,
        cx: &Context,
        params: &Object,
        format: KeyFormat,
        key_data: KeyData,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<CryptoKey> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn export_key<'cx>(
        &self,
        cx: &'cx Context,
        format: KeyFormat,
        key: &CryptoKey,
    ) -> ion::Result<Value<'cx>> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn get_key_length(&self, cx: &Context, params: &Object) -> ion::Result<usize> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }
}
