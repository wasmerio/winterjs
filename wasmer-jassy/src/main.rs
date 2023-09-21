/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ffi::CStr;
use std::mem::MaybeUninit;
use std::ptr;
use std::str;

use mozjs::glue::EncodeStringToUTF8;
use mozjs::jsapi::{CallArgs, JSAutoRealm, JSContext, OnNewGlobalHookOption, Value};
use mozjs::jsapi::{
    JS_DefineFunction, JS_NewGlobalObject, JS_ObjectIsFunction, JS_ReportErrorASCII,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};
use mozjs_sys::jsval::DoubleValue;
use mozjs_sys::jsval::JSVal;

fn main() {
    let user_code = r#"
        let x = performance.now();
        console.log(x);
    "#;
    run_code(user_code).expect("could not execute Javascript code");
}

fn run_code(user_code: &str) -> Result<(), anyhow::Error> {
    let engine = JSEngine::init().unwrap();
    let runtime = Runtime::new(engine.handle());
    let context = runtime.cx();
    let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
    let c_option = RealmOptions::default();

    unsafe {
        rooted!(in(context) let global = JS_NewGlobalObject(
            context,
            &SIMPLE_GLOBAL_CLASS,
            ptr::null_mut(),
            h_option,
            &*c_option,
        ));
        let _ac = JSAutoRealm::new(context, global.get());

        let function = JS_DefineFunction(
            context,
            global.handle().into(),
            b"addEventListener\0".as_ptr() as *const i8,
            Some(add_event_listener),
            2,
            0,
        );
        assert!(!function.is_null());

        let function = JS_DefineFunction(
            context,
            global.handle().into(),
            b"__native_performance_now\0".as_ptr() as *const i8,
            Some(performance_now),
            2,
            0,
        );
        assert!(!function.is_null());

        let function = JS_DefineFunction(
            context,
            global.handle().into(),
            b"__native_log\0".as_ptr() as *const i8,
            Some(log),
            2,
            0,
        );
        assert!(!function.is_null());

        // Evaluate custom js setup code.
        {
            rooted!(in(context) let mut rval = UndefinedValue());
            assert!(runtime
                .evaluate_script(global.handle(), JS_SETUP, "test.js", 0, rval.handle_mut())
                .is_ok());
        }

        rooted!(in(context) let mut rval = UndefinedValue());
        assert!(runtime
            .evaluate_script(global.handle(), user_code, "test.js", 0, rval.handle_mut())
            .is_ok());
        eprintln!("done");
    }

    Ok(())
}

const JS_SETUP: &str = r#"

(function() {
    // performance
    if ((typeof __native_performance_now) !== 'function') {
      throw new Error("setup error: __native_performance_now not found");
    }
    globalThis.performance = {
        now: __native_performance_now,
    };

    // console
    if ((typeof __native_log) !== 'function') {
      throw new Error("setup error: __native_log not found");
    }
    globalThis.console = {
        log: function() {
            __native_log.apply(null, Object.values(arguments).map(JSON.stringify));
        }
    };

    // events
    const FETCH_HANDLERS = {};

    globalThis.addEventListener = function(ev, callback) {
      if (ev !== 'fetch') {
        throw new Error('only the "fetch" event is supported');
      }

      if ((typeof callback) !== 'function') {
        throw new Error('callback must be a function');
      }

      const index = Object.keys(FETCH_HANDLERS).length;

      // We might lift this limitation in the future.
      if (index > 0) {
        throw new Error('only one fetch handler is supported');
      }
      FETCH_HANDLERS[index] = callback;
      return index;
    };

    globalThis.__wasmer_callEventHandlers = function(request) {
      for (const handler of Object.values(FETCH_HANDLERS)) {
        handler(request);
      }
    };
})()

"#;

lazy_static::lazy_static! {
    static ref PERFORMANCE_ORIGIN: std::time::Instant = std::time::Instant::now();
}

unsafe extern "C" fn performance_now(context: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    args.rval().set(DoubleValue(
        PERFORMANCE_ORIGIN.elapsed().as_secs_f64() * 1_000_000.0,
    ));

    true
}

fn report_js_error(cx: *mut JSContext, message: impl AsRef<str>) {
    let c = std::ffi::CString::new(message.as_ref()).unwrap();
    unsafe {
        JS_ReportErrorASCII(cx, c.as_ptr());
    }
}

macro_rules! fail_msg {
    ($cx:expr, $msg:expr) => {
        $crate::report_js_error($cx, $msg);
        return false;
    };
}

macro_rules! js_try {
    ($cx:expr, $expr:expr) => {
        match $expr {
            Ok(v) => v,
            Err(e) => {
                let msg = e.to_string();
                $crate::report_js_error($cx, msg);
                return false;
            }
        }
    };
}

fn raw_handle_to_string(
    cx: *mut JSContext,
    handle: mozjs::jsapi::JS::Handle<Value>,
) -> Result<String, anyhow::Error> {
    unsafe {
        let arg = mozjs::rust::Handle::from_raw(handle);
        if !arg.is_string() {
            anyhow::bail!("supplied argument is not a string");
        }
        let js = mozjs::rust::ToString(cx, arg);
        rooted!(in(cx) let message_root = js);

        let name = mozjs::conversions::jsstr_to_string(cx, message_root.get());
        // TODO: check if the if the returned string actually uses GC managed memory...
        // if not, the clone is redundant
        Ok(name.clone())
    }
}

unsafe extern "C" fn log(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    let strs = (0..args.argc_)
        .map(|i| raw_handle_to_string(cx, args.get(i)))
        .collect::<Result<Vec<_>, _>>();
    match strs {
        Ok(strs) => {
            println!("{}", strs.join(" "));
            true
        }
        Err(_) => false,
    }
}

unsafe extern "C" fn add_event_listener(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    if args.argc_ != 2 {
        fail_msg!(cx, "addEventListener() requires two arguments");
    }

    let name = js_try!(cx, raw_handle_to_string(cx, args.get(0)));

    // let arg = mozjs::rust::Handle::from_raw(args.get(0));
    // let js = mozjs::rust::ToString(cx, arg);

    let cb_raw = mozjs::rust::Handle::from_raw(args.get(1));
    let obj = cb_raw.to_object_or_null();
    if obj.is_null() || !JS_ObjectIsFunction(obj) {
        fail_msg!(
            cx,
            "second argument to addEventListener() must be a function"
        );
    }
    rooted!(in(cx) let cb = obj);

    args.rval().set(UndefinedValue());
    true
}
