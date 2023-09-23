//! Convert errors from js to Rust.
//!
//! Mostly taken from github.com/servo/servo

use anyhow::bail;
// #[cfg(feature = "js_backtrace")]
// use backtrace::Backtrace;
// use js::error::{throw_range_error, throw_type_error};
#[cfg(feature = "js_backtrace")]
use js::jsapi::StackFormat as JSStackFormat;
use mozjs::jsapi::{
    ExceptionStackBehavior, JSContext, JS_ClearPendingException, JS_IsExceptionPending,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::wrappers::{
    JS_ErrorFromException, JS_GetPendingException, JS_SetPendingException,
};
use mozjs::rust::{HandleObject, HandleValue, MutableHandleValue};
// use libc::c_uint;

// use crate::script_runtime::JSContext as SafeJSContext;

#[derive(Debug)]
pub struct ErrorInfo {
    /// The error message.
    pub message: String,
    /// The file name.
    pub filename: String,
    /// The line number.
    pub lineno: u32,
    /// The column number.
    pub column: u32,
}

impl std::fmt::Display for ErrorInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}-{}:{}: {}",
            self.filename, self.lineno, self.column, self.message
        )
    }
}

impl std::error::Error for ErrorInfo {}

impl ErrorInfo {
    /// Retrieve the exception info if a context has a pending exception.
    pub fn check_context(cx: *mut JSContext) -> Result<(), anyhow::Error> {
        if unsafe { JS_IsExceptionPending(cx) } {
            let err = unsafe { Self::from_context(cx)? };
            Err(err.into())
        } else {
            Ok(())
        }
    }

    pub unsafe fn from_context(cx: *mut JSContext) -> Result<Self, anyhow::Error> {
        rooted!(in(cx) let mut value = UndefinedValue());
        if !JS_GetPendingException(cx, value.handle_mut()) {
            JS_ClearPendingException(cx);
            bail!("could not retrieve exception details");
        }

        JS_ClearPendingException(cx);
        let info = unsafe { ErrorInfo::from_value(value.handle(), cx)? };
        Ok(info)
    }

    unsafe fn from_native_error(
        object: HandleObject,
        cx: *mut JSContext,
    ) -> Result<ErrorInfo, anyhow::Error> {
        let report = JS_ErrorFromException(cx, object);
        if report.is_null() {
            bail!("error is not an exception");
        }

        let filename = {
            let filename = (*report)._base.filename as *const u8;
            if !filename.is_null() {
                let length = (0..).find(|idx| *filename.offset(*idx) == 0).unwrap();
                let filename = std::slice::from_raw_parts(filename, length as usize);
                String::from_utf8_lossy(filename).into_owned()
            } else {
                "none".to_string()
            }
        };

        let lineno = (*report)._base.lineno;
        let column = (*report)._base.column;

        let message = {
            let message = (*report)._base.message_.data_ as *const u8;
            let length = (0..).find(|idx| *message.offset(*idx) == 0).unwrap();
            let message = std::slice::from_raw_parts(message, length as usize);
            String::from_utf8_lossy(message).into_owned()
        };

        Ok(ErrorInfo {
            filename,
            message,
            lineno,
            column,
        })
    }

    unsafe fn from_object(
        object: HandleObject,
        cx: *mut JSContext,
    ) -> Result<ErrorInfo, anyhow::Error> {
        ErrorInfo::from_native_error(object, cx)
    }

    pub unsafe fn from_value(
        value: HandleValue,
        cx: *mut JSContext,
    ) -> Result<Self, anyhow::Error> {
        if value.is_object() {
            rooted!(in(cx) let object = value.to_object());
            return ErrorInfo::from_object(object.handle(), cx);
        }

        bail!("could not retrieve exception details");
    }
}
