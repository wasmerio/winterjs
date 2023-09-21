/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use mozjs_sys::jsapi::glue::DeleteOwningCompileOptions;
use mozjs_sys::jsapi::glue::JS_Init;
use mozjs_sys::jsapi::glue::JS_NewOwningCompileOptions;
use mozjs_sys::jsapi::glue::JS_NewRealmOptions;
use mozjs_sys::jsapi::JSClass;
use mozjs_sys::jsapi::JSClassOps;
use mozjs_sys::jsapi::JSContext;
use mozjs_sys::jsapi::JS_DestroyContext;
use mozjs_sys::jsapi::JS_GlobalObjectTraceHook;
use mozjs_sys::jsapi::JS_NewContext;
use mozjs_sys::jsapi::JS_NewGlobalObject;
use mozjs_sys::jsapi::JS_ShutDown;
use mozjs_sys::jsapi::JS;
use mozjs_sys::jsapi::JS::OnNewGlobalHookOption::FireOnNewGlobalHook;
use mozjs_sys::jsapi::JSCLASS_GLOBAL_FLAGS;

use core::ffi::c_char;
use std::mem;
use std::ptr;

// The class operations for the global object.
static GLOBAL_CLASS_OPS: JSClassOps = JSClassOps {
    addProperty: None,
    delProperty: None,
    enumerate: None,
    newEnumerate: None,
    resolve: None,
    mayResolve: None,
    finalize: None,
    call: None,
    construct: None,
    trace: Some(JS_GlobalObjectTraceHook),
};

// The class of the global object.
static GLOBAL_CLASS: JSClass = JSClass {
    name: "global\0" as *const str as *const c_char,
    flags: JSCLASS_GLOBAL_FLAGS,
    cOps: &GLOBAL_CLASS_OPS,
    spec: ptr::null(),
    ext: ptr::null(),
    oOps: ptr::null(),
};

#[test]
fn main() {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/JSAPI_User_Guide
    unsafe {
        // Initialize the JS engine.
        assert!(JS_Init());

        // Create a JS context.
        let heap_size = 64 * 1024 * 1024;
        let nursery_size = 8 * 1024 * 1024;
        let cx: *mut JSContext = JS_NewContext(heap_size + nursery_size, ptr::null_mut());
        assert!(!cx.is_null());
        assert!(JS::InitSelfHostedCode(cx, Default::default(), None));

        // Create the global object and a new compartment.
        // THIS IS DANGEROUS since the global isn't rooted.
        let options = JS_NewRealmOptions();
        let global = JS_NewGlobalObject(
            cx,
            &GLOBAL_CLASS,
            ptr::null_mut(),
            FireOnNewGlobalHook,
            options,
        );
        let realm = JS::EnterRealm(cx, global);

        let options = JS_NewOwningCompileOptions(cx);
        let mut rval: JS::Value = mem::zeroed();
        let mut rval_handle: JS::MutableHandleValue = mem::zeroed();
        rval_handle.ptr = &mut rval;

        // Evaluate 1+1.
        let script = "1+1".as_bytes();
        let mut source = JS::SourceText {
            units_: script.as_ptr() as *const _,
            length_: script.len() as u32,
            ownsUnits_: false,
            _phantom_0: std::marker::PhantomData,
        };
        assert!(JS::Evaluate2(
            cx,
            &(*options)._base,
            &mut source,
            rval_handle
        ));
        assert!(rval.to_int32() == 2);

        DeleteOwningCompileOptions(options);

        // Shut everything down.
        JS::LeaveRealm(cx, realm);
        JS_DestroyContext(cx);
        JS_ShutDown();
    }
}
