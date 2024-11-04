use std::io::IsTerminal;

use ion::{conversions::ConversionBehavior, flags::PropertyFlags, function_spec, Context, Object};
use mozjs::jsapi::JSFunctionSpec;

#[js_fn]
fn is_a_tty(#[ion(convert = ConversionBehavior::Clamp)] fd: i32) -> bool {
    match fd {
        libc::STDIN_FILENO => std::io::stdin().is_terminal(),
        libc::STDOUT_FILENO => std::io::stdout().is_terminal(),
        libc::STDERR_FILENO => std::io::stderr().is_terminal(),
        _ => false,
    }
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(is_a_tty, "isatty", 1, PropertyFlags::CONSTANT),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, deno: &Object) -> bool {
    let stdin = super::fs::File {
        rid: libc::STDIN_FILENO,
    };
    let stdout = super::fs::File {
        rid: libc::STDOUT_FILENO,
    };
    let stderr = super::fs::File {
        rid: libc::STDERR_FILENO,
    };

    unsafe {
        deno.define_methods(cx, FUNCTIONS)
            && deno.define_as(cx, "stdin", &stdin, PropertyFlags::CONSTANT)
            && deno.define_as(cx, "stdout", &stdout, PropertyFlags::CONSTANT)
            && deno.define_as(cx, "stderr", &stderr, PropertyFlags::CONSTANT)
    }
}
