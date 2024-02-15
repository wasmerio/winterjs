use ion::{function_spec, Object};
use mozjs_sys::jsapi::JSFunctionSpec;
use runtime::module::NativeModule;

lazy_static::lazy_static! {
    static ref PERFORMANCE_ORIGIN: std::time::Instant = std::time::Instant::now();
}

#[js_fn]
fn now() -> f64 {
    PERFORMANCE_ORIGIN.elapsed().as_secs_f64() * 1_000.0
}

const METHODS: &[JSFunctionSpec] = &[function_spec!(now, 0), JSFunctionSpec::ZERO];

#[derive(Default)]
pub struct PerformanceModule;

impl NativeModule for PerformanceModule {
    const NAME: &'static str = "performance";

    const SOURCE: &'static str = include_str!("performance.js");

    fn module(cx: &ion::Context) -> Option<ion::Object> {
        let ret = Object::new(cx);
        if unsafe { ret.define_methods(cx, METHODS) } && ret.set_as(cx, "timeOrigin", &0.0f64) {
            Some(ret)
        } else {
            None
        }
    }
}
