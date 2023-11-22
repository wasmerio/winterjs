use std::cell::RefCell;

use ion::{function_spec, Context, ErrorReport, Function, Object, Value};
use libc::c_void;
use mozjs::{jsapi::Heap, rust::Trace};
use mozjs_sys::jsapi::{JSFunction, JSFunctionSpec, JSTracer};

thread_local! {
    static EVENT_CALLBACK: RefCell<Option<Box<Heap<*mut JSFunction>>>> = RefCell::new(None);
}

#[js_fn]
fn add_event_listener<'cx: 'f, 'f>(
    cx: &'cx Context,
    event: String,
    callback: Function<'f>,
) -> ion::Result<()> {
    if event != "fetch" {
        return Err(ion::Error::new(
            "Only the `fetch` event is supported",
            ion::ErrorKind::Normal,
        ));
    }

    EVENT_CALLBACK.with(|cb| {
        let mut cb = cb.borrow_mut();
        if cb.is_none() {
            *cb = Some(Heap::boxed(callback.get()));
            unsafe {
                mozjs::jsapi::JS_AddExtraGCRootsTracer(
                    cx.as_ptr(),
                    Some(trace),
                    std::ptr::null_mut(),
                )
            };
            Ok(())
        } else {
            Err(ion::Error::new(
                "`fetch` event listener can only be registered once",
                ion::ErrorKind::Normal,
            ))
        }
    })?;

    Ok(())
}

// Note: Heap<T> needs to be traced manually. This callback lives as long
// as the worker thread is alive, so PersistentRooted would have been a
// better choice, but that doesn't work from rust AFAIK.
unsafe extern "C" fn trace(trc: *mut JSTracer, _data: *mut c_void) {
    EVENT_CALLBACK.with(|cb| {
        let cb = cb.borrow();
        if let Some(f) = cb.as_ref() {
            f.trace(trc);
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
            Ok(cb.as_ref().unwrap().get())
        }
    })?;
    Function::from(cx.root_function(cb)).call(cx, &Object::global(cx), args)
}

static METHODS: &[JSFunctionSpec] = &[
    function_spec!(add_event_listener, "addEventListener", 2),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, global: &mut Object) -> bool {
    unsafe { global.define_methods(cx, METHODS) }
}
