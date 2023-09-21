/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ptr;

use mozjs::jsapi::JSITER_OWNONLY;
use mozjs::jsapi::{
    GetPropertyKeys, JS_NewGlobalObject, JS_StringEqualsAscii, OnNewGlobalHookOption,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::{IdVector, JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};

#[test]
fn enumerate() {
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

        rooted!(in(context) let mut rval = UndefinedValue());
        assert!(runtime
            .evaluate_script(
                global.handle(),
                "({ 'a': 7 })",
                "test",
                1,
                rval.handle_mut()
            )
            .is_ok());
        assert!(rval.is_object());

        rooted!(in(context) let object = rval.to_object());
        let mut ids = IdVector::new(context);
        assert!(GetPropertyKeys(
            context,
            object.handle().into(),
            JSITER_OWNONLY,
            ids.handle_mut(),
        ));

        assert_eq!(ids.len(), 1);
        rooted!(in(context) let id = ids[0]);

        assert!(id.is_string());
        rooted!(in(context) let id = id.to_string());

        let mut matches = false;
        assert!(JS_StringEqualsAscii(
            context,
            id.get(),
            b"a\0" as *const _ as *const _,
            &mut matches
        ));
        assert!(matches);
    }
}
