use crate::run::*;
use anyhow::{bail, Context};
use http::{request, Method};
use mozjs::conversions::ToJSValConvertible;
use mozjs::jsval::{NullValue, UndefinedValue};
use mozjs::rooted;

use mozjs::jsapi::{
    CallArgs, HandleValueArray, JSContext, JSObject, JS_CallFunctionValue, JS_GetProperty, Value,
};
use reqwest::Request;

pub(super) unsafe extern "C" fn fetch(cx: *mut JSContext, argc: u32, vp: *mut Value) -> bool {
    let args = CallArgs::from_vp(vp, argc);

    if args.argc_ < 4 {
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

    let Ok(params) = raw_handle_to_object(args.get(3)) else {
        return false;
    };

    let fut = Box::pin(async move {
        match execute_request(cx, url.as_str(), params).await {
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

async fn execute_request(
    cx: *mut JSContext,
    url: &str,
    params: *mut JSObject,
) -> anyhow::Result<String> {
    rooted!(in(cx) let params = params);

    let method = if has_property(cx, params.handle(), "method")? {
        rooted!(in(cx) let mut val = UndefinedValue());
        get_property_raw(cx, params.handle(), "method", val.handle_mut());
        if val.is_null_or_undefined() {
            Method::GET
        } else {
            let val = raw_handle_to_string(cx, val.handle().into())?;
            match val.to_ascii_lowercase().as_str() {
                "get" => Method::GET,
                "post" => Method::POST,
                "put" => Method::PUT,
                "delete" => Method::DELETE,
                "patch" => Method::PATCH,
                "head" => Method::HEAD,
                "connect" => Method::CONNECT,
                "trace" => Method::TRACE,
                x => bail!("Unsupported method {x}"),
            }
        }
    } else {
        Method::GET
    };

    let request = Request::new(method, url.parse().context("Invalid URL")?);

    let client = reqwest::ClientBuilder::new().build()?;

    let result = client
        .execute(request)
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
              const fetched = await fetch(body, {method: "POST"});
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
