use std::cell::RefCell;
use std::ffi::CStr;
use std::ffi::CString;
use std::future::Future;
use std::mem::MaybeUninit;
use std::pin::Pin;
use std::ptr;
use std::str;
use std::str::FromStr;
use std::task::Poll;
use std::time::Duration;

use anyhow::anyhow;
use anyhow::{bail, Context as _};
use bytes::Bytes;
use futures::stream::FuturesUnordered;
use futures::{Stream, StreamExt};
use http::HeaderName;
use mozjs::conversions::ConversionBehavior;
use mozjs::conversions::ConversionResult;
use mozjs::conversions::FromJSValConvertible;
use mozjs::conversions::ToJSValConvertible;
use mozjs::gc::Handle;
use mozjs::glue::EncodeStringToUTF8;
use mozjs::jsapi::JSProtoKey;
use mozjs::jsapi::JS_GetClassObject;
use mozjs::jsapi::JS_GetClassPrototype;
use mozjs::jsapi::{
    CallArgs, HandleValueArray, HasJobsPending, IsPromiseObject, JSAutoRealm, JSContext, JSObject,
    JS_CallFunctionName, JS_CallFunctionValue, JS_DefineFunction, JS_IsExceptionPending,
    JS_NewGlobalObject, JS_NewObject, JS_NewPlainObject, JS_ObjectIsFunction, JS_ReportErrorASCII,
    JS_SetProperty, OnNewGlobalHookOption, PromiseState, RunJobs, Value,
};
use mozjs::jsval::NullValue;
use mozjs::jsval::{DoubleValue, JSVal};
use mozjs::jsval::{ObjectValue, UndefinedValue};
use mozjs::rooted;
use mozjs::rust::jsapi_wrapped::JS_GetProperty;
use mozjs::rust::wrappers::Construct1;
use mozjs::rust::HandleObject;
use mozjs::rust::HandleValue;
use mozjs::rust::JSEngineHandle;
use mozjs::rust::MutableHandleObject;
use mozjs::rust::MutableHandleValue;
use mozjs::rust::{IntoHandle, JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};
use mozjs::typedarray::Uint8Array;
use tokio::select;
use tokio::sync::mpsc::error::TryRecvError;
use tokio::time::sleep;
use tokio::time::Sleep;

use crate::error::ErrorInfo;
use crate::fetch::RequestData;
use crate::fetch::RequestIndex;

// pub struct JsEnv {
//     engine: JSEngine,
//     runtime: Runtime,
// }

// impl JsEnv {
//     pub fn new() -> Result<(), anyhow::Error> {
//         let engine = JSEngine::init().unwrap();
//         let runtime = Runtime::new(engine.handle());
//         let cx = runtime.cx();
//         let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
//         let c_option = RealmOptions::default();

//         let global = unsafe {
//             rooted!(in(cx) let global = JS_NewGlobalObject(
//                 cx,
//                 &SIMPLE_GLOBAL_CLASS,
//                 ptr::null_mut(),
//                 h_option,
//                 &*c_option,
//             ));
//             global
//         };

//         unsafe {
//             let _ac = JSAutoRealm::new(cx, global.get());

//             // let function = JS_DefineFunction(
//             //     cx,
//             //     global.handle().into(),
//             //     b"addEventListener\0".as_ptr() as *const i8,
//             //     Some(add_event_listener),
//             //     2,
//             //     0,
//             // );
//             // assert!(!function.is_null());

//             let function = JS_DefineFunction(
//                 cx,
//                 global.handle().into(),
//                 b"__native_performance_now\0".as_ptr() as *const i8,
//                 Some(performance_now),
//                 2,
//                 0,
//             );
//             assert!(!function.is_null());

//             let function = JS_DefineFunction(
//                 cx,
//                 global.handle().into(),
//                 b"__native_log\0".as_ptr() as *const i8,
//                 Some(log),
//                 2,
//                 0,
//             );
//             assert!(!function.is_null());

//             // Evaluate custom js setup code.
//             {
//                 rooted!(in(cx) let mut rval = UndefinedValue());

//                 let res = runtime.evaluate_script(
//                     global.handle(),
//                     JS_SETUP,
//                     "test.js",
//                     0,
//                     rval.handle_mut(),
//                 );
//                 if res.is_err() {
//                     return Err(read_runtime_exception(cx));
//                 }
//             }
//         }

//         Ok(Self { engine, runtime })
//     }

//     pub fn cx(&self) -> *mut JSContext {
//         self.runtime.cx()
//     }

//     pub fn run_code(&mut self, code: &str, filename: Option<&str>) -> Result<(), anyhow::Error> {
//         let filename = filename.unwrap_or("inline.js");

