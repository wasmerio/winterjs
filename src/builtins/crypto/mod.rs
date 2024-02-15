mod subtle;

use ion::{
    conversions::ToValue, function_spec, ClassDefinition, Context, Error, ErrorKind, Object, Result,
};
use mozjs::{
    jsapi::{DataView_ClassPtr, UnwrapFloat32Array, UnwrapFloat64Array},
    typedarray::ArrayBufferView,
};
use mozjs_sys::jsapi::{JSFunctionSpec, JSObject, JS_InstanceOf};
use rand::RngCore;

#[js_fn]
fn get_random_values(cx: &Context, array: ArrayBufferView) -> Result<*mut JSObject> {
    if array.len() > 65536 {
        return Err(Error::new("Quota exceeded", ErrorKind::Normal));
    }
    unsafe {
        let rooted = cx.root(*array.underlying_object());
        if !UnwrapFloat32Array(*array.underlying_object()).is_null()
            || !UnwrapFloat64Array(*array.underlying_object()).is_null()
            || JS_InstanceOf(
                cx.as_ptr(),
                rooted.handle().into(),
                DataView_ClassPtr,
                std::ptr::null_mut(),
            )
        {
            return Err(Error::new("Bad array element type", ErrorKind::Type));
        }
    }

    let mut array = array;
    let slice = unsafe { array.as_mut_slice() };
    rand::thread_rng().fill_bytes(slice);

    // We have to call underlying_object because ToValue is not
    // implemented for ArrayBufferView
    Ok(unsafe { *array.underlying_object() })
}

#[js_fn]
fn random_uuid() -> String {
    let id = uuid::Uuid::new_v4();
    id.to_string()
}

const METHODS: &[JSFunctionSpec] = &[
    function_spec!(get_random_values, "getRandomValues", 1),
    function_spec!(random_uuid, "randomUUID", 0),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, global: &ion::Object) -> bool {
    let crypto = Object::new(cx);
    let subtle = Object::new(cx);

    crypto.set(cx, "subtle", &subtle.as_value(cx))
        && global.set(cx, "crypto", &ion::Value::object(cx, &crypto))
        && subtle::define(cx, subtle)
        && subtle::crypto_key::CryptoKey::init_class(cx, global).0
        && subtle::crypto_key::KeyAlgorithm::init_class(cx, global).0
        && subtle::algorithm::hmac::HmacKeyAlgorithm::init_class(cx, global).0
        && unsafe { crypto.define_methods(cx, METHODS) }
}
