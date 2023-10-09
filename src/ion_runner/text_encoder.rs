use ion::{function_spec, typedarray::ArrayBuffer, Object};
use mozjs_sys::jsapi::JSFunctionSpec;
use runtime::modules::NativeModule;

#[js_fn]
fn encode(v: String) -> ArrayBuffer {
    // The UTF-8 heavy-lifting happens in the std lib
    ArrayBuffer::from(v.as_bytes())
}

#[js_fn]
fn decode(v: Object) -> ion::Result<String> {
    if let Ok(arr) = mozjs::typedarray::ArrayBuffer::from(v.handle().get()) {
        Ok(String::from_utf8_lossy(unsafe { arr.as_slice() }).into_owned())
    } else if let Ok(arr) = mozjs::typedarray::ArrayBufferView::from(v.handle().get()) {
        Ok(String::from_utf8_lossy(unsafe { arr.as_slice() }).into_owned())
    } else if let Ok(arr) = mozjs::typedarray::Uint8Array::from(v.handle().get()) {
        Ok(String::from_utf8_lossy(unsafe { arr.as_slice() }).into_owned())
    } else {
        return Err(ion::Error::new(
            "Unexpected input type for textEncoder.decode",
            ion::ErrorKind::Type,
        ));
    }
}

const METHODS: &[JSFunctionSpec] = &[
    function_spec!(encode, 1),
    function_spec!(decode, 1),
    JSFunctionSpec::ZERO,
];

#[derive(Default)]
pub struct TextEncoderModule;

impl NativeModule for TextEncoderModule {
    const NAME: &'static str = "textEncoder";

    const SOURCE: &'static str = include_str!("text_encoder.js");

    fn module<'cx>(cx: &'cx ion::Context) -> Option<ion::Object<'cx>> {
        let mut ret = Object::new(cx);
        if unsafe { ret.define_methods(cx, METHODS) } {
            Some(ret)
        } else {
            None
        }
    }
}
