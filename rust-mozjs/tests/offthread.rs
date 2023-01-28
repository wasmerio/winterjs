/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#[macro_use]
extern crate mozjs;

use std::os::raw::c_void;
use std::ptr;
use std::sync::mpsc::{channel, Sender};

use mozjs::jsapi::{
    JS_NewGlobalObject, OnNewGlobalHookOption, OffThreadToken, CanCompileOffThread,
    CompileToStencilOffThread1, InstantiateOptions, InstantiateGlobalStencil, JSAutoRealm,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rust::{
    JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS, CompileOptionsWrapper,
    transform_str_to_source_text, FinishOffThreadStencil, wrappers::JS_ExecuteScript
};

struct Token(*mut OffThreadToken);

unsafe impl Send for Token {}

struct Context {
    text: String,
    sender: Sender<Token>,
}

unsafe extern "C" fn callback(
    token: *mut OffThreadToken,
    callback_data: *mut c_void,
) {
    let context = Box::from_raw(callback_data as *mut Context);
    let token = Token(token);
    context.sender.send(token).unwrap();
}

#[test]
fn evaluate() {
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

        let src = "1 + 1".to_string();
        let mut options = CompileOptionsWrapper::new(context, "", 1);
        (*options.ptr)._base.forceAsync = true;
        let options_ptr = options.ptr as *const _;
        assert!(CanCompileOffThread(context, options_ptr, src.len()));
        let (sender, receiver) = channel();
        let script_context = Box::new(Context {
            text: src,
            sender,
        });
        assert!(!CompileToStencilOffThread1(
            context,
            options_ptr,
            &mut transform_str_to_source_text(&script_context.text) as *mut _,
            Some(callback),
            Box::into_raw(script_context) as *mut c_void,
        ).is_null());

        let token = receiver.recv().unwrap();
        let compiled_script = FinishOffThreadStencil(context, token.0, ptr::null_mut());
        assert!(!compiled_script.is_null());

        let _ac = JSAutoRealm::new(context, global.get());

        let options = InstantiateOptions {
            skipFilenameValidation: false,
            hideScriptFromDebugger: false,
            deferDebugMetadata: false,
        };
        rooted!(in(context) let script = InstantiateGlobalStencil(
            context,
            &options,
            *compiled_script,
            ptr::null_mut(),
        ));

        rooted!(in(context) let mut rval = UndefinedValue());
        let result = JS_ExecuteScript(context, script.handle(), rval.handle_mut());
        assert!(result);
        /*assert!(runtime
           .evaluate_script(global.handle(), "1 + 1", "test", 1, rval.handle_mut())
            .is_ok());*/
        assert_eq!(rval.get().to_int32(), 2);
    }
}
