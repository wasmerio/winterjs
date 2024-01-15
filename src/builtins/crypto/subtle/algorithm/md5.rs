use ion::{typedarray::ArrayBuffer, Context, Error, ErrorKind};

use super::CryptoAlgorithm;

pub struct Md5;

impl CryptoAlgorithm for Md5 {
    fn name(&self) -> &'static str {
        "MD5"
    }

    fn digest<'cx>(
        &self,
        cx: &'cx Context,
        _params: &ion::Object,
        data: super::HeapBufferSource,
    ) -> ion::Result<ArrayBuffer<'cx>> {
        let data = md5::compute(unsafe { data.as_slice() }).0;
        ArrayBuffer::copy_from_bytes(cx, &data[..])
            .ok_or_else(|| Error::new("Failed to allocate array", ErrorKind::Normal))
    }
}
