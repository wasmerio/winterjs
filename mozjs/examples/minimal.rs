/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#![allow(
    non_upper_case_globals,
    non_camel_case_types,
    non_snake_case,
    improper_ctypes
)]

//! # A minimal example
//! Here is the code under "A minimal example" in the MDN User Guide[1] translated into Rust.
//! [1]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/JSAPI_User_Guide

use ::std::ptr;

use mozjs::rooted;
use mozjs::rust::SIMPLE_GLOBAL_CLASS;
use mozjs::{jsapi::*, rust::JSEngine, rust::RealmOptions, rust::Runtime};

fn main() {
    // Initialize the JS engine. This handle must be kept alive in order to create new Runtimes.
    let engine = JSEngine::init().expect("failed to initalize JS engine");

    // Create a Runtime -- wraps a JSContext in the C++ API.
    let runtime = Runtime::new(engine.handle());
    assert!(!runtime.cx().is_null(), "failed to create JSContext");

    run(runtime);

    // There is no need for the shut down block in the C++, because rust destructors and Arc
    // reference counts will clean up everything.
}

fn run(rt: Runtime) {
    let cx = rt.cx();
    // In addition to what the C++ interface requires, define a global scope for the code.
    //
    // This demonstrates the way Rust uses the C++ garbage collector: using the rooted! macro to
    // indicate when the GC can collect them.
    let options = RealmOptions::default();
    rooted!(in(cx) let _global = unsafe {
        JS_NewGlobalObject(cx, &SIMPLE_GLOBAL_CLASS, ptr::null_mut(),
                           OnNewGlobalHookOption::FireOnNewGlobalHook,
                           &*options)
    });

    // Your application code here. This may include JSAPI calls to create your
    // own custom JS objects and run scripts.
}
