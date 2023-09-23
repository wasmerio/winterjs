use crate::run::*;
use anyhow::Context;
use mozjs::conversions::ToJSValConvertible;
use mozjs::jsval::{NullValue, UndefinedValue};
use mozjs::rooted;

use mozjs::jsapi::{CallArgs, HandleValueArray, JSContext, JS_CallFunctionValue, Value};

pub(super) unsafe extern "C" fn fetch(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    if args.argc_ < 3 {
        return false;
    }

    let Ok(resolve) = check_raw_handle_is_function(args.get(0)) else {
        return false;
    };

    let Ok(reject) = check_raw_handle_is_function(args.get(1)) else {
        return false;
    };

    let Ok(url) = raw_handle_to_string(cx, args.get(2)) else {
        return false;
    };

    let fut = Box::pin(async move {
        match execute_request(url.as_str()).await {
            Ok(text) => {
                rooted!(in(cx) let mut inval = UndefinedValue());
                text.to_jsval(cx, inval.handle_mut());

                let func_args = unsafe { HandleValueArray::from_rooted_slice(&[*inval]) };

                rooted!(in(cx) let thisval = NullValue().to_object_or_null());
                rooted!(in(cx) let mut rval = UndefinedValue());

                JS_CallFunctionValue(
                    cx,
                    thisval.handle().into(),
                    resolve.into(),
                    &func_args,
                    rval.handle_mut().into(),
                );
            }

            Err(f) => {
                rooted!(in(cx) let mut inval = UndefinedValue());
                format!("{f:?}").to_jsval(cx, inval.handle_mut());

                let func_args = unsafe { HandleValueArray::from_rooted_slice(&[*inval]) };

                rooted!(in(cx) let thisval = NullValue().to_object_or_null());
                rooted!(in(cx) let mut rval = UndefinedValue());

                JS_CallFunctionValue(
                    cx,
                    thisval.handle().into(),
                    reject.into(),
                    &func_args,
                    rval.handle_mut().into(),
                );
            }
        }
    });

    let tx = js_try!(
        cx,
        super::run::FUTURES
            .with(|tx| tx.borrow().clone())
            .context("Future execution loop is stopped")
    );

    js_try!(cx, tx.send(Box::pin(fut)));

    rooted!(in(cx) let mut rval = UndefinedValue());
    args.rval().set(*rval);

    true
}

async fn execute_request(url: &str) -> anyhow::Result<String> {
    let result = reqwest::get(url)
        .await
        .context("Failed to execute request")?;

    result
        .text()
        .await
        .context("Failed to read response body as text")
}

#[cfg(test)]
mod tests {
    use http::Method;
    use hyper::Body;

    #[tokio::test]
    async fn test_client_fetch() {
        let code = r#"
            addEventListener('fetch', async (req) => {
              const body = await req.text();
              console.log("Fetching: " + body);
              const fetched = await fetch(body);
              console.log("Fetch result: " + fetched);
              return new Response(fetched, {headers: new Headers(), status: 200});
            });
        "#;

        let req = http::Request::builder()
            .method(Method::POST)
            .body(Body::from("https://www.google.com"))
            .unwrap();

        let res = crate::run::tests::run_request_blocking(code, req)
            .await
            .unwrap();

        assert_eq!(res.status(), 200);
    }
}
