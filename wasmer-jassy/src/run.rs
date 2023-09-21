use std::ffi::CStr;
use std::mem::MaybeUninit;
use std::ptr;
use std::str;

use anyhow::bail;
use mozjs::glue::EncodeStringToUTF8;
use mozjs::jsapi::{
    CallArgs, JSAutoRealm, JSContext, JS_DefineFunction, JS_IsExceptionPending, JS_NewGlobalObject,
    JS_ObjectIsFunction, JS_ReportErrorASCII, OnNewGlobalHookOption, Value,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};
use mozjs_sys::jsval::DoubleValue;
use mozjs_sys::jsval::JSVal;

/// Run Javascript code in a context with Winter CG APIs.
pub fn run_code(user_code: &str) -> Result<(), anyhow::Error> {
    let engine = JSEngine::init().unwrap();
    let runtime = Runtime::new(engine.handle());
    let cx = runtime.cx();
    let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
    let c_option = RealmOptions::default();

    unsafe {
        rooted!(in(cx) let global = JS_NewGlobalObject(
            cx,
            &SIMPLE_GLOBAL_CLASS,
            ptr::null_mut(),
            h_option,
            &*c_option,
        ));
        let _ac = JSAutoRealm::new(cx, global.get());

        // let function = JS_DefineFunction(
        //     cx,
        //     global.handle().into(),
        //     b"addEventListener\0".as_ptr() as *const i8,
        //     Some(add_event_listener),
        //     2,
        //     0,
        // );
        // assert!(!function.is_null());

        let function = JS_DefineFunction(
            cx,
            global.handle().into(),
            b"__native_performance_now\0".as_ptr() as *const i8,
            Some(performance_now),
            2,
            0,
        );
        assert!(!function.is_null());

        let function = JS_DefineFunction(
            cx,
            global.handle().into(),
            b"__native_log\0".as_ptr() as *const i8,
            Some(log),
            2,
            0,
        );
        assert!(!function.is_null());

        // Evaluate custom js setup code.
        {
            rooted!(in(cx) let mut rval = UndefinedValue());

            let res =
                runtime.evaluate_script(global.handle(), JS_SETUP, "test.js", 0, rval.handle_mut());
            if res.is_err() {
                return Err(read_runtime_exception(cx));
            }
        }

        rooted!(in(cx) let mut rval = UndefinedValue());

        let res =
            runtime.evaluate_script(global.handle(), user_code, "test.js", 0, rval.handle_mut());

        if res.is_ok() {
            Ok(())
        } else {
            crate::error::ErrorInfo::check_context(cx)?;
            bail!("unknown javascript error occurred");
        }
    }
}

fn read_runtime_exception(cx: *mut JSContext) -> anyhow::Error {
    if !unsafe { JS_IsExceptionPending(cx) } {
        return anyhow::anyhow!("no exception pending - unknown error occurred");
    }

    rooted!(in(cx) let mut rval = UndefinedValue());
    let ok = unsafe { mozjs::rust::wrappers::JS_GetPendingException(cx, rval.handle_mut()) };
    if !ok {
        return anyhow::anyhow!("could not retrieve exception details");
    }

    // JS::ExceptionStack exception(cx);
    // if (!JS::GetPendingExceptionStack(cx, &exception)) {
    //   fprintf(stderr,
    //           "Error: exception pending after %s, but got another error "
    //           "when trying to retrieve it. Aborting.\n",
    //           description);
    // } else {
    //   fprintf(stderr, "Exception while %s: ", description);
    //   dump_value(cx, exception.exception(), stderr);
    //   print_stack(cx, exception.stack(), stderr);
    // }

    // FIXME: implement reading exception details
    anyhow::anyhow!("unknown exception occured (reading not implemented yet)")
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

      // TODO: support multiple handlers
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

fn raw_handle_to_string(
    cx: *mut JSContext,
    handle: mozjs::jsapi::JS::Handle<Value>,
) -> Result<String, anyhow::Error> {
    unsafe {
        let arg = mozjs::rust::Handle::from_raw(handle);
        if !arg.is_string() {
            bail!("supplied argument is not a string");
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

// unsafe extern "C" fn add_event_listener(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
//     let args = CallArgs::from_vp(vp, argc);

//     if args.argc_ != 2 {
//         fail_msg!(cx, "addEventListener() requires two arguments");
//     }

//     let name = js_try!(cx, raw_handle_to_string(cx, args.get(0)));

//     // let arg = mozjs::rust::Handle::from_raw(args.get(0));
//     // let js = mozjs::rust::ToString(cx, arg);

//     let cb_raw = mozjs::rust::Handle::from_raw(args.get(1));
//     let obj = cb_raw.to_object_or_null();
//     if obj.is_null() || !JS_ObjectIsFunction(obj) {
//         fail_msg!(
//             cx,
//             "second argument to addEventListener() must be a function"
//         );
//     }
//     rooted!(in(cx) let cb = obj);

//     args.rval().set(UndefinedValue());
//     true
// }

#[cfg(test)]
mod tests {
    use crate::error::ErrorInfo;

    use super::*;

    #[test]
    fn test_exception_caught() {
        let code = r#"
            throw new Error("test error");
        "#;
        let err = run_code(code).unwrap_err();
        let _info = err.downcast_ref::<ErrorInfo>().unwrap();
    }
}