//         let cx = self.cx();

//         rooted!(in(cx) let mut rval = UndefinedValue());
//         let res =
//             self.runtime
//                 .evaluate_script(global.handle(), code, filename, 0, rval.handle_mut());

//         if res.is_ok() {
//             Ok(())
//         } else {
//             crate::error::ErrorInfo::check_context(cx)?;
//             bail!("unknown javascript error occurred");
//         }
//     }
// }

thread_local! {
    pub(super) static FUTURES: RefCell<
        Option<
            tokio::sync::mpsc::UnboundedSender<
                Pin<Box<dyn Future<Output = ()> + 'static>>
            >
        >
    > = RefCell::new(None);
}

fn setup(runtime: &mut Runtime, global: Handle<*mut JSObject>) -> Result<(), anyhow::Error> {
    let cx = runtime.cx();

    let function = unsafe {
        JS_DefineFunction(
            cx,
            global.into(),
            b"__native_performance_now\0".as_ptr() as *const i8,
            Some(performance_now),
            2,
            0,
        )
    };
    assert!(!function.is_null());

    let function = unsafe {
        JS_DefineFunction(
            cx,
            global.into(),
            b"__native_log\0".as_ptr() as *const i8,
            Some(log),
            2,
            0,
        )
    };
    assert!(!function.is_null());

    #[cfg(feature = "client-fetch")]
    {
        let function = unsafe {
            JS_DefineFunction(
                cx,
                global.into(),
                b"__native_fetch\0".as_ptr() as *const i8,
                Some(crate::client_fetch::fetch),
                2,
                0,
            )
        };
        assert!(!function.is_null());
    }

    // Evaluate custom js setup code.
    {
        rooted!(in(cx) let mut rval = UndefinedValue());

        let res = runtime.evaluate_script(global, JS_SETUP, "setup.js", 0, rval.handle_mut());
        if res.is_err() {
            ErrorInfo::check_context(cx)?;
            bail!("Unknown exception ocurred");
        }
    }

    Ok(())
}

pub static ENGINE: once_cell::sync::Lazy<JSEngineHandle> = once_cell::sync::Lazy::new(|| {
    let engine = JSEngine::init().expect("could not create engine");
    let handle = engine.handle();
    std::mem::forget(engine);
    handle
});

/// Run Javascript code in a context with Winter CG APIs.
pub fn run_code(user_code: &str) -> Result<(), anyhow::Error> {
    // let engine = JSEngine::init().unwrap();

    let mut runtime = Runtime::new(ENGINE.clone());
    let cx = runtime.cx();
    let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
    let c_option = RealmOptions::default();

    unsafe {
        rooted!(in(cx) let global = JS_NewGlobalObject(
            cx,
            &SIMPLE_GLOBAL_CLASS,
            ptr::null_mut(),
            h_option,
            &*c_option,
        ));

        let _ac = JSAutoRealm::new(cx, global.get());

        setup(&mut runtime, global.handle())?;

        rooted!(in(cx) let mut rval = UndefinedValue());

        let res =
            runtime.evaluate_script(global.handle(), user_code, "test.js", 0, rval.handle_mut());

        if res.is_ok() {
            Ok(())
        } else {
            ErrorInfo::check_context(cx)?;
            bail!("unknown javascript error occurred");
        }
    }
}

