use std::{cell::RefCell, os::raw::c_void};

use ion::{function_spec, Context, Function, Local, Object, Promise, Result, TracedHeap, Value};
use mozjs::{
    glue::{CreatePromiseLifecycleCallbacks, PromiseLifecycleTraps},
    jsapi::{Handle, SetPromiseLifecycleCallbacks},
};
use mozjs_sys::jsapi::{JSContext, JSFunction, JSFunctionSpec, JSObject};
use runtime::modules::NativeModule;

use crate::ion_mk_err;

thread_local! {
    static CALLBACKS_REGISTERED: RefCell<bool> = RefCell::new(false);
    static INIT: RefCell<Option<TracedHeap<*mut JSFunction>>> = RefCell::new(None);
    static BEFORE: RefCell<Option<TracedHeap<*mut JSFunction>>> = RefCell::new(None);
    static AFTER: RefCell<Option<TracedHeap<*mut JSFunction>>> = RefCell::new(None);
    static RESOLVE: RefCell<Option<TracedHeap<*mut JSFunction>>> = RefCell::new(None);
}

static TRAPS: PromiseLifecycleTraps = PromiseLifecycleTraps {
    onNewPromise: Some(on_new_promise),
    onBeforePromiseReaction: Some(on_before_promise_reaction),
    onAfterPromiseReaction: Some(on_after_promise_reaction),
    onPromiseSettled: Some(on_promise_settled),
};

#[js_fn]
fn get_promise_state(cx: &Context, promise: Object) -> Result<i32> {
    let promise = Promise::from(promise.into_local())
        .ok_or_else(|| ion_mk_err!("The given object is not a promise", Type))?;
    Ok(promise.state(cx) as i32)
}

#[js_fn]
fn set_promise_hooks(
    cx: &Context,
    init: Function,
    before: Function,
    after: Function,
    resolve: Function,
) {
    CALLBACKS_REGISTERED.with(|c| {
        if !*c.borrow() {
            unsafe {
                SetPromiseLifecycleCallbacks(
                    cx.as_ptr(),
                    CreatePromiseLifecycleCallbacks(&TRAPS, std::ptr::null()),
                )
            };
            *c.borrow_mut() = true;
        }
    });

    INIT.set(Some(TracedHeap::from_local(&init)));
    BEFORE.set(Some(TracedHeap::from_local(&before)));
    AFTER.set(Some(TracedHeap::from_local(&after)));
    RESOLVE.set(Some(TracedHeap::from_local(&resolve)));
}

fn call_handler(
    handler: &'static std::thread::LocalKey<RefCell<Option<TracedHeap<*mut JSFunction>>>>,
    cx: *mut JSContext,
    promise: Handle<*mut JSObject>,
) {
    let cx = unsafe { Context::new_unchecked(cx) };
    if let Some(f) = handler.with(|f| f.borrow().as_ref().map(|f| f.root(&cx))) {
        let promise = Value::object(&cx, &unsafe { Local::from_marked(promise.ptr) }.into());
        if let Err(e) = Function::from(f).call(&cx, &Object::null(&cx), &[promise]) {
            tracing::error!("Promise hook callback failed with {e:?}");
        }
    }
}

unsafe extern "C" fn on_new_promise(
    _: *const c_void,
    cx: *mut JSContext,
    promise: Handle<*mut JSObject>,
) {
    call_handler(&INIT, cx, promise);
}

unsafe extern "C" fn on_before_promise_reaction(
    _: *const c_void,
    cx: *mut JSContext,
    promise: Handle<*mut JSObject>,
) {
    call_handler(&BEFORE, cx, promise);
}

unsafe extern "C" fn on_after_promise_reaction(
    _: *const c_void,
    cx: *mut JSContext,
    promise: Handle<*mut JSObject>,
) {
    call_handler(&AFTER, cx, promise);
}

unsafe extern "C" fn on_promise_settled(
    _: *const c_void,
    cx: *mut JSContext,
    promise: Handle<*mut JSObject>,
) {
    call_handler(&RESOLVE, cx, promise);
}

const METHODS: &[JSFunctionSpec] = &[
    function_spec!(get_promise_state, "getPromiseState", 1),
    function_spec!(set_promise_hooks, "setPromiseHooks", 4),
    JSFunctionSpec::ZERO,
];

#[derive(Default)]
pub struct CoreModule;

impl NativeModule for CoreModule {
    const NAME: &'static str = "__winterjs_core_";

    const SOURCE: &'static str = include_str!("core.js");

    fn module(cx: &Context) -> Option<Object> {
        let mut ret = Object::new(cx);
        unsafe { ret.define_methods(cx, METHODS) }.then_some(ret)
    }
}
