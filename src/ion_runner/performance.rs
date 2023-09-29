use ion::{function_spec, Object};
use mozjs_sys::jsapi::JSFunctionSpec;
use runtime::modules::NativeModule;

lazy_static::lazy_static! {
    static ref PERFORMANCE_ORIGIN: std::time::Instant = std::time::Instant::now();
}

#[js_fn]
fn now() -> f64 {
    PERFORMANCE_ORIGIN.elapsed().as_secs_f64() * 1_000_000.0
}

const METHODS: &[JSFunctionSpec] = &[function_spec!(now, 0), JSFunctionSpec::ZERO];

#[derive(Default)]
pub struct PerformanceModule;

impl NativeModule for PerformanceModule {
    const NAME: &'static str = "performance";

    const SOURCE: &'static str = include_str!("performance.js");

    fn module<'cx>(cx: &'cx ion::Context) -> Option<ion::Object<'cx>> {
        let mut ret = Object::new(cx);
        if ret.define_methods(cx, METHODS) {
            Some(ret)
        } else {
            None
        }
    }
}