pub fn run_request(
    user_code: &str,
    req: http::request::Parts,
    body: Option<Bytes>,
) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
    let run_request_inner = async move {
        let mut runtime = Runtime::new(ENGINE.clone());
        let cx = runtime.cx();
        let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
        let c_option = RealmOptions::default();

        let (future_tx, mut future_rx) = tokio::sync::mpsc::unbounded_channel();
        FUTURES.with(|f| f.borrow_mut().replace(future_tx));
        let futures_guard = FuturesDropGuard;

        rooted!(in(cx) let global = unsafe { JS_NewGlobalObject(
            cx,
            &SIMPLE_GLOBAL_CLASS,
            ptr::null_mut(),
            h_option,
            &*c_option,
        )});

        let _ac = JSAutoRealm::new(cx, global.get());
        setup(&mut runtime, global.handle())?;

        rooted!(in(cx) let mut rval = UndefinedValue());

        let res =
            runtime.evaluate_script(global.handle(), user_code, "app.js", 0, rval.handle_mut());

        if !res.is_ok() {
            ErrorInfo::check_context(cx)?;
            bail!("unknown javascript error occurred");
        }

        rooted!(in(cx) let mut jsreq = unsafe { JS_NewPlainObject(cx) });
        build_request(cx, global.handle(), req, body, jsreq.handle_mut())?;
        rooted!(in(cx) let arg1 = ObjectValue(jsreq.get()));

        let slice = [arg1.get()];
        let args = unsafe { HandleValueArray::from_rooted_slice(&slice) };

        rooted!(in(cx) let mut rval = UndefinedValue());
        let ok = unsafe {
            JS_CallFunctionName(
                cx,
                global.handle().into(),
                b"__wasmer_callFetchHandler\0".as_ptr() as *const _,
                &args,
                rval.handle_mut().into(),
            )
        };
        if !ok {
            ErrorInfo::check_context(cx)?;
        }

        if !rval.handle().is_object() {
            bail!("invalid response data - expected an object");
        }
        rooted!(in(cx) let mut obj = rval.handle().to_object());

        let is_promise = unsafe { IsPromiseObject(obj.handle().into()) };
        if is_promise {
            let mut futures = Box::pin(FuturesUnordered::new());

            loop {
                if unsafe { !HasJobsPending(cx) } && futures.is_empty() {
                    break;
                }

                // TODO: is this fair?
                // First, run jobs as far as possible
                unsafe {
                    while HasJobsPending(cx) {
                        RunJobs(cx);
                        ErrorInfo::check_context(cx)?;
                    }
                }

                // Second, wait for new futures from native callbacks
                loop {
                    match future_rx.try_recv() {
                        Ok(f) => futures.push(f),
                        Err(TryRecvError::Disconnected) => bail!("Futures channel interrupted"),
                        Err(TryRecvError::Empty) => break,
                    }
                }

                // Last, run one of the existing futures
                if !futures.is_empty() {
                    futures.next().await;
                }
            }

            drop(futures_guard);

            let state = unsafe { mozjs::rust::wrappers::GetPromiseState(obj.handle().into()) };
            match state {
                PromiseState::Pending => {
                    bail!("No jobs remaining but promise is not resolved");
                }
                PromiseState::Fulfilled => {}
                PromiseState::Rejected => {
                    // TODO: read rejection reason
                    ErrorInfo::check_context(cx)?;

                    unsafe {
                        mozjs::glue::JS_GetPromiseResult(
                            obj.handle_mut().into(),
                            rval.handle_mut().into(),
                        )
                    };

                    if let Ok(err) = unsafe { ErrorInfo::from_value(rval.handle(), cx) } {
                        return Err(err).context("response promise failed");
                    }

                    // Not a valid exception, so just convert to string.
                    let res = unsafe {
                        String::from_jsval(cx, rval.handle(), ())
                            .map_err(|_| anyhow::anyhow!("could not convert returned response"))?
                    };

                    let msg = match res {
                        ConversionResult::Success(v) => v,
                        ConversionResult::Failure(_) => bail!("could not read promise error"),
                    };
                    bail!("promise failed: {msg}");
                }
            };

            unsafe {
                mozjs::glue::JS_GetPromiseResult(obj.handle_mut().into(), rval.handle_mut().into())
            };
        }

        if !rval.handle().is_object() {
            bail!("invalid response data - expected an object");
        }
        let res =
            response_from_obj(cx, rval.handle()).context("could not convert response object")?;

        Ok(res)
    };

    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;

    rt.block_on(run_request_inner)
}

