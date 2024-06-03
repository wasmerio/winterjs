//! An inline runner does not spawn new threads, instead executing
//! requests inline on the task it's called on, which must be running
//! in a single-threaded runtime.

use std::{
    cell::RefCell,
    rc::Rc,
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

pub struct InlineRunner {
    channel: mpsc::UnboundedSender<ControlMessage>,
    receiver: Option<mpsc::UnboundedReceiver<ControlMessage>>,
    finished: bool,
}

pub trait InlineRunnerRequestHandlerFuture: Future<Output = ()> {}

impl<T: Future<Output = ()>> InlineRunnerRequestHandlerFuture for T {}

pub type SharedInlineRunner = Rc<RefCell<InlineRunner>>;

impl InlineRunner {
    fn new() -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            channel: tx,
            receiver: Some(rx),
            finished: false,
        }
    }

    pub fn new_request_handler(
        handler: impl RequestHandler + Copy + Unpin,
        user_code: UserCode,
    ) -> (SharedInlineRunner, impl InlineRunnerRequestHandlerFuture) {
        let this = Rc::new(RefCell::new(Self::new()));
        let this_clone = this.clone();
        let rx = this
            .borrow_mut()
            .receiver
            .take()
            .expect("start_request_handler can only be called once");
        let fut = async move {
            handle_requests(handler, user_code, rx, 1).await;
            this_clone.borrow_mut().finished = true;
        };
        (this, fut)
    }
}

#[async_trait(?Send)]
impl crate::single_threaded_server::SingleThreadedRunner for SharedInlineRunner {
    async fn handle(
        &self,
        _addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
        let (tx, rx) = tokio::sync::oneshot::channel();

        self.borrow().channel.send(ControlMessage::HandleRequest(
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

        self.borrow().channel.send(ControlMessage::Shutdown);

        let shutdown_started = Instant::now();

        loop {
            let this = self.borrow();
            if !this.finished {
                if let Some(timeout) = timeout {
                    if shutdown_started.elapsed() >= timeout {
                        tracing::warn!(
                            "Clean shutdown timeout was reached before all \
                            requests could finish processing"
                        );
                        this.channel.send(ControlMessage::Terminate);
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
