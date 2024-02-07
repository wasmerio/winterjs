use std::{path::Path, pin::Pin};

use anyhow::{anyhow, bail, Context as _, Result};
use futures::Future;
use ion::{
    conversions::ToValue, module::Module, script::Script, ClassDefinition, Context, Object, Promise,
};
use mozjs::jsapi::PromiseState;

use crate::sm_utils::{error_report_option_to_anyhow_error, error_report_to_anyhow_error};

use self::fetch_event::FetchEvent;

use super::{Either, PendingResponse, ReadyResponse, Request, RequestHandler, UserCode};

pub mod event_listener;
pub mod fetch_event;

#[derive(Clone)]
pub struct WinterCGRequestHandler;

impl RequestHandler for WinterCGRequestHandler {
    fn init_modules(&self, cx: &Context, global: &mut Object) -> bool {
        self.init_globals(cx, global)
    }

    fn init_globals(&self, cx: &Context, global: &mut Object) -> bool {
        event_listener::define(cx, global) && fetch_event::FetchEvent::init_class(cx, global).0
    }

    fn evaluate_scripts(&self, cx: &Context, code: &UserCode) -> Result<()> {
        match code {
            UserCode::Script { code, file_name } => {
                Script::compile_and_evaluate(cx, Path::new(&file_name), code.as_str())
                    .map_err(|e| error_report_to_anyhow_error(cx, e))?;
            }
            UserCode::Module(path) => {
                let file_name = path
                    .file_name()
                    .ok_or(anyhow!("Failed to get file name from script path"))
                    .map(|f| f.to_string_lossy().into_owned())?;

                let code = std::fs::read_to_string(path).context("Failed to read script file")?;

                Module::compile_and_evaluate(cx, &file_name, Some(path), &code).map_err(|e| {
                    error_report_option_to_anyhow_error(cx, Some(e.report)).context(format!(
                        "Error while loading module during {:?} step",
                        e.kind
                    ))
                })?;
            }
            UserCode::Directory(_) => bail!("WinterCG mode does not support directories"),
        }

        Ok(())
    }

    fn start_handling_request(
        &self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        start_request(cx, request)
    }

    fn finish_request(&self, cx: Context, response: PendingResponse) -> Result<ReadyResponse> {
        finish_pending_request(cx, response)
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

fn finish_pending_request(cx: Context, response: PendingResponse) -> Result<ReadyResponse> {
    match response.promise.state(&cx) {
        PromiseState::Pending => {
            bail!("Internal error: promise is not fulfilled yet");
        }
        PromiseState::Rejected => {
            let result = response.promise.result(&cx);
            let message = result
                .to_object(&cx)
                .get(&cx, "message")
                .and_then(|v| {
                    if v.get().is_string() {
                        Some(ion::String::from(cx.root_string(v.get().to_string())).to_owned(&cx))
                    } else {
                        None
                    }
                })
                .unwrap_or("<No error message>".to_string());
            bail!("Script execution failed: {message}")
        }
        PromiseState::Fulfilled => {
            let promise_result = response.promise.result(&cx);
            if !promise_result.handle().is_object() {
                bail!("Script error: value provided to respondWith was not an object");
            }
            build_response(&cx, promise_result.to_object(&cx))
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
