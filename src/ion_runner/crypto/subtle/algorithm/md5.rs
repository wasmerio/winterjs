use ion::{typedarray::ArrayBuffer, Context};

use super::CryptoAlgorithm;

pub struct Md5;

impl CryptoAlgorithm for Md5 {
    fn name(&self) -> &'static str {
        "MD5"
    }

    fn digest(
        &self,
        _cx: &Context,
        _params: &ion::Object,
        data: super::HeapBufferSource,
    ) -> ion::Result<ArrayBuffer> {
        let data = md5::compute(unsafe { data.as_slice() }).0;
        Ok(ArrayBuffer::from(&data[..]))
    }
}
