use ion::{class::Reflector, flags::PropertyFlags, ClassDefinition, Context, Object};

use crate::ion_err;

// TODO: stub implementation
#[js_class]
#[derive(Debug)]
struct PermissionDenied {
    reflector: Reflector,
}

#[js_class]
impl PermissionDenied {
    #[ion(constructor)]
    pub fn constructor() -> ion::Result<PermissionDenied> {
        ion_err!("Cannot construct this type", Type)
    }
}

pub fn define(cx: &Context, deno: &Object) -> bool {
    let errors = Object::new(cx);

    PermissionDenied::init_class(cx, &errors).0
        && deno.define_as(cx, "errors", &errors, PropertyFlags::CONSTANT)
}
