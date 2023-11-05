pub mod sha;

use ion::{typedarray::ArrayBuffer, Object};

use super::subtle::{BufferSource, CryptoKey, KeyFormat, KeyUsage};

#[allow(unused_variables)]
pub trait CryptoAlgorithm {
    fn encrypt(
        &self,
        params: Object,
        key: CryptoKey,
        data: BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn decrypt(
        &self,
        params: Object,
        key: CryptoKey,
        data: BufferSource,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn sign(&self, params: Object, key: CryptoKey, data: BufferSource) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn verify(
        &self,
        params: Object,
        key: CryptoKey,
        signature: BufferSource,
        data: BufferSource,
    ) -> ion::Result<bool> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn digest(&self, params: Object, data: BufferSource) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn derive_bits(
        &self,
        params: Object,
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
        params: Object,
        format: KeyFormat,
        key: CryptoKey,
        wrapping_key: CryptoKey,
    ) -> ion::Result<ArrayBuffer> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn unwrap_key(
        &self,
        params: Object,
        format: KeyFormat,
        wrapped_key: BufferSource,
        unwrapping_key: CryptoKey,
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
        params: Object,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<Object> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn import_key(
        &self,
        params: Object,
        format: KeyFormat,
        key_data: BufferSource,
        extractable: bool,
        usages: Vec<KeyUsage>,
    ) -> ion::Result<Object> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn export_key(&self, format: KeyFormat, key: CryptoKey) -> ion::Result<Object> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }

    fn get_key_length(&self, params: Object) -> ion::Result<usize> {
        Err(ion::Error::new(
            "Operation not supported by the specified algorithm",
            ion::ErrorKind::Normal,
        ))
    }
}
