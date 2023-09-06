/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ptr;

use mozjs::jsapi::{JSAutoRealm, JSContext, OnNewGlobalHookOption, Value};
use mozjs::jsapi::{JS_DefineFunction, JS_NewGlobalObject};
use mozjs::jsval::UndefinedValue;
use mozjs::panic::wrap_panic;
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};

#[test]
#[should_panic]
fn test_panic() {
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
            b"test\0".as_ptr() as *const _,
            Some(test),
            0,
            0,
        );
        assert!(!function.is_null());

        rooted!(in(context) let mut rval = UndefinedValue());
        let _ =
            runtime.evaluate_script(global.handle(), "test();", "test.js", 0, rval.handle_mut());
    }
}

unsafe extern "C" fn test(_cx: *mut JSContext, _argc: u32, _vp: *mut Value) -> bool {
    let mut result = false;
    wrap_panic(&mut || {
        panic!();
        #[allow(unreachable_code)]
        {
            result = true
        }
    });
    result
}
