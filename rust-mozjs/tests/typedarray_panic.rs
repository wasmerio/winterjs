/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::ptr;

use mozjs::jsapi::{JSAutoRealm, JSObject, JS_NewGlobalObject, OnNewGlobalHookOption};
use mozjs::rooted;
use mozjs::rust::{JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};
use mozjs::typedarray;
use mozjs::typedarray::{CreateWith, Uint32Array};

#[test]
#[should_panic]
fn typedarray_update_panic() {
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

        rooted!(in(context) let mut rval = ptr::null_mut::<JSObject>());
        let _ = Uint32Array::create(
            context,
            CreateWith::Slice(&[1, 2, 3, 4, 5]),
            rval.handle_mut(),
        );
        typedarray!(in(context) let mut array: Uint32Array = rval.get());
        array.as_mut().unwrap().update(&[0, 2, 4, 6, 8, 10]);
    }
}