fn response_from_obj(
    cx: *mut JSContext,
    value: HandleValue,
) -> Result<http::Response<hyper::Body>, anyhow::Error> {
    if !value.is_object() {
        bail!("response must be an object");
    }
    rooted!(in(cx) let obj = value.to_object());

    let obj = obj.handle();

    let status: u16 = get_property::<u16>(cx, obj, "status\0", ConversionBehavior::Default)
        .context("could not retrieve response status")?;

    // Headers.
    rooted!(in(cx) let mut headermap = UndefinedValue());
    get_property_raw(cx, obj, "headers\0", headermap.handle_mut())?;

    if !headermap.is_object() {
        bail!("headers must be an object");
    }
    rooted!(in(cx) let headermap_obj = headermap.to_object());

    rooted!(in(cx) let mut to_list = UndefinedValue());
    get_property_raw(cx, headermap_obj.handle(), "toList\0", to_list.handle_mut())
        .context("could not retrieve Headers.toList function")?;

    rooted!(in(cx) let mut headerlist = UndefinedValue());
    let args = HandleValueArray::new();
    let ok = unsafe {
        JS_CallFunctionValue(
            cx,
            headermap_obj.handle().into(),
            to_list.handle().into(),
            &args,
            headerlist.handle_mut().into(),
        )
    };
    if !ok {
        bail!("could not call Headers.toList()");
    }

    let headeritems = unsafe {
        let res = Vec::<Vec<String>>::from_jsval(cx, headerlist.handle(), ())
            .map_err(|_| anyhow::anyhow!("could not convert Headers.toList() return value"))?;
        match res {
            ConversionResult::Success(v) => v,
            ConversionResult::Failure(err) => {
                bail!("could not convert Headers.toList() return value: {err}");
            }
        }
    };

    let mut headers = http::HeaderMap::new();
    for item in headeritems {
        if item.len() != 2 {
            bail!("invalid header item - expected 2 items");
        }
        headers.append(
            http::HeaderName::from_str(&item[0])?,
            http::HeaderValue::from_str(&item[1])?,
        );
    }

    // Body.
    let body = if has_property(cx, obj, "body\0")? {
        rooted!(in(cx) let mut body = UndefinedValue());
        get_property_raw(cx, obj, "body\0", body.handle_mut())
            .context("could not retrieve body")?;

        if body.is_null_or_undefined() {
            hyper::Body::empty()
        } else if !body.is_object() {
            bail!("body must be an object");
        } else {
            rooted!(in(cx) let body = body.to_object());
            let body = Uint8Array::from(body.get())
                .map_err(|_| anyhow::anyhow!("body is not a Uint8Array"))?;
            unsafe { hyper::Body::from(body.as_slice().to_vec()) }
        }
    } else {
        hyper::Body::empty()
    };

    let mut res = hyper::Response::builder().status(status).body(body)?;
    *res.headers_mut() = headers;

    Ok(res)
}

fn build_request(
    cx: *mut JSContext,
    global: HandleObject<'_>,
    req: http::request::Parts,
    body: Option<Bytes>,
    out: MutableHandleObject,
) -> Result<(), anyhow::Error> {
    const CLS: &str = "Request\0";

    // Retrieve the constructor.
    rooted!(in(cx) let mut constructor_raw = UndefinedValue());
    let ok = unsafe {
        mozjs::jsapi::JS_GetProperty(
            cx,
            global.into(),
            CLS.as_ptr() as *const _,
            constructor_raw.handle_mut().into(),
        )
    };
    if !ok {
        ErrorInfo::check_context(cx)?;
        bail!("could not retrieve Request constructor - getProperty failed");
    }

    if !constructor_raw.is_object() {
        bail!("could not retrieve Request constructor - not an object");
    }
    rooted!(in(cx) let constructor = constructor_raw.to_object());

    // method
    rooted!(in(cx) let mut opts = unsafe { JS_NewPlainObject(cx) });
    set_property(cx, opts.handle(), "method\0", &req.method.to_string())?;

    // url
    set_property(cx, opts.handle(), "url\0", &req.uri.to_string())?;

    // headers
    if !req.headers.is_empty() {
        let items = http_headers_to_vec(req.headers)?;
        set_property(cx, opts.handle(), "headers\0", &items)?;
    }

    if let Some(body) = body {
        rooted!(in(cx) let mut req_body_array = unsafe { JS_NewPlainObject(cx) });
        unsafe {
            mozjs::typedarray::Uint8Array::create(
                cx,
                mozjs::typedarray::CreateWith::Slice(body.as_ref()),
                req_body_array.handle_mut(),
            )
            .map_err(|_| anyhow::anyhow!("could not construct Uint8Array"))?;
        }

        rooted!(in(cx) let req_body = mozjs::jsval::ObjectValue(req_body_array.get()));

        set_property(cx, opts.handle(), "body\0", &req_body.get())?;
    }

    rooted!(in(cx) let opts1 = ObjectValue(opts.get()));

    let slice = [opts1.get()];
    let args = unsafe { HandleValueArray::from_rooted_slice(&slice) };

    let ok = unsafe { Construct1(cx, constructor_raw.handle(), &args, out) };

    if !ok {
        bail!("could not call request constructor");
    }

    Ok(())
}

fn http_headers_to_vec(headers: http::HeaderMap) -> Result<Vec<Vec<String>>, anyhow::Error> {
    let mut items = Vec::new();
    let mut header: Option<HeaderName> = None;
    for (key, value) in headers {
        if let Some(key) = key {
            header = Some(key);
        }
        let key = header.as_ref().unwrap().to_string();

        match value.to_str() {
            Ok(v) => {
                match value.to_str() {
                    Ok(v) => {
                        items.push(vec![key, v.to_string()]);
                    }
                    Err(_) => {
                        // FIXME: implement non-utf8 header values
                        tracing::warn!("ignoring non-utf8 header value for header '{key}'");
                    }
                }
            }
            Err(_) => {
                // FIXME: support non-utf8 header values
                tracing::warn!("ignoring non-utf8 header value for header '{key}'");
            }
        }
    }

    Ok(items)
}

