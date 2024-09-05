//! An inline runner does not spawn new threads, instead executing
//! requests inline on the task it's called on, which must be running
//! in a single-threaded runtime.

use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use async_trait::async_trait;
use futures::Future;
use tokio::sync::mpsc;

use crate::{
    js_app::JsApp,
    request_handlers::RequestHandler,
    runners::{generate_error_response, generate_internal_error},
};

use super::{
    request_loop::{handle_requests, ControlMessage, RequestData},
    ResponseData,
};

#[derive(Clone)]
pub struct InlineRunner {
    channel: mpsc::UnboundedSender<ControlMessage>,
    finished: Arc<AtomicBool>,
}

pub trait InlineRunnerRequestHandlerFuture: Future<Output = ()> {}

impl<T: Future<Output = ()>> InlineRunnerRequestHandlerFuture for T {}

impl InlineRunner {
    pub fn new_request_handler(
        js_app: JsApp<impl RequestHandler>,
    ) -> (Self, impl InlineRunnerRequestHandlerFuture) {
        let (tx, rx) = mpsc::unbounded_channel();
        let this = Self {
            channel: tx,
            finished: Arc::new(AtomicBool::new(false)),
        };
        let finished_clone = this.finished.clone();
        let fut = async move {
            handle_requests(js_app, rx).await;
            // Remember, we're running single-threaded, so no need
            // for any specific ordering logic.
            finished_clone.store(true, Ordering::Relaxed);
        };
        (this, fut)
    }
}

#[async_trait]
impl crate::server::Runner for InlineRunner {
    async fn handle(
        &self,
        _addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> hyper::Response<hyper::Body> {
        let (tx, rx) = tokio::sync::oneshot::channel();

        if let Err(e) = self.channel.send(ControlMessage::HandleRequest(
            RequestData { _addr, req, body },
            tx,
        )) {
            tracing::error!(?e, "Failed to send control message to inline worker");
            return generate_internal_error();
        };

        let response = match rx.await {
            Ok(r) => r,
            Err(e) => {
                tracing::error!(?e, "Failed to receive response from inline worker");
                return generate_internal_error();
            }
        };

        match response {
            ResponseData::Done(resp) => resp,
            ResponseData::RequestError(err) => {
                tracing::error!(?err, "Script error");
                // TODO: this should be a CLI switch
                #[cfg(debug_assertions)]
                {
                    generate_error_response(500, format!("{err:?}").into())
                }
                #[cfg(not(debug_assertions))]
                {
                    generate_error_response(500, "Script execution failed")
                }
            }
            ResponseData::InternalError(err) => {
                tracing::error!(?err, "Internal error in worker thread");
                generate_internal_error()
            }
        }
    }

    async fn shutdown(&self, timeout: Option<Duration>) {
        tracing::info!("Shutting down...");

        if self.channel.send(ControlMessage::Shutdown).is_err() {
            // Channel already closed, future must have run to completion
            return;
        }

        let shutdown_started = Instant::now();

        loop {
            if !self.finished.load(Ordering::Relaxed) {
                if let Some(timeout) = timeout {
                    if shutdown_started.elapsed() >= timeout {
                        tracing::warn!(
                            "Clean shutdown timeout was reached before all \
                            requests could finish processing"
                        );
                        let _ = self.channel.send(ControlMessage::Terminate);
                        break;
                    }
                }

                tracing::debug!("Still waiting for threads to quit...");
                tokio::time::sleep(Duration::from_secs(1)).await;
            } else {
                break;
            }
        }

        tracing::info!(
            "Shutdown completed in {} seconds",
            shutdown_started.elapsed().as_secs()
        );
    }
}
