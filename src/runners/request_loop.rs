use std::sync::Arc;

use anyhow::anyhow;
use futures::StreamExt;
use ion::{Context, TracedHeap};
use mozjs::{jsapi::JSContext, jsval::JSVal};
use tokio::{select, sync::oneshot};

use crate::{
    js_app::JsApp,
    request_handlers::{Either, Request, RequestHandler},
    runners::ResponseData,
    sm_utils::error_report_option_to_anyhow_error,
};

use super::{
    event_loop_stream::EventLoopStream,
    request_queue::{RequestFinishedHandler, RequestFinishedResult, RequestQueue},
};

pub struct RequestData {
    pub(super) _addr: std::net::SocketAddr,
    pub(super) req: http::request::Parts,
    pub(super) body: hyper::Body,
}

pub enum ControlMessage {
    HandleRequest(RequestData, tokio::sync::oneshot::Sender<ResponseData>),
    Shutdown,
    Terminate,
}

impl std::fmt::Debug for ControlMessage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HandleRequest(_, _) => write!(f, "HandleRequest"),
            Self::Shutdown => write!(f, "Shutdown"),
            Self::Terminate => write!(f, "Terminate"),
        }
    }
}

// Used to ignore errors when sending responses back, since
// if the receiving end of the oneshot channel is dropped,
// there really isn't anything we can do
fn ignore_error<E>(_r: std::result::Result<(), E>) {}

pub(super) async fn handle_requests(
    js_app: JsApp,
    mut recv: tokio::sync::mpsc::UnboundedReceiver<ControlMessage>,
) {
    let cx = js_app.cx();
    let rt = js_app.rt();
    let mut event_loop_stream = EventLoopStream {
        cx_rt: &js_app.context_and_runtime,
    };

    let mut request_queue = RequestQueue::new(cx);

    let mut shutdown_requested = false;

    loop {
        if shutdown_requested && rt.event_loop_is_empty() && request_queue.is_empty() {
            break;
        }

        select! {
            msg = recv.recv() => {
                match msg {
                    None | Some(ControlMessage::Shutdown) => {
                        shutdown_requested = true;
                    },
                    Some(ControlMessage::Terminate) => {
                        request_queue.cancel_all(RequestCancelledReason::ServerShuttingDown);
                        return ;
                    }
                    Some(ControlMessage::HandleRequest(req, resp_tx)) => {
                        if shutdown_requested {
                            ignore_error(resp_tx.send(ResponseData::InternalError(
                                anyhow!("New request received after shutdown requested")
                            )));
                        } else {
                            handle_new_request(
                                cx,
                                &js_app.request_handler,
                                &mut request_queue,
                                req,
                                resp_tx
                            );
                        }
                    }
                }
            }

            // Nothing to do
            _ = request_queue.next() => (),

            // Nothing to do here except check the error
            e = event_loop_stream.next() => {
                match e {
                    Some(Ok(())) => {
                        request_queue.cancel_unfinished(RequestCancelledReason::Unresolvable).await;
                    }
                    Some(Err(e)) => {
                        // Note: an error in this stage is an unhandled error happening in the request
                        // logic, and such an error should not terminate the whole request processing
                        // thread.
                        println!(
                            "Unhandled error from event loop: {}",
                            error_report_option_to_anyhow_error(cx, e)
                        );
                    },
                    None => unreachable!("EventLoopStream should never terminate")
                }
            }
        }
    }
}

fn handle_new_request(
    cx: &Context,
    handler: &Arc<dyn RequestHandler>,
    request_queue: &mut RequestQueue<RequestFinishedCallback>,
    req: RequestData,
    resp_tx: oneshot::Sender<ResponseData>,
) {
    tracing::trace!(%req.req.method, %req.req.uri, ?req.req.headers, "Incoming request");
    match handler.start_handling_request(
        cx.duplicate(),
        Request {
            parts: req.req,
            body: req.body,
        },
    ) {
        Err(f) => ignore_error(resp_tx.send(ResponseData::RequestError(f))),
        Ok(Either::Left(pending)) => request_queue.push(
            pending,
            RequestFinishedCallback {
                cx: cx.as_ptr(),
                handler: handler.clone(),
                resp_tx: Some(resp_tx),
            },
        ),
        Ok(Either::Right(resp)) => {
            if let Some(fut) = resp.body_future {
                request_queue.push_continuation(fut);
            }
            ignore_error(resp_tx.send(ResponseData::Done(resp.response)))
        }
    }
}

#[derive(Clone, Copy)]
enum RequestCancelledReason {
    Unresolvable,
    ServerShuttingDown,
}

struct RequestFinishedCallback {
    cx: *mut JSContext,
    handler: Arc<dyn RequestHandler>,
    resp_tx: Option<oneshot::Sender<ResponseData>>,
}

impl RequestFinishedCallback {
    fn get_resp_tx(&mut self) -> oneshot::Sender<ResponseData> {
        self.resp_tx
            .take()
            .expect("resp_tx should be used once only")
    }
}

impl RequestFinishedHandler for RequestFinishedCallback {
    type CancelReason = RequestCancelledReason;

    fn request_finished(
        &mut self,
        result: Result<TracedHeap<JSVal>, TracedHeap<JSVal>>,
    ) -> RequestFinishedResult {
        let response = self
            .handler
            .finish_request(unsafe { Context::new_unchecked(self.cx) }, result);
        match response {
            Ok(Either::Left(pending)) => RequestFinishedResult::Pending(pending.promise),
            Ok(Either::Right(response)) => {
                ignore_error(
                    self.get_resp_tx()
                        .send(ResponseData::Done(response.response)),
                );

                if let Some(fut) = response.body_future {
                    RequestFinishedResult::HasContinuation(fut)
                } else {
                    RequestFinishedResult::Done
                }
            }
            Err(f) => {
                ignore_error(self.get_resp_tx().send(ResponseData::RequestError(f)));
                RequestFinishedResult::Done
            }
        }
    }

    fn request_cancelled(&mut self, reason: RequestCancelledReason) {
        match reason {
            RequestCancelledReason::Unresolvable => {
                let response = hyper::Response::builder()
                    .status(500)
                    .body(hyper::Body::from("The request could not be completed"))
                    .expect("Failed to construct 500 response");
                ignore_error(self.get_resp_tx().send(ResponseData::Done(response)));
                tracing::warn!(
                    "Request deemed impossible to complete since all IO-related promises \
                have been resolved but the request's promise is still in pending state"
                );
            }

            RequestCancelledReason::ServerShuttingDown => {
                let response = hyper::Response::builder()
                    .status(503)
                    .body(hyper::Body::from("Server is shutting down"))
                    .expect("Failed to construct 503 response");

                ignore_error(self.get_resp_tx().send(ResponseData::Done(response)));
            }
        }
    }
}
