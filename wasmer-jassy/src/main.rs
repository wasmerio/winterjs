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

use ::std::{ffi::CStr, ptr, str};

use mozjs::{
    glue::EncodeStringToUTF8,
    jsapi::*,
    jsval::UndefinedValue,
    rooted,
    rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS},
};
use mozjs::conversions::{FromJSValConvertible, ConversionResult};

const ADD_EVENT_LISTENER: &[u8] = b"addEventListener\0";

fn run(rt: Runtime) {
    let options = RealmOptions::default();
    rooted!(in(rt.cx()) let global = unsafe {
        JS_NewGlobalObject(rt.cx(), &SIMPLE_GLOBAL_CLASS, ptr::null_mut(),
                           OnNewGlobalHookOption::FireOnNewGlobalHook,
                           &*options)
    });

    let function = unsafe { JS_DefineFunction(
        rt.cx(),
        global.handle().into(),
        b"addEventListener\0".as_ptr() as *const i8,
        Some(add_event_listener),
        2,
        0,
    )
    };
    assert!(!function.is_null());

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
    let source: &'static str = r#"
        addEventListener("fetch", () => {});

    "#;

    let res = rt.evaluate_script(global.handle(), source, filename, lineno, rval.handle_mut());

    if res.is_ok() {
        /* Should get a number back from the example source. */
        assert!(rval.get().is_int32());
        assert_eq!(rval.get().to_int32(), 42);
    }
}

unsafe extern "C" fn add_event_listener(
    context: *mut JSContext,
    argc: u32,
    vp: *mut Value,
) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    if args.argc_ != 2 {
        JS_ReportErrorASCII(
            context,
            b"addEventListener() requires two arguments\0".as_ptr() as *const i8,
        );
        return false;
    }

    let arg1 = mozjs::rust::Handle::from_raw(args.get(0));

    // let js = mozjs::rust::ToString(context, arg);

    let name = match String::from_jsval(context, arg1, ()).unwrap() {
        ConversionResult::Success(v) => v,
        ConversionResult::Failure(msg) => {
            panic!("expected a string");
        }
    };

    dbg!(&name);

    // let name: String;
    // EncodeStringToUTF8(context, message_root.handle().into(), |message| {
    //     let message = CStr::from_ptr(message);
    //     name = String::from_utf8(message.to_bytes().to_vec()).expect("non-utf8 string");
    // });

    eprintln!("name: {name}");

    args.rval().set(UndefinedValue());
    true
}

fn main() {
    let engine = JSEngine::init().expect("failed to initalize JS engine");
    let runtime = Runtime::new(engine.handle());
    assert!(!runtime.cx().is_null(), "failed to create JSContext");
    run(runtime);
}