fn http_headers_to_object(
    cx: *mut JSContext,
    out: MutableHandleValue,
    headers: http::HeaderMap,
) -> Result<(), anyhow::Error> {
    let mut items = Vec::new();
    let mut header: Option<HeaderName> = None;
    for (key, value) in headers {
        if header.is_none() {
            header = key;
        }

        let key = header.as_ref().unwrap().to_string();
        match value.to_str() {
            Ok(v) => {
                match value.to_str() {
                    Ok(v) => {
                        items.push(vec![key, v.to_string()]);
                    }
                    Err(_) => {
                        // FIXME: implement non-utf8 header values
                        tracing::warn!("ignoring non-utf8 header value for header '{key}'");
                    }
                }
            }
            Err(_) => {
                // FIXME: support non-utf8 header values
                tracing::warn!("ignoring non-utf8 header value for header '{key}'");
            }
        }
    }

    unsafe {
        items.to_jsval(cx, out);
    }

    Ok(())
}

fn http_headers_from_object(
    cx: *mut JSContext,
    obj: HandleValue,
) -> Result<hyper::HeaderMap, anyhow::Error> {
    let mut map = http::HeaderMap::new();

    // headers are stored in the item key
    // FIXME: implement response header conversion.

    Ok(map)
}

// fn resolve_promise(cx: *mut JSContext, value: Handle<*mut JSValue>) -> Result<(), anyhow::Error> {
//     todo!()
// }

struct FuturesDropGuard;

impl Drop for FuturesDropGuard {
    fn drop(&mut self) {
        FUTURES.with(|f| {
            *f.borrow_mut() = None;
        })
    }
}

fn read_runtime_exception(cx: *mut JSContext) -> anyhow::Error {
    if !unsafe { JS_IsExceptionPending(cx) } {
        return anyhow::anyhow!("no exception pending - unknown error occurred");
    }

    rooted!(in(cx) let mut rval = UndefinedValue());
    let ok = unsafe { mozjs::rust::wrappers::JS_GetPendingException(cx, rval.handle_mut()) };
    if !ok {
        return anyhow::anyhow!("could not retrieve exception details");
    }

    // JS::ExceptionStack exception(cx);
    // if (!JS::GetPendingExceptionStack(cx, &exception)) {
    //   fprintf(stderr,
    //           "Error: exception pending after %s, but got another error "
    //           "when trying to retrieve it. Aborting.\n",
    //           description);
    // } else {
    //   fprintf(stderr, "Exception while %s: ", description);
    //   dump_value(cx, exception.exception(), stderr);
    //   print_stack(cx, exception.stack(), stderr);
    // }

    // FIXME: implement reading exception details
    anyhow::anyhow!("unknown exception occured (reading not implemented yet)")
}

const JS_SETUP: &str = include_str!("./setup.js");

lazy_static::lazy_static! {
    static ref PERFORMANCE_ORIGIN: std::time::Instant = std::time::Instant::now();
}

unsafe extern "C" fn performance_now(context: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    args.rval().set(DoubleValue(
        PERFORMANCE_ORIGIN.elapsed().as_secs_f64() * 1_000_000.0,
    ));

    true
}

pub(super) fn report_js_error(cx: *mut JSContext, message: impl AsRef<str>) {
    let c = std::ffi::CString::new(message.as_ref()).unwrap();
    unsafe {
        JS_ReportErrorASCII(cx, c.as_ptr());
    }
}

pub(super) fn check_raw_handle_is_function(
    handle: mozjs::jsapi::JS::Handle<Value>,
) -> Result<mozjs::jsapi::JS::Handle<Value>, anyhow::Error> {
    unsafe {
        if !handle.is_object() {
            bail!("supplied argument is not a function");
        }
        let obj = handle.to_object();
        if !JS_ObjectIsFunction(obj) {
            bail!("supplied argument is not a function");
        }

        Ok(handle)
    }
}

pub(super) fn raw_handle_to_string(
    cx: *mut JSContext,
    handle: mozjs::jsapi::JS::Handle<Value>,
) -> Result<String, anyhow::Error> {
    unsafe {
        let arg = mozjs::rust::Handle::from_raw(handle);
        if !arg.is_string() {
            bail!("supplied argument is not a string");
        }
        let js = mozjs::rust::ToString(cx, arg);
        rooted!(in(cx) let message_root = js);

        let name = mozjs::conversions::jsstr_to_string(cx, message_root.get());
        // TODO: check if the if the returned string actually uses GC managed memory...
        // if not, the clone is redundant
        Ok(name.clone())
    }
}

