use ion::{flags::PropertyFlags, function_spec, Context, Object};
use mozjs::jsapi::{JSFunctionSpec, JSObject};

#[js_fn]
fn get_env(key: String) -> Option<String> {
    std::env::var(key).ok()
}

// TODO: this does not update the process.env object, which is
// populated at startup
#[js_fn]
fn set_env(key: String, value: String) {
    std::env::set_var(key, value);
}

#[js_fn]
fn to_object(cx: &Context) -> *mut JSObject {
    let obj = Object::new(cx);
    super::super::process::populate_env_object(cx, &obj);
    (*obj).get()
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(get_env, "get", 1, PropertyFlags::CONSTANT),
    function_spec!(set_env, "set", 2, PropertyFlags::CONSTANT),
    function_spec!(to_object, "toObject", 0, PropertyFlags::CONSTANT),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, deno: &Object) -> bool {
    let env = Object::new(cx);

    unsafe {
        env.define_methods(cx, FUNCTIONS)
            && deno.define_as(cx, "env", &env, PropertyFlags::CONSTANT)
    }
}
