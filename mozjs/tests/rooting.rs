/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#![cfg(feature = "debugmozjs")]

use std::ptr;

use mozjs::jsapi::JSPROP_ENUMERATE;
use mozjs::jsapi::{
    GetRealmObjectPrototype, JS_NewGlobalObject, JS_NewObjectWithGivenProto, JS_SetGCZeal,
};
use mozjs::jsapi::{
    JSAutoRealm, JSClass, JSContext, JSFunction, JSFunctionSpec, JSNativeWrapper, JSObject,
    JSPropertySpec_Name, JSString, OnNewGlobalHookOption, Value,
};
use mozjs::jsval::JSVal;
use mozjs::rooted;
use mozjs::rust::{define_methods, JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};

#[test]
fn rooting() {
    let engine = JSEngine::init().unwrap();
    let runtime = Runtime::new(engine.handle());
    let context = runtime.cx();
    let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
    let c_option = RealmOptions::default();

    unsafe {
        JS_SetGCZeal(context, 2, 1);
        rooted!(in(context) let global = JS_NewGlobalObject(
            context,
            &SIMPLE_GLOBAL_CLASS,
            ptr::null_mut(),
            h_option,
            &*c_option,
        ));
        let _ac = JSAutoRealm::new(context, global.get());

        rooted!(in(context) let prototype_proto = GetRealmObjectPrototype(context));
        rooted!(in(context) let proto = JS_NewObjectWithGivenProto(context, &CLASS as *const _, prototype_proto.handle().into()));
        define_methods(context, proto.handle(), METHODS).unwrap();

        rooted!(in(context) let root: JSVal);
        assert_eq!(root.get().is_undefined(), true);

        rooted!(in(context) let root: *mut JSObject);
        assert_eq!(root.get().is_null(), true);

        rooted!(in(context) let root: *mut JSString);
        assert_eq!(root.get().is_null(), true);

        rooted!(in(context) let root: *mut JSFunction);
        assert_eq!(root.get().is_null(), true);
    }
}

unsafe extern "C" fn generic_method(_: *mut JSContext, _: u32, _: *mut Value) -> bool {
    true
}

const METHODS: &'static [JSFunctionSpec] = &[
    JSFunctionSpec {
        name: JSPropertySpec_Name {
            string_: b"addEventListener\0" as *const u8 as *const libc::c_char,
        },
        call: JSNativeWrapper {
            op: Some(generic_method),
            info: 0 as *const _,
        },
        nargs: 2,
        flags: JSPROP_ENUMERATE as u16,
        selfHostedName: 0 as *const libc::c_char,
    },
    JSFunctionSpec {
        name: JSPropertySpec_Name {
            string_: b"removeEventListener\0" as *const u8 as *const libc::c_char,
        },
        call: JSNativeWrapper {
            op: Some(generic_method),
            info: 0 as *const _,
        },
        nargs: 2,
        flags: JSPROP_ENUMERATE as u16,
        selfHostedName: 0 as *const libc::c_char,
    },
    JSFunctionSpec {
        name: JSPropertySpec_Name {
            string_: b"dispatchEvent\0" as *const u8 as *const libc::c_char,
        },
        call: JSNativeWrapper {
            op: Some(generic_method),
            info: 0 as *const _,
        },
        nargs: 1,
        flags: JSPROP_ENUMERATE as u16,
        selfHostedName: 0 as *const libc::c_char,
    },
    JSFunctionSpec::ZERO,
];

static CLASS: JSClass = JSClass {
    name: b"EventTargetPrototype\0" as *const u8 as *const libc::c_char,
    flags: 0,
    cOps: 0 as *const _,
    spec: ptr::null(),
    ext: ptr::null(),
    oOps: ptr::null(),
};
