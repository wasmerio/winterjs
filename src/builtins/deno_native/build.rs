use ion::{flags::PropertyFlags, Context, Object};

pub fn define(cx: &Context, deno: &Object) -> bool {
    let build = Object::new(cx);

    // WASIX is very unix-like, so linux should be a good choice here.
    // The deno std lib obviously doesn't know what WASIX is.
    build.define_as(cx, "os", "linux", PropertyFlags::CONSTANT)
        && build.define_as(cx, "arch", "wasm32", PropertyFlags::CONSTANT)
        && deno.define_as(cx, "build", &build, PropertyFlags::CONSTANT)
}
