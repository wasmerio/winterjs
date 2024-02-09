use std::pin::Pin;

use anyhow::{anyhow, bail, Result};
use futures::Future;
use ion::{conversions::ToValue, ClassDefinition, Context, Object, Promise, Value};

use crate::sm_utils::{self, error_report_to_anyhow_error};

use self::fetch_event::FetchEvent;

use super::{
    ByRefStandardModules, Either, PendingResponse, ReadyResponse, Request, RequestHandler, UserCode,
};

pub mod event_listener;
pub mod fetch_event;

#[derive(Clone)]
pub struct WinterCGRequestHandler;

impl RequestHandler for WinterCGRequestHandler {
    fn get_standard_modules(&self) -> Box<dyn ByRefStandardModules> {
        Box::new(WinterCGStandardModules)
    }

    fn evaluate_scripts(&mut self, cx: &Context, code: &UserCode) -> Result<()> {
        match code {
            UserCode::Script { code, file_name } => {
                sm_utils::evaluate_script(cx, code, file_name)?;
            }
            UserCode::Module(path) => {
                sm_utils::evaluate_module(cx, path)?;
            }
            UserCode::Directory(_) => bail!("WinterCG mode does not support directories"),
        };

        Ok(())
    }

    fn start_handling_request(
        &mut self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        start_request(cx, request)
    }

    fn finish_fulfilled_request(&mut self, cx: Context, val: Value) -> Result<ReadyResponse> {
        if !val.handle().is_object() {
            bail!("Script error: value provided to respondWith was not an object");
        }
        build_response(&cx, val.to_object(&cx))
    }
}

struct WinterCGStandardModules;

impl ByRefStandardModules for WinterCGStandardModules {
    fn init_modules(&self, cx: &Context, global: &mut Object) -> bool {
        self.init_globals(cx, global)
    }

    fn init_globals(&self, cx: &Context, global: &mut Object) -> bool {
        event_listener::define(cx, global) && fetch_event::FetchEvent::init_class(cx, global).0
    }
}

fn start_request(cx: Context, request: Request) -> Result<Either<PendingResponse, ReadyResponse>> {
    let fetch_event = Object::from(cx.root_object(FetchEvent::new_object(
        &cx,
        Box::new(FetchEvent::try_new(&cx, request.parts, request.body)?),
    )));

    let callback_rval =
        event_listener::invoke_fetch_event_callback(&cx, &[fetch_event.as_value(&cx)]).map_err(
            |e| {
                e.map(|e| error_report_to_anyhow_error(&cx, e))
                    .unwrap_or(anyhow!("Script execution failed"))
            },
        )?;

    if !callback_rval.get().is_undefined() {
        bail!("Script error: the fetch event handler should not return a value");
    }

    let fetch_event = FetchEvent::get_private(&fetch_event);

    match fetch_event.response.as_ref() {
        None => {
            bail!("Script error: FetchEvent.respondWith must be called with a Response object before returning")
        }
        Some(response) => {
            let response = Object::from(response.root(&cx));

            if Promise::is_promise(&response) {
                Ok(Either::Left(PendingResponse {
                    promise: unsafe { Promise::from_unchecked(response.into_local()) },
                }))
            } else {
                Ok(Either::Right(build_response(&cx, response)?))
            }
        }
    }
}

fn build_response(cx: &Context, mut value: Object) -> Result<ReadyResponse> {
    if !runtime::globals::fetch::Response::instance_of(cx, &value, None) {
        // TODO: support plain objects
        bail!("If an object is returned, it must be an instance of Response");
    }

    let response = runtime::globals::fetch::Response::get_mut_private(&mut value);

    let mut hyper_response = hyper::Response::builder().status(response.get_status());

    let headers =
        anyhow::Context::context(hyper_response.headers_mut(), "Response has no headers")?;
    let response_headers = response.get_headers_object(cx);
    for header in response_headers.iter() {
        headers.append(header.0.clone(), header.1.clone());
    }

    let body = response
        .take_body()
        .map_err(|e| anyhow!("Failed to read response body: {e:?}"))?;

    let (body, future) = body
        .into_http_body(cx.duplicate())
        .map_err(|e| anyhow!("Failed to create HTTP body: {e:?}"))?;
    Ok(ReadyResponse {
        response: hyper_response.body(body)?,
        body_future: future.map(|f| -> Pin<Box<dyn Future<Output = ()>>> { Box::pin(f) }),
    })
}
