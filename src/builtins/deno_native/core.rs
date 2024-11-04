use ion::{flags::PropertyFlags, Context, Object};

mod eval;
mod promise;

pub fn define(cx: &Context, deno: &Object) -> bool {
    let core = Object::new(cx);

    eval::define(cx, &core)
        && promise::define(cx, &core)
        && deno.define_as(cx, "core", &core, PropertyFlags::CONSTANT)
}
