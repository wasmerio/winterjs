/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ffi::CStr;
use std::ptr;
use std::str;

use mozjs::glue::EncodeStringToUTF8;
use mozjs::jsapi::{CallArgs, JSAutoRealm, JSContext, OnNewGlobalHookOption, Value};
use mozjs::jsapi::{JS_DefineFunction, JS_NewGlobalObject, JS_ReportErrorASCII};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};

fn main() {
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

        let javascript = r#"

        addEventListener('fetch', () => {});

        "#;
        rooted!(in(context) let mut rval = UndefinedValue());
        assert!(runtime
            .evaluate_script(global.handle(), javascript, "test.js", 0, rval.handle_mut())
            .is_ok());
        eprintln!("done");
    }
}

unsafe extern "C" fn add_event_listener(context: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    if args.argc_ != 2 {
        JS_ReportErrorASCII(
            context,
            b"addEventListener() requires two arguments\0".as_ptr() as *const i8,
        );
        return false;
    }

    let arg = mozjs::rust::Handle::from_raw(args.get(0));
    let js = mozjs::rust::ToString(context, arg);
    rooted!(in(context) let message_root = js);

    let v = mozjs::conversions::jsstr_to_string(context, message_root.get());
    dbg!(&v);

    // EncodeStringToUTF8(context, message_root.handle().into(), |message| {
    //     let message = CStr::from_ptr(message);
    //     let message = str::from_utf8(message.to_bytes()).unwrap();
    //     assert_eq!(message, "Test Iñtërnâtiônàlizætiøn ┬─┬ノ( º _ ºノ) ");
    //     println!("{}", message);
    // });

    args.rval().set(UndefinedValue());
    true
}


