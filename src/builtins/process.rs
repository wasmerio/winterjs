use ion::{conversions::ToValue, flags::PropertyFlags, Context, Object};

pub fn define(cx: &Context, global: &Object) -> bool {
    let process = Object::new(cx);
    let env = Object::new(cx);

    for (name, value) in std::env::vars() {
        // WINTERJS_* env vars are used to pass args to WinterJS itself, and are
        // useless for JS code
        if name.starts_with("WINTERJS_") {
            continue;
        }

        if !env.define(
            cx,
            name.as_str(),
            &value.as_value(cx),
            PropertyFlags::ENUMERATE,
        ) {
            return false;
        }
    }

    process.define(
        cx,
        "env",
        &env.as_value(cx),
        PropertyFlags::CONSTANT_ENUMERATED,
    ) && global.define(
        cx,
        "process",
        &process.as_value(cx),
        PropertyFlags::CONSTANT_ENUMERATED,
    )
}
