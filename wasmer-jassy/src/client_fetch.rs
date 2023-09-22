use crate::run::*;
use mozjs::conversions::ToJSValConvertible;
use mozjs::jsapi::{CallArgs, Value};
use mozjs::rooted;
use mozjs_sys::jsapi::JSContext;
use mozjs_sys::jsval::UndefinedValue;

pub(super) unsafe extern "C" fn fetch(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    if args.argc_ < 1 {
        return false;
    }

    let Ok(url) = raw_handle_to_string(cx, args.get(0)) else {
        return false;
    };

    let Ok(result) = reqwest::blocking::get(url) else {
        return false;
    };

    let Ok(text) = result.text() else {
        return false;
    };

    rooted!(in(cx) let mut rval = UndefinedValue());

    text.to_jsval(cx, rval.handle_mut());

    args.rval().set(*rval);

    true
}