pub(super) fn raw_handle_to_object(
    handle: mozjs::jsapi::JS::Handle<Value>,
) -> Result<*mut JSObject, anyhow::Error> {
    unsafe {
        let arg = mozjs::rust::Handle::from_raw(handle);
        if !arg.is_object_or_null() {
            bail!("supplied argument is not an object");
        }
        Ok(arg.to_object_or_null())
    }
}

unsafe extern "C" fn log(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    let strs = (0..args.argc_)
        .map(|i| raw_handle_to_string(cx, args.get(i)))
        .collect::<Result<Vec<_>, _>>();
    match strs {
        Ok(strs) => {
            println!("{}", strs.join(" "));
            true
        }
        Err(_) => false,
    }
}

pub(super) fn all_keys(cx: *mut JSContext, obj: HandleValue<'_>) -> anyhow::Result<Vec<String>> {
    unsafe {
        rooted!(in(cx) let mut obj_class = JS_NewObject(cx, ptr::null()));
        if !JS_GetClassObject(
            cx,
            JSProtoKey::JSProto_Object,
            obj_class.handle_mut().into(),
        ) {
            bail!("Failed to get Object prototype");
        }

        rooted!(in(cx) let mut keys_func = UndefinedValue());
        get_property_raw(cx, obj_class.handle(), "keys", keys_func.handle_mut())?;

        let keys_func = check_raw_handle_is_function(keys_func.handle().into())?;

        let func_args = HandleValueArray::from_rooted_slice(&[*obj]);
        rooted!(in(cx) let thisval = NullValue().to_object_or_null());
        rooted!(in(cx) let mut rval = UndefinedValue());

        if !JS_CallFunctionValue(
            cx,
            thisval.handle().into(),
            keys_func,
            &func_args,
            rval.handle_mut().into(),
        ) {
            bail!("Failed to call Object.keys");
        }

        let result = Vec::<String>::from_jsval(cx, rval.handle(), ())
            .map_err(|_| anyhow!("Failed to convert keys to Vec<String>"))?;

        match result {
            ConversionResult::Success(v) => Ok(v),
            ConversionResult::Failure(_) => bail!("Failed to convert keys to Vec<String>"),
        }
    }
}

pub(super) fn has_property(
    cx: *mut JSContext,
    obj: HandleObject<'_>,
    key: &str,
) -> Result<bool, anyhow::Error> {
    let mut out = false;

    let ok = if key.ends_with('\0') {
        unsafe {
            mozjs::jsapi::JS_HasProperty(
                cx,
                obj.into(),
                key.as_ptr() as *const _,
                &mut out as *mut bool,
            )
        }
    } else {
        let name = CString::new(key).context("key contains nulls")?;
        unsafe {
            mozjs::jsapi::JS_HasProperty(
                cx,
                obj.into(),
                name.as_ptr() as *const _,
                &mut out as *mut bool,
            )
        }
    };

    if !ok {
        bail!("Failed to check if object has property '{key}' - not a valid object?");
    }

    Ok(out)
}

pub(super) fn get_property_raw(
    cx: *mut JSContext,
    obj: Handle<'_, *mut JSObject>,
    key: &str,
    out: MutableHandleValue<'_>,
) -> Result<(), anyhow::Error> {
    let ok = if key.ends_with('\0') {
        unsafe {
            mozjs::jsapi::JS_GetProperty(cx, obj.into(), key.as_ptr() as *const _, out.into())
        }
    } else {
        let name = std::ffi::CString::new(key)?;
        unsafe {
            mozjs::jsapi::JS_GetProperty(cx, obj.into(), name.as_ptr() as *const _, out.into())
        }
    };
    if !ok {
        bail!("failed to retrieve property '{key}' - property most likely does not exist");
    }

    Ok(())
}

pub(super) fn get_property<T>(
    cx: *mut JSContext,
    obj: Handle<'_, *mut JSObject>,
    key: &str,
    opts: T::Config,
) -> Result<T, anyhow::Error>
where
    T: mozjs::conversions::FromJSValConvertible,
{
    // JS_GetProperty(
    //     cx: *mut JSContext,
    //     obj: Handle<*mut JSObject>,
    //     name: *const i8,
    //     vp: MutableHandle<Value>
    // ) -> bool

    rooted!(in(cx) let mut out = UndefinedValue());

    let ok = if key.ends_with('\0') {
        unsafe {
            mozjs::rust::jsapi_wrapped::JS_GetProperty(
                cx,
                obj,
                key.as_ptr() as *const _,
                &mut out.handle_mut(),
            )
        }
    } else {
        let name = std::ffi::CString::new(key)?;
        unsafe {
            mozjs::rust::jsapi_wrapped::JS_GetProperty(
                cx,
                obj,
                name.as_ptr() as *const _,
                &mut out.handle_mut(),
            )
        }
    };
    if !ok {
        bail!("failed to retrieve property '{key}'");
    }

    let res = unsafe { T::from_jsval(cx, out.handle(), opts) };

    let res = res.map_err(|_| anyhow::anyhow!("could not convert property '{key}'"))?;
    let value = match res {
        ConversionResult::Success(v) => v,
        ConversionResult::Failure(err) => {
            bail!("could not convert property '{key}': {err}");
        }
    };

    Ok(value)
}

