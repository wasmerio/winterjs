use ion::{function_spec, Context, Object, Value};
use mozjs_sys::jsapi::JSFunctionSpec;

lazy_static::lazy_static! {
    static ref PERFORMANCE_ORIGIN: std::time::Instant = std::time::Instant::now();
}

#[js_fn]
fn now() -> f64 {
    PERFORMANCE_ORIGIN.elapsed().as_secs_f64() * 1_000.0
}

const METHODS: &[JSFunctionSpec] = &[function_spec!(now, 0), JSFunctionSpec::ZERO];

pub fn define(cx: &Context, global: &Object) -> bool {
    let performance = Object::new(cx);
    performance.set_as(cx, "timeOrigin", &0.0f64)
        && unsafe { performance.define_methods(cx, METHODS) }
        && global.set_as(cx, "performance", &Value::object(cx, &performance))
}
