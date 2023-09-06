/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ptr;

use mozjs::jsapi::{JSAutoRealm, JSObject, JS_NewGlobalObject, OnNewGlobalHookOption, Type};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};
use mozjs::typedarray;
use mozjs::typedarray::{CreateWith, Uint32Array};

#[test]
fn typedarray() {
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

        rooted!(in(context) let mut rval = UndefinedValue());
        assert!(runtime
            .evaluate_script(
                global.handle(),
                "new Uint8Array([0, 2, 4])",
                "test",
                1,
                rval.handle_mut()
            )
            .is_ok());
        assert!(rval.is_object());

        typedarray!(in(context) let array: Uint8Array = rval.to_object());
        assert_eq!(array.unwrap().as_slice(), &[0, 2, 4][..]);

        typedarray!(in(context) let array: Uint8Array = rval.to_object());
        assert_eq!(array.unwrap().len(), 3);

        typedarray!(in(context) let array: Uint8Array = rval.to_object());
        assert_eq!(array.unwrap().to_vec(), vec![0, 2, 4]);

        typedarray!(in(context) let array: Uint16Array = rval.to_object());
        assert!(array.is_err());

        typedarray!(in(context) let view: ArrayBufferView = rval.to_object());
        assert_eq!(view.unwrap().get_array_type(), Type::Uint8);

        rooted!(in(context) let mut rval = ptr::null_mut::<JSObject>());
        assert!(
            Uint32Array::create(context, CreateWith::Slice(&[1, 3, 5]), rval.handle_mut()).is_ok()
        );

        typedarray!(in(context) let array: Uint32Array = rval.get());
        assert_eq!(array.unwrap().as_slice(), &[1, 3, 5][..]);

        typedarray!(in(context) let mut array: Uint32Array = rval.get());
        array.as_mut().unwrap().update(&[2, 4, 6]);
        assert_eq!(array.unwrap().as_slice(), &[2, 4, 6][..]);

        rooted!(in(context) let rval = ptr::null_mut::<JSObject>());
        typedarray!(in(context) let array: Uint8Array = rval.get());
        assert!(array.is_err());

        rooted!(in(context) let mut rval = ptr::null_mut::<JSObject>());
        assert!(Uint32Array::create(context, CreateWith::Length(5), rval.handle_mut()).is_ok());

        typedarray!(in(context) let array: Uint32Array = rval.get());
        assert_eq!(array.unwrap().as_slice(), &[0, 0, 0, 0, 0]);

        typedarray!(in(context) let mut array: Uint32Array = rval.get());
        array.as_mut().unwrap().update(&[0, 1, 2, 3]);
        assert_eq!(array.unwrap().as_slice(), &[0, 1, 2, 3, 0]);

        typedarray!(in(context) let view: ArrayBufferView = rval.get());
        assert_eq!(view.unwrap().get_array_type(), Type::Uint32);

        typedarray!(in(context) let view: ArrayBufferView = rval.get());
        assert_eq!(view.unwrap().is_shared(), false);
    }
}
