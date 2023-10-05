use std::str::FromStr;

use crate::run::*;
use anyhow::{bail, Context};
use http::{HeaderName, HeaderValue, Method};
use mozjs::conversions::ToJSValConvertible;
use mozjs::jsval::{NullValue, ObjectValue, UndefinedValue};
use mozjs::rooted;

use mozjs::jsapi::{
    CallArgs, HandleValueArray, JSContext, JSObject, JS_CallFunctionValue, JS_NewPlainObject, Value,
};
use mozjs::rust::HandleObject;
use reqwest::{Request, Response};

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
        rooted!(in(cx) let response_rooted = unsafe { JS_NewPlainObject(cx) });

        match execute_request(cx, url.as_str(), params, response_rooted.handle()).await {
            Ok(()) => {
                rooted!(in(cx) let arg1 = ObjectValue(response_rooted.get()));

                let slice = &[*arg1];
                let func_args = unsafe { HandleValueArray::from_rooted_slice(slice) };

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
    out_response: HandleObject<'_>,
) -> anyhow::Result<()> {
    let request = build_request(cx, url, params)?;
    let client = reqwest::ClientBuilder::new().build()?;

    let response = client
        .execute(request)
        .await
        .context("Failed to execute request")?;

    build_response(cx, response, out_response).await?;
    Ok(())
}

fn build_request(cx: *mut JSContext, url: &str, params: *mut JSObject) -> anyhow::Result<Request> {
    rooted!(in(cx) let params = params);

    let method = if has_property(cx, params.handle(), "method")? {
        rooted!(in(cx) let mut val = UndefinedValue());
        get_property_raw(cx, params.handle(), "method", val.handle_mut())?;
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

    let mut request = Request::new(method, url.parse().context("Invalid URL")?);

    if has_property(cx, params.handle(), "headers")? {
        let request_headers = request.headers_mut();

        rooted!(in(cx) let mut headers_obj = UndefinedValue());
        get_property_raw(cx, params.handle(), "headers", headers_obj.handle_mut())?;
        if !headers_obj.is_object() {
            bail!("Headers should be an object");
        }

        let keys = all_keys(cx, headers_obj.handle())?;
        rooted!(in(cx) let headers_obj = headers_obj.to_object());

        for key in keys {
            let val = get_property::<String>(cx, headers_obj.handle(), key.as_str(), ())?;
            request_headers.append(
                HeaderName::from_str(key.as_str())?,
                HeaderValue::from_str(val.as_str())?,
            );
        }
    }

    Ok(request)
}

async fn build_response(
    cx: *mut JSContext,
    response: Response,
    response_handle: HandleObject<'_>,
) -> anyhow::Result<()> {
    let resp_headers = response.headers();

    // TODO: how do we get the Headers class?
    let headers_obj = unsafe { JS_NewPlainObject(cx) };
    rooted!(in(cx) let headers = headers_obj);
    let headers_handle = headers.handle();
    for header in resp_headers {
        set_property(
            cx,
            headers_handle,
            header.0.as_str(),
            &header.1.to_str()?.to_string(),
        )?;
    }

    let body = response
        .text()
        .await
        .context("Failed to read response body as text")?;
    // TODO: support binary body

    set_property(cx, response_handle, "body", &body)?;
    set_property(cx, response_handle, "headers", &headers_obj)?;

    Ok(())
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
              const fetched = await fetch(body, {
                method: "POST",
                headers: {
                  'X-SOME-HEADER': 'Header value'
                }
              });
              console.log("Fetch result: " + fetched.body);
              return new Response(fetched.body, {headers: new Headers(), status: 200});
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
