use anyhow::{anyhow, bail};
use ion::{conversions::ToValue, ClassDefinition, Context, Object, Promise};

use crate::sm_utils::error_report_to_anyhow_error;

use super::{Either, PendingResponse, ReadyResponse, Request};

pub mod event_listener;
pub mod fetch_event;

pub fn define(cx: &Context, global: &mut Object) -> bool {
    event_listener::define(cx, global) && fetch_event::FetchEvent::init_class(cx, global).0
}

pub fn start_request(
    cx: &Context,
    request: Request,
) -> anyhow::Result<Either<PendingResponse, ReadyResponse>> {
    let fetch_event = Object::from(cx.root_object(fetch_event::FetchEvent::new_object(
        cx,
        Box::new(fetch_event::FetchEvent::try_new(cx, request)?),
    )));

    let callback_rval =
        event_listener::invoke_fetch_event_callback(cx, &[fetch_event.as_value(cx)]).map_err(
            |e| {
                e.map(|e| error_report_to_anyhow_error(cx, e))
                    .unwrap_or(anyhow!("Script execution failed"))
            },
        )?;

    if !callback_rval.get().is_undefined() {
        bail!("Script error: the fetch event handler should not return a value");
    }

    let fetch_event = fetch_event::FetchEvent::get_private(&fetch_event);

    match fetch_event.response.as_ref() {
        None => {
            bail!("Script error: FetchEvent.respondWith must be called with a Response object before returning")
        }
        Some(response) => {
            let response = Object::from(response.root(cx));

            if Promise::is_promise(&response) {
                Ok(Either::Left(PendingResponse {
                    promise: unsafe { Promise::from_unchecked(response.into_local()) },
                }))
            } else {
                Ok(Either::Right(build_response(cx, response)?))
            }
        }
    }
}

pub fn build_response(cx: &Context, mut value: Object) -> anyhow::Result<ReadyResponse> {
    if !runtime::globals::fetch::Response::instance_of(cx, &value, None) {
        bail!("Script error: value provided to respondWith must be an instance of Response");
    }

    let response = runtime::globals::fetch::Response::get_mut_private(&mut value);

    super::build_response_from_fetch_response(cx, response)
}
