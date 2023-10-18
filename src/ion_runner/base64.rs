use base64::Engine;
use ion::{function_spec, Context};
use mozjs_sys::jsapi::JSFunctionSpec;

#[js_fn]
fn btoa<'cx>(cx: &'cx Context, val: ion::String<'cx>) -> ion::String<'cx> {
    let str = val.to_owned(cx);
    let bytes = str.as_bytes();
    ion::String::new(
        cx,
        ::base64::engine::general_purpose::STANDARD
            .encode(bytes)
            .as_str(),
    )
    .unwrap()
}

#[js_fn]
fn atob<'cx>(cx: &'cx Context, val: ion::String<'cx>) -> ion::Result<ion::String<'cx>> {
    let str = val.to_owned(cx);
    match ::base64::engine::general_purpose::STANDARD.decode(&str) {
        Err(_) => {
            return Err(ion::Error::new(
                "Failed to deserialize base64 data",
                ion::ErrorKind::Normal,
            ))
        }
        Ok(bytes) => Ok(ion::String::new(
            cx,
            String::from_utf8_lossy(&bytes[..]).into_owned().as_str(),
        )
        .unwrap()),
    }
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(atob, 1),
    function_spec!(btoa, 1),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, global: &mut ion::Object) -> bool {
    unsafe { global.define_methods(cx, FUNCTIONS) }
}
