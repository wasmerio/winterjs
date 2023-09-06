#![allow(
    non_upper_case_globals,
    non_camel_case_types,
    non_snake_case,
    improper_ctypes
)]

//! # Running scripts
//! Here is the code under "Running scripts" in the MDN User Guide[1] translated into Rust. This
//! only shows the ``run()`` function's contents because the original does as well.
//!
//! The actual code that is run is designed to be testable, unlike the example given.
//! [1]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/JSAPI_User_Guide
//!

use ::std::ptr;

use mozjs::jsapi::*;
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::SIMPLE_GLOBAL_CLASS;
use mozjs::rust::{JSEngine, RealmOptions, Runtime};

fn run(rt: Runtime) {
    let options = RealmOptions::default();
    rooted!(in(rt.cx()) let global = unsafe {
        JS_NewGlobalObject(rt.cx(), &SIMPLE_GLOBAL_CLASS, ptr::null_mut(),
                           OnNewGlobalHookOption::FireOnNewGlobalHook,
                           &*options)
    });

    /* These should indicate source location for diagnostics. */
    let filename: &'static str = "inline.js";
    let lineno: u32 = 1;

    /*
     * The return value comes back here. If it could be a GC thing, you must add it to the
     * GC's "root set" with the rooted! macro.
     */
    rooted!(in(rt.cx()) let mut rval = UndefinedValue());

    /*
     * Some example source in a string. This is equivalent to JS_EvaluateScript in C++.
     */
    let source: &'static str = "40 + 2";

    let res = rt.evaluate_script(global.handle(), source, filename, lineno, rval.handle_mut());

    if res.is_ok() {
        /* Should get a number back from the example source. */
        assert!(rval.get().is_int32());
        assert_eq!(rval.get().to_int32(), 42);
    }
}

fn main() {
    let engine = JSEngine::init().expect("failed to initalize JS engine");
    let runtime = Runtime::new(engine.handle());
    assert!(!runtime.cx().is_null(), "failed to create JSContext");
    run(runtime);
}
