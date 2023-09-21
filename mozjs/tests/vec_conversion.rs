/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ptr;

use mozjs::conversions::{
    ConversionBehavior, ConversionResult, FromJSValConvertible, ToJSValConvertible,
};
use mozjs::jsapi::{
    InitRealmStandardClasses, JSAutoRealm, JS_NewGlobalObject, OnNewGlobalHookOption,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};

#[test]
fn vec_conversion() {
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
        assert!(InitRealmStandardClasses(context));

        rooted!(in(context) let mut rval = UndefinedValue());

        let orig_vec: Vec<f32> = vec![1.0, 2.9, 3.0];
        orig_vec.to_jsval(context, rval.handle_mut());
        let converted = Vec::<f32>::from_jsval(context, rval.handle(), ()).unwrap();

        assert_eq!(&orig_vec, converted.get_success_value().unwrap());

        let orig_vec: Vec<i32> = vec![1, 2, 3];
        orig_vec.to_jsval(context, rval.handle_mut());
        let converted =
            Vec::<i32>::from_jsval(context, rval.handle(), ConversionBehavior::Default).unwrap();

        assert_eq!(&orig_vec, converted.get_success_value().unwrap());

        assert!(runtime
            .evaluate_script(
                global.handle(),
                "new Set([1, 2, 3])",
                "test",
                1,
                rval.handle_mut()
            )
            .is_ok());
        let converted =
            Vec::<i32>::from_jsval(context, rval.handle(), ConversionBehavior::Default).unwrap();

        assert_eq!(&orig_vec, converted.get_success_value().unwrap());

        assert!(runtime
            .evaluate_script(global.handle(), "({})", "test", 1, rval.handle_mut())
            .is_ok());
        let converted = Vec::<i32>::from_jsval(context, rval.handle(), ConversionBehavior::Default);
        assert!(match converted {
            Ok(ConversionResult::Failure(_)) => true,
            _ => false,
        });
    }
}
