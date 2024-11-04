use std::path::PathBuf;

use ion::{flags::PropertyFlags, function_spec, Context, Object};
use mozjs::jsapi::JSFunctionSpec;

#[js_fn]
fn exec_path() -> String {
    let exec_path = std::env::args().next().unwrap();
    match std::fs::metadata(&exec_path) {
        Ok(_) => exec_path,
        Err(_) => {
            // If the path is from the host, we don't want to report it in full,
            // just the file name
            PathBuf::from(exec_path)
                .components()
                .last()
                .unwrap()
                .as_os_str()
                .to_string_lossy()
                .into_owned()
        }
    }
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(exec_path, "execPath", 0, PropertyFlags::CONSTANT),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, deno: &Object, main_module: &str) -> bool {
    unsafe {
        deno.define_methods(cx, FUNCTIONS)
            && deno.define_as(
                cx,
                "args",
                &std::env::args().skip(1).collect::<Vec<_>>(),
                PropertyFlags::CONSTANT,
            )
            && deno.define_as(cx, "mainModule", &main_module, PropertyFlags::CONSTANT)
    }
}
