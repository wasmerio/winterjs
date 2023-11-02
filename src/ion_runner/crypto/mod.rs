use ion::{function_spec, Object};
use mozjs_sys::jsapi::JSFunctionSpec;
use runtime::modules::NativeModule;

#[js_fn]
fn random_uuid() -> String {
    let id = uuid::Uuid::new_v4();
    id.to_string()
}

const METHODS: &[JSFunctionSpec] = &[
    function_spec!(random_uuid, "randomUUID", 0),
    JSFunctionSpec::ZERO,
];

#[derive(Default)]
pub struct CryptoModule;

impl NativeModule for CryptoModule {
    const NAME: &'static str = "crypto";

    const SOURCE: &'static str = include_str!("crypto.js");

    fn module<'cx>(cx: &'cx ion::Context) -> Option<ion::Object<'cx>> {
        let mut ret = Object::new(cx);
        if unsafe { ret.define_methods(cx, METHODS) } {
            Some(ret)
        } else {
            None
        }
    }
}
