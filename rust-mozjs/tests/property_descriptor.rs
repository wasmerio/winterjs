/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#[macro_use]
extern crate mozjs;
extern crate mozjs_sys;

use std::ptr;

use mozjs::jsapi::{JS_NewGlobalObject, JS_NewPlainObject, FromPropertyDescriptor, JS_DefineProperty, JS_GetPropertyDescriptor};
use mozjs::jsapi::{JSPROP_ENUMERATE, JSPROP_READONLY, JSPROP_PERMANENT};
use mozjs::jsapi::{JSAutoRealm, OnNewGlobalHookOption, PropertyDescriptor};
use mozjs::jsval::{Int32Value, NullValue};
use mozjs::rust::{JSEngine, Runtime, RealmOptions, SIMPLE_GLOBAL_CLASS};
use mozjs_sys::jsapi::JS_GetProperty;

#[test]
fn property_descriptor() {
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

        rooted!(in(context) let object = JS_NewPlainObject(context));
        rooted!(in(context) let property = Int32Value(32));

        let attrs = (JSPROP_ENUMERATE | JSPROP_PERMANENT | JSPROP_READONLY) as u32;
        assert!(JS_DefineProperty(context, object.handle().into(), b"property\0" as *const u8 as *const libc::c_char, property.handle().into(), attrs));

        rooted!(in(context) let mut descriptor: PropertyDescriptor);

        rooted!(in(context) let mut holder = ptr::null_mut());
        assert!(JS_GetPropertyDescriptor(context, object.handle().into(), b"property\0" as *const u8 as *const libc::c_char, descriptor.handle_mut().into(), holder.handle_mut().into()));
        assert!(descriptor.get().enumerable_());
        assert!(!descriptor.get().configurable_());
        assert!(!descriptor.get().writable_());
        assert_eq!(descriptor.get().value_.to_int32(), 32);

        rooted!(in(context) let mut desc = NullValue());
        assert!(FromPropertyDescriptor(context, descriptor.handle().into(), desc.handle_mut().into()));
        rooted!(in(context) let desc_object = desc.to_object());

        rooted!(in(context) let mut rval = NullValue());
        assert!(JS_GetProperty(context, desc_object.handle().into(), b"value\0" as *const u8 as *const libc::c_char, rval.handle_mut().into()));
        assert_eq!(rval.get().to_int32(), 32);
        assert!(JS_GetProperty(context, desc_object.handle().into(), b"configurable\0" as *const u8 as *const libc::c_char, rval.handle_mut().into()));
        assert!(!rval.get().to_boolean());
        assert!(JS_GetProperty(context, desc_object.handle().into(), b"enumerable\0" as *const u8 as *const libc::c_char, rval.handle_mut().into()));
        assert!(rval.get().to_boolean());
        assert!(JS_GetProperty(context, desc_object.handle().into(), b"writable\0" as *const u8 as *const libc::c_char, rval.handle_mut().into()));
        assert!(!rval.get().to_boolean());
    }
}