pub(super) fn set_property<T>(
    cx: *mut JSContext,
    obj: Handle<'_, *mut JSObject>,
    key: &str,
    value: &T,
) -> Result<(), anyhow::Error>
where
    T: mozjs::conversions::ToJSValConvertible,
{
    rooted!(in(cx) let mut rval = UndefinedValue());

    unsafe {
        mozjs::conversions::ToJSValConvertible::to_jsval(value, cx, rval.handle_mut());
    }

    let ok = if key.ends_with('\0') {
        unsafe {
            JS_SetProperty(
                cx,
                obj.clone().into_handle(),
                key.as_ptr() as *const _,
                rval.handle().into(),
            )
        }
    } else {
        let key = std::ffi::CString::new(key)?;
        unsafe {
            JS_SetProperty(
                cx,
                obj.clone().into_handle(),
                key.as_ptr() as *const _,
                rval.handle().into(),
            )
        }
    };
    if !ok {
        bail!("could not set key on property");
    }

    Ok(())
}

// fn http_request_to_object(
//     cx: *mut JSContext,
//     req: hyper::Request<hyper::Body>,
//     obj: Handle<'_, *mut JSObject>,
// ) -> Result<(), anyhow::Error> {
//     set_property(cx, obj, "method\0", req.method().as_str())?;
//     set_property(cx, obj, "url\0", &req.uri().to_string())?;

//     // pub unsafe extern "C" fn JS_SetProperty(
//     //     cx: *mut JSContext,
//     //     obj: Handle<*mut JSObject>,
//     //     name: *const i8,
//     //     v: Handle<Value>
//     // ) -> bool

//     Ok(())
// }

// unsafe extern "C" fn add_event_listener(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
//     let args = CallArgs::from_vp(vp, argc);

//     if args.argc_ != 2 {
//         fail_msg!(cx, "addEventListener() requires two arguments");
//     }

//     let name = js_try!(cx, raw_handle_to_string(cx, args.get(0)));

//     // let arg = mozjs::rust::Handle::from_raw(args.get(0));
//     // let js = mozjs::rust::ToString(cx, arg);

//     let cb_raw = mozjs::rust::Handle::from_raw(args.get(1));
//     let obj = cb_raw.to_object_or_null();
//     if obj.is_null() || !JS_ObjectIsFunction(obj) {
//         fail_msg!(
//             cx,
//             "second argument to addEventListener() must be a function"
//         );
//     }
//     rooted!(in(cx) let cb = obj);

//     args.rval().set(UndefinedValue());
//     true
// }

#[cfg(test)]
pub(super) mod tests {
    use hyper::{Body, Method};

    use crate::{error::ErrorInfo, fetch::ResponseData};

    use super::*;

    #[test]
    fn test_exception_caught() {
        let code = r#"
            throw new Error("test error");
        "#;
        let err = run_code(code).unwrap_err();
        let _info = err.downcast_ref::<ErrorInfo>().unwrap();
    }

    pub async fn run_request_blocking(
        user_code: &str,
        req: hyper::Request<Body>,
    ) -> Result<hyper::Response<Body>, anyhow::Error> {
        let code = user_code.to_string();
        let (parts, body) = req.into_parts();
        let body = hyper::body::to_bytes(body).await?;

        tokio::task::spawn_blocking(move || run_request(&code, parts, Some(body))).await?
    }

    #[tokio::test]
    async fn test_fetch_handler_basic_string_response() {
        let code = r#"
            addEventListener('fetch', (req) => {
              return "hello";
            });
        "#;
        let req = hyper::Request::new(Body::empty());
        let res = run_request_blocking(code, req).await.unwrap();

        assert_eq!(res.status().as_u16(), 200);
        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        assert_eq!(body, bytes::Bytes::from(b"hello".to_vec()));
    }

