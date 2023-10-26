use base64::Engine;
use ion::{function_spec, Context};
use mozjs_sys::jsapi::JSFunctionSpec;

#[js_fn]
fn btoa<'cx>(val: String) -> String {
    let bytes = val.as_bytes();
    ::base64::engine::general_purpose::STANDARD.encode(bytes)
}

#[js_fn]
fn atob<'cx>(val: String) -> ion::Result<String> {
    match ::base64::engine::general_purpose::STANDARD.decode(val.as_str()) {
        Err(_) => {
            return Err(ion::Error::new(
                "Failed to deserialize base64 data",
                ion::ErrorKind::Normal,
            ))
        }
        Ok(bytes) => Ok(String::from_utf8_lossy(&bytes[..]).into_owned()),
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
