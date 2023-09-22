use std::collections::HashMap;
use std::ffi::CStr;
use std::mem::MaybeUninit;
use std::ptr;
use std::str;

use anyhow::{bail, Context as _};
use mozjs::conversions::ConversionResult;
use mozjs::conversions::FromJSValConvertible;
use mozjs::gc::Handle;
use mozjs::glue::EncodeStringToUTF8;
use mozjs::jsapi::{
    CallArgs, HandleValueArray, HasJobsPending, IsPromiseObject, JSAutoRealm, JSContext, JSObject,
    JS_CallFunctionName, JS_DefineFunction, JS_IsExceptionPending, JS_NewGlobalObject,
    JS_NewObject, JS_NewPlainObject, JS_ObjectIsFunction, JS_ReportErrorASCII, JS_SetProperty,
    OnNewGlobalHookOption, PromiseState, RunJobs, Value,
};
use mozjs::jsval::UndefinedValue;
use mozjs::rooted;
use mozjs::rust::JSEngineHandle;
use mozjs::rust::{IntoHandle, JSEngine, RealmOptions, Runtime, SIMPLE_GLOBAL_CLASS};
use mozjs_sys::jsval::{DoubleValue, JSVal};

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
    req: RequestData,
) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
    let mut runtime = Runtime::new(ENGINE.clone());
    let cx = runtime.cx();
    let h_option = OnNewGlobalHookOption::FireOnNewGlobalHook;
    let c_option = RealmOptions::default();

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

    let res = runtime.evaluate_script(global.handle(), user_code, "test.js", 0, rval.handle_mut());

    if !res.is_ok() {
        ErrorInfo::check_context(cx)?;
        bail!("unknown javascript error occurred");
    }

    let json = serde_json::to_string(&req)?;

    rooted!(in(cx) let mut inval = UndefinedValue());
    unsafe {
        mozjs::conversions::ToJSValConvertible::to_jsval(&json, cx, inval.handle_mut());
    }

    let slice = [inval.get()];
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
    ErrorInfo::check_context(cx)?;
    if !ok {
        bail!("unknown error occurred in request handler");
    }

    if !rval.handle().is_string() {
        if !rval.handle().is_object() {
            bail!("invalid response data - expected a string or object");
        }
        rooted!(in(cx) let mut obj = rval.handle().to_object());

        dbg!("checking for promise");
        let is_promise = unsafe { IsPromiseObject(obj.handle().into()) };
        if !is_promise {
            bail!("invalid response data");
        };

        dbg!("looping for promise");
        loop {
            let state = unsafe { mozjs::rust::wrappers::GetPromiseState(obj.handle().into()) };
            match state {
                PromiseState::Pending => {
                    unsafe { RunJobs(cx) };
                    ErrorInfo::check_context(cx)?;
                }
                PromiseState::Fulfilled => {
                    break;
                }
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
                        ConversionResult::Failure(v) => bail!("could not read promise error"),
                    };
                    bail!("promise failed: {msg}");
                }
            };
        }

        unsafe {
            mozjs::glue::JS_GetPromiseResult(obj.handle_mut().into(), rval.handle_mut().into())
        };
    }

    if !rval.handle().is_string() {
        bail!("invalid response data - expected a string");
    }

    let res = unsafe {
        String::from_jsval(cx, rval.handle(), ())
            .map_err(|_| anyhow::anyhow!("could not convert returned response"))?
    };
    let raw = match res {
        ConversionResult::Success(v) => v,
        ConversionResult::Failure(msg) => bail!("invalid response value:  {msg}"),
    };

    let resdata: crate::fetch::ResponseData =
        serde_json::from_str(&raw).context("could not deserialize response")?;

    let out = resdata.to_hyper()?;
    Ok(out)
}

// fn resolve_promise(cx: *mut JSContext, value: Handle<*mut JSValue>) -> Result<(), anyhow::Error> {
//     todo!()
// }

/// Run the Javascript promise job queue.
fn run_jobs(cx: *mut JSContext) -> Result<(), anyhow::Error> {
    while unsafe { HasJobsPending(cx) } {
        unsafe { RunJobs(cx) };
        ErrorInfo::check_context(cx)?;
    }
    Ok(())
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

fn report_js_error(cx: *mut JSContext, message: impl AsRef<str>) {
    let c = std::ffi::CString::new(message.as_ref()).unwrap();
    unsafe {
        JS_ReportErrorASCII(cx, c.as_ptr());
    }
}

fn raw_handle_to_string(
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

fn set_property<T>(
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
mod tests {
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

    #[tokio::test]
    async fn test_fetch_handler_basic_string_response() {
        let code = r#"
            addEventListener('fetch', (req) => {
              return "hello";
            });
        "#;

        let req = RequestData {
            index: RequestIndex(0),
            method: "GET".to_string(),
            url: "https://test.com".to_string(),
            headers: vec![("test".to_string(), vec!["test".to_string()])]
                .into_iter()
                .collect(),
            body: b"hello".to_vec().into(),
        };

        let res = run_request(code, req).unwrap();

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

        let req = RequestData {
            index: RequestIndex(0),
            method: "GET".to_string(),
            url: "https://test.com".to_string(),
            headers: vec![("test".to_string(), vec!["test".to_string()])]
                .into_iter()
                .collect(),
            body: b"hello".to_vec().into(),
        };

        let res = run_request(code, req).unwrap();
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

        let req = RequestData {
            index: RequestIndex(0),
            method: "GET".to_string(),
            url: "https://test.com".to_string(),
            headers: vec![("test".to_string(), vec!["test".to_string()])]
                .into_iter()
                .collect(),
            body: b"hello".to_vec().into(),
        };

        let res = run_request(code, req).unwrap();
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

        let req = RequestData {
            index: RequestIndex(0),
            method: "GET".to_string(),
            url: "https://test.com".to_string(),
            headers: vec![("test".to_string(), vec!["test".to_string()])]
                .into_iter()
                .collect(),
            body: b"hello".to_vec().into(),
        };

        let res = run_request(code, req).unwrap();
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

        let req = RequestData {
            index: RequestIndex(0),
            method: "GET".to_string(),
            url: "https://test.com".to_string(),
            headers: vec![("test".to_string(), vec!["test".to_string()])]
                .into_iter()
                .collect(),
            body: b"hello".to_vec().into(),
        };

        let res = run_request(code, req).unwrap();
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
                console.log('body: ' + req.body);
                const res = new Response(req.body, {
                  headers,
                  status: 123,
                });
                console.log('response constructed');

                console.log('handler complete');
                return res;
            }
            addEventListener('fetch', handle);
        "#;

        let req = RequestData {
            index: RequestIndex(0),
            method: "POST".to_string(),
            url: "https://test.com/lala?blub=123".to_string(),
            headers: vec![
                ("h1".to_string(), vec!["v1".to_string()]),
                ("h2".to_string(), vec!["v2".to_string()]),
            ]
            .into_iter()
            .collect(),
            body: b"input".to_vec().into(),
        };

        let res = run_request(code, req).unwrap();
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
}
