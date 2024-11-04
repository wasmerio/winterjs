use std::cell::RefCell;

use ion::{function_spec, Context, ErrorReport, Function, Object, PermanentHeap, Value};
use mozjs_sys::jsapi::{JSFunction, JSFunctionSpec};

// TODO: move this to builtins, support event types from deno

thread_local! {
    static EVENT_CALLBACK: RefCell<Option<PermanentHeap<*mut JSFunction>>> = const { RefCell::new(None) };
}

#[js_fn]
fn add_event_listener<'cx: 'f, 'f>(event: String, callback: Function<'f>) -> ion::Result<()> {
    if event != "fetch" {
        return Ok(());
    }

    EVENT_CALLBACK.with(|cb| {
        let mut cb = cb.borrow_mut();
        if cb.is_none() {
            *cb = Some(PermanentHeap::from_local(&callback));
            Ok(())
        } else {
            Err(ion::Error::new(
                "`fetch` event listener can only be registered once",
                ion::ErrorKind::Normal,
            ))
        }
    })
}

pub fn invoke_fetch_event_callback<'cx>(
    cx: &'cx Context,
    args: &[Value],
) -> Result<Value<'cx>, Option<ErrorReport>> {
    let cb = EVENT_CALLBACK.with(|cb| {
        let cb = cb.borrow();
        if cb.is_none() {
            Err(None)
        } else {
            Ok(Function::from(cb.as_ref().unwrap().root(cx)))
        }
    })?;
    cb.call(cx, &Object::global(cx), args)
}

static METHODS: &[JSFunctionSpec] = &[
    function_spec!(add_event_listener, "addEventListener", 2),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, global: &Object) -> bool {
    unsafe { global.define_methods(cx, METHODS) }
}
