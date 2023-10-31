use std::cell::RefCell;

use ion::{function_spec, Context, ErrorReport, Function, Object, Value};
use mozjs::jsapi::Heap;
use mozjs_sys::jsapi::{JSFunction, JSFunctionSpec};

thread_local! {
    static EVENT_CALLBACK: RefCell<Option<Box<Heap<*mut JSFunction>>>> = RefCell::new(None);
}

#[js_fn]
fn add_event_listener<'cx: 'f, 'f>(event: String, callback: Function<'f>) -> ion::Result<()> {
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

pub fn define<'cx: 'o, 'o>(cx: &'cx Context, global: &mut Object<'o>) -> bool {
    unsafe { global.define_methods(cx, METHODS) }
}
