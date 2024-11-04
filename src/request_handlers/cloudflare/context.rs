use ion::{
    class::{ClassDefinition, Reflector},
    Object, Result,
};
use mozjs_sys::jsapi::JSObject;

use crate::ion_err;

#[js_class]
#[derive(Debug)]
pub struct Context {
    reflector: Reflector,
}

impl Context {
    pub fn new_obj(cx: &ion::Context) -> *mut JSObject {
        Self::new_object(
            cx,
            Box::new(Self {
                reflector: Default::default(),
            }),
        )
    }
}

#[js_class]
impl Context {
    #[ion(constructor)]
    pub fn constructor() -> Result<Context> {
        ion_err!("Cannot construct this type", Type)
    }

    #[ion(name = "waitUntil")]
    pub fn wait_until(&self, _promise: ion::Promise) {
        // No need to do anything, the runtime will run the promise anyway
    }

    #[ion(name = "passThroughOnException")]
    pub fn pass_through_on_exception() -> Result<()> {
        ion_err!("Not supported", Type);
    }
}

pub fn define(cx: &ion::Context, global: &Object) -> bool {
    Context::init_class(cx, global).0
}
