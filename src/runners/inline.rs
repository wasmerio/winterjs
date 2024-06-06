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

use anyhow::anyhow;
use async_trait::async_trait;
use futures::Future;
use tokio::sync::mpsc;

use crate::request_handlers::{RequestHandler, UserCode};

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
        handler: impl RequestHandler + Copy + Unpin,
        user_code: UserCode,
    ) -> (Self, impl InlineRunnerRequestHandlerFuture) {
        let (tx, rx) = mpsc::unbounded_channel();
        let this = Self {
            channel: tx,
            finished: Arc::new(AtomicBool::new(false)),
        };
        let finished_clone = this.finished.clone();
        let fut = async move {
            handle_requests(handler, user_code, rx, 1).await;
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
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
        let (tx, rx) = tokio::sync::oneshot::channel();

        self.channel.send(ControlMessage::HandleRequest(
            RequestData { _addr, req, body },
            tx,
        ))?;

        let response = rx.await?;

        // TODO: handle script errors
        match response {
            ResponseData::Done(resp) => Ok(resp),
            ResponseData::RequestError(err) => Err(err),
            ResponseData::ScriptError(err) => {
                if let Some(err) = err {
                    println!("{err:?}");
                }
                Err(anyhow!("Error encountered while evaluating user script"))
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
