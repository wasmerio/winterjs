use std::path::Path;

use ion::{conversions::ToValue, flags::PropertyFlags, function_spec, Context, Object, Value};
use mozjs::{jsapi::JSFunctionSpec, jsval::JSVal};

#[js_fn]
fn eval_context(cx: &Context, code: String, file_name: String) -> Vec<JSVal> {
    match ion::script::Script::compile_and_evaluate(cx, &Path::new(&file_name), &code) {
        Ok(val) => vec![val.get(), Value::undefined(cx).get()],
        Err(e) => {
            let err_obj = Object::new(cx);
            err_obj.set(cx, "thrown", &e.exception.as_value(cx));
            vec![Value::undefined(cx).get(), err_obj.as_value(cx).get()]
        }
    }
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(eval_context, "evalContext", 2, PropertyFlags::CONSTANT),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, deno_core: &Object) -> bool {
    unsafe { deno_core.define_methods(cx, FUNCTIONS) }
}
