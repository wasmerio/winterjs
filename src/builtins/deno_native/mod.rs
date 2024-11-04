//! Native polyfills for the `Deno.*` functionality, required for the
//! deno std lib's JS code to work.

mod build;
mod core;
mod env;
mod errors;
mod exec;
mod fs;
mod io;
mod util;

use ion::{flags::PropertyFlags, Context, Object, ResultExc, Value};

use crate::ion_mk_err;

// This doesn't exactly belong here, but since the `createRequire` implementation
// is provided by deno-std, it's simpler to have it here.
pub fn create_require<'cx>(cx: &'cx Context, main_module: &str) -> ResultExc<Object<'cx>> {
    let create_require = util::get_builtin_function(cx, "module", "createRequire")?;
    let result_val = create_require
        .call(cx, &Object::null(cx), &[Value::string(cx, main_module)])
        .map_err(|e| {
            e.expect("createRequire should register an exception if it fails")
                .exception
        })?;
    if result_val.handle().is_object() {
        Ok(result_val.to_object(cx))
    } else {
        Err(ion_mk_err!("createRequire should return an object", Type).into())
    }
}

pub(super) fn define(cx: &Context, global: &Object, main_module: &str) -> bool {
    let deno = Object::new(cx);

    build::define(cx, &deno)
        && core::define(cx, &deno)
        && env::define(cx, &deno)
        && errors::define(cx, &deno)
        && exec::define(cx, &deno, main_module)
        && fs::define(cx, &deno)
        && io::define(cx, &deno)
        && global.define_as(cx, "Deno", &deno, PropertyFlags::CONSTANT)
}