    #[tokio::test]
    async fn test_fetch_handler_basic_promise_string_response() {
        let code = r#"

            async function handle(req) {
              return "asyncfn";
            }

            addEventListener('fetch', handle);
        "#;

        let req = hyper::Request::new(Body::empty());

        let res = run_request_blocking(code, req).await.unwrap();
        assert_eq!(res.status().as_u16(), 200);

        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        assert_eq!(body, bytes::Bytes::from(b"asyncfn".to_vec()));
    }

    #[tokio::test]
    async fn test_fetch_handler_plain_object_response() {
        let code = r#"
            function handle(req) {
              return {
                status: 301,
                headers: {
                  'h1': ['v1'],
                },
                body: 'hello',
              };
            }

            addEventListener('fetch', handle);
        "#;

        let req = hyper::Request::new(Body::empty());

        let res = run_request_blocking(code, req).await.unwrap();
        assert_eq!(res.status().as_u16(), 301);
        assert_eq!(
            res.headers()
                .get("h1")
                .expect("missing 'h1' header")
                .to_str()
                .unwrap(),
            "v1"
        );

        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        assert_eq!(body, bytes::Bytes::from(b"hello".to_vec()));
    }

    #[tokio::test]
    async fn test_fetch_handler_response_class() {
        let code = r#"
            function handle(req) {
              return new Response('responseclass');
            }

            addEventListener('fetch', handle);
        "#;

        let req = http::Request::new(hyper::Body::empty());

        let res = run_request_blocking(code, req).await.unwrap();
        assert_eq!(res.status().as_u16(), 200);

        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        assert_eq!(body, bytes::Bytes::from(b"responseclass".to_vec()));
    }

    #[tokio::test]
    async fn test_fetch_handler_response_class_with_status_and_headers() {
        let code = r#"
            function handle(req) {
              return new Response('responseclass', {status: 333, headers: {'h1': 'v1'}});
            }

            addEventListener('fetch', handle);
        "#;

        let req = http::Request::new(Body::empty());

        let res = run_request_blocking(code, req).await.unwrap();
        assert_eq!(res.status().as_u16(), 333);

        assert_eq!(
            res.headers()
                .get("h1")
                .expect("missing 'h1' header")
                .to_str()
                .unwrap(),
            "v1"
        );

        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        assert_eq!(body, bytes::Bytes::from(b"responseclass".to_vec()));
    }

    #[tokio::test]
    async fn test_fetch_handler_echo() {
        let code = r#"
            async function handle(req) {
                console.log('handler called');

               if (!(req.headers instanceof Headers)) {
                 console.log('request.headers is not a Headers class');
                 throw new Error('request.headers is not a Headers class')
               }

                let headers = req.headers;
                headers.set('method', req.method);
                headers.set('url', req.url);

                console.log('out headers:' + JSON.stringify(headers.items));

                console.log('constructing response')

                const body = await req.text();
                console.log('body: ' + body);

                const res = new Response(body, {
                  headers,
                  status: 123,
                });
                console.log('response constructed');

                console.log('handler complete');
                return res;
            }
            addEventListener('fetch', handle);
        "#;

        let req = http::Request::builder()
            .method(Method::POST)
            .uri("https://test.com/lala?blub=123")
            .header("h1", "v1")
            .header("h2", "v2")
            .body(Body::from("input"))
            .unwrap();

        let res = run_request_blocking(code, req).await.unwrap();
        assert_eq!(res.status().as_u16(), 123);

        assert_eq!(
            res.headers()
                .get("url")
                .expect("missing 'h1' header")
                .to_str()
                .unwrap(),
            "https://test.com/lala?blub=123",
        );

        assert_eq!(
            res.headers()
                .get("h1")
                .expect("missing 'h1' header")
                .to_str()
                .unwrap(),
            "v1"
        );

        assert_eq!(
            res.headers()
                .get("h2")
                .expect("missing 'h2' header")
                .to_str()
                .unwrap(),
            "v2"
        );

        assert_eq!(
            res.headers()
                .get("method")
                .expect("missing 'method' header")
                .to_str()
                .unwrap(),
            "POST"
        );

        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        assert_eq!(body, bytes::Bytes::from(b"input".to_vec()));
    }

    #[tokio::test]
    async fn test_fetch_response_json() {
        let code = r#"
            async function handle(req) {
                const body = await req.json();
                return new Response(JSON.stringify(body), {
                  headers: {'content-type': 'application/json'},
                });
            }

            addEventListener('fetch', handle);
        "#;

        let data = serde_json::json!({
            "key": "value"
        });
        let body = serde_json::to_vec(&data).unwrap();

        let req = http::Request::builder().body(Body::from(body)).unwrap();

        let res = run_request_blocking(code, req).await.unwrap();

        let body = hyper::body::to_bytes(res.into_body()).await.unwrap();
        let data2: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(data2, data);
    }
}
