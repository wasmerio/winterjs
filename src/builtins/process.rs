use ion::{conversions::ToValue, flags::PropertyFlags, Context, Object};

const VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn populate_env_object(cx: &Context, env: &Object) -> bool {
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

    true
}

pub fn define(cx: &Context, global: &Object) -> bool {
    let process = Object::new(cx);
    let env = Object::new(cx);
    populate_env_object(cx, &env);

    process.define(cx, "env", &env.as_value(cx), PropertyFlags::ENUMERATE)
        && process.define(
            cx,
            "version",
            &format!("WinterJS {VERSION}").as_value(cx),
            PropertyFlags::CONSTANT_ENUMERATED,
        )
        && global.define(
            cx,
            "process",
            &process.as_value(cx),
            PropertyFlags::ENUMERATE,
        )
}
