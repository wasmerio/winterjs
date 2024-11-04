use std::{cell::RefCell, os::raw::c_void};

use ion::{
    conversions::ToValue, function_spec, Context, Function, Local, Object, PermanentHeap, Promise,
    Result, Value,
};
use mozjs::{
    glue::{CreatePromiseLifecycleCallbacks, PromiseLifecycleTraps},
    jsapi::{Handle, PromiseState, SetPromiseLifecycleCallbacks},
    jsval::JSVal,
};
use mozjs_sys::jsapi::{JSContext, JSFunction, JSFunctionSpec, JSObject};

use crate::ion_mk_err;

thread_local! {
    static CALLBACKS_REGISTERED: RefCell<bool> = const { RefCell::new(false) };
    static INIT: RefCell<Option<PermanentHeap<*mut JSFunction>>> = const { RefCell::new(None) };
    static BEFORE: RefCell<Option<PermanentHeap<*mut JSFunction>>> = const { RefCell::new(None) };
    static AFTER: RefCell<Option<PermanentHeap<*mut JSFunction>>> = const { RefCell::new(None) };
    static RESOLVE: RefCell<Option<PermanentHeap<*mut JSFunction>>> = const { RefCell::new(None) };
}

static TRAPS: PromiseLifecycleTraps = PromiseLifecycleTraps {
    onNewPromise: Some(on_new_promise),
    onBeforePromiseReaction: Some(on_before_promise_reaction),
    onAfterPromiseReaction: Some(on_after_promise_reaction),
    onPromiseSettled: Some(on_promise_settled),
};

#[js_fn]
fn get_promise_details(cx: &Context, promise: Object) -> Result<Vec<JSVal>> {
    let promise = Promise::from(promise.into_local())
        .ok_or_else(|| ion_mk_err!("The given object is not a promise", Type))?;

    let state = promise.state(cx);
    let result = match state {
        PromiseState::Pending => Value::undefined(cx),
        _ => promise.result(cx),
    };
    Ok(vec![(state as i32).as_value(cx).get(), result.get()])
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

    INIT.set(Some(PermanentHeap::from_local(&init)));
    BEFORE.set(Some(PermanentHeap::from_local(&before)));
    AFTER.set(Some(PermanentHeap::from_local(&after)));
    RESOLVE.set(Some(PermanentHeap::from_local(&resolve)));
}

fn call_handler(
    handler: &'static std::thread::LocalKey<RefCell<Option<PermanentHeap<*mut JSFunction>>>>,
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

    #[cfg(feature = "instrument")]
    {
        let cx = unsafe { Context::new_unchecked(cx) };
        let promise = Promise::from(unsafe { Local::from_marked(promise.ptr) }).unwrap();

        match promise.state(&cx) {
            PromiseState::Rejected => {
                tracing::debug!(
                    target: "winterjs::promises",
                    ?promise,
                    result = %ion::format::format_value(
                        &cx,
                        ion::format::Config::default(),
                        &promise.result(&cx)
                    ),
                    "Promise rejected",
                );
            }
            PromiseState::Fulfilled => {
                tracing::debug!(
                    target: "winterjs::promises",
                    ?promise,
                    result = %ion::format::format_value(
                        &cx,
                        ion::format::Config::default(),
                        &promise.result(&cx)
                    ),
                    "Promise resolved"
                );
            }
            _ => (),
        }
    }
}

const METHODS: &[JSFunctionSpec] = &[
    function_spec!(get_promise_details, "getPromiseDetails", 1),
    function_spec!(set_promise_hooks, "setPromiseHooks", 4),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, deno_core: &Object) -> bool {
    unsafe { deno_core.define_methods(cx, METHODS) }
}
