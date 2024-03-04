use std::{pin::Pin, task::Poll};

use futures::{future::Fuse, stream::FuturesUnordered, Future, FutureExt, Stream, StreamExt};
use ion::{PromiseFuture, TracedHeap};
use mozjs::{jsapi::JSContext, jsval::JSVal};

use crate::request_handlers::PendingResponse;

pub trait RequestFinishedHandler: Unpin {
    type CancelReason: Unpin + Copy;

    fn request_finished(
        &mut self,
        result: Result<TracedHeap<JSVal>, TracedHeap<JSVal>>,
    ) -> RequestFinishedResult;

    fn request_cancelled(&mut self, reason: Self::CancelReason);
}

pub struct RequestQueue<F: RequestFinishedHandler> {
    cx: *mut JSContext,
    requests: FuturesUnordered<RequestFuture<F>>,
    continuations: FuturesUnordered<Pin<Box<dyn Future<Output = ()>>>>,
}

impl<F: RequestFinishedHandler> RequestQueue<F> {
    pub fn new(cx: &ion::Context) -> Self {
        Self {
            cx: cx.as_ptr(),
            requests: FuturesUnordered::new(),
            continuations: FuturesUnordered::new(),
        }
    }

    pub fn is_empty(&self) -> bool {
        self.requests.is_empty() && self.continuations.is_empty()
    }

    pub fn push(&mut self, pending: PendingResponse, on_finished: F) {
        self.requests.push(RequestFuture {
            promise: PromiseFuture::new(
                unsafe { ion::Context::new_unchecked(self.cx) },
                &pending.promise,
            )
            .fuse(),
            on_finished,
        })
    }

    pub fn push_continuation(&mut self, future: Pin<Box<dyn Future<Output = ()>>>) {
        self.continuations.push(future);
    }

    pub fn cancel_all(&mut self, cancel_reason: F::CancelReason) {
        let mut requests = FuturesUnordered::new();
        std::mem::swap(&mut requests, &mut self.requests);
        for mut req in requests.into_iter() {
            req.on_finished.request_cancelled(cancel_reason);
        }
    }

    pub fn cancel_unfinished(&mut self, cancel_reason: F::CancelReason) -> CancelUnfinished<'_, F> {
        CancelUnfinished {
            queue: self,
            reason: cancel_reason,
        }
    }
}

impl<F: RequestFinishedHandler> Stream for RequestQueue<F> {
    type Item = ();

    fn poll_next(
        mut self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Option<Self::Item>> {
        if self.is_empty() {
            return Poll::Pending;
        }

        if !self.requests.is_empty() {
            if let Poll::Ready(req) = self.requests.poll_next_unpin(cx) {
                match req {
                    None | Some(None) => (),
                    Some(Some(future)) => self.continuations.push(future),
                }

                return Poll::Ready(Some(()));
            }
        }

        if !self.continuations.is_empty() && self.continuations.poll_next_unpin(cx).is_ready() {
            return Poll::Ready(Some(()));
        }

        Poll::Pending
    }
}

pub struct CancelUnfinished<'q, F: RequestFinishedHandler> {
    queue: &'q mut RequestQueue<F>,
    reason: F::CancelReason,
}

impl<'q, F: RequestFinishedHandler> Future for CancelUnfinished<'q, F> {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> Poll<Self::Output> {
        let this = self.get_mut();
        while this.queue.poll_next_unpin(cx).is_ready() {
            // Nothing to do, we're just letting all ready things finish
        }
        this.queue.cancel_all(this.reason);
        Poll::Ready(())
    }
}

struct RequestFuture<F: RequestFinishedHandler> {
    promise: Fuse<PromiseFuture>,
    on_finished: F,
}

pub enum RequestFinishedResult {
    Pending(ion::Promise),
    HasContinuation(Pin<Box<dyn Future<Output = ()>>>),
    Done,
}

impl<F: RequestFinishedHandler> Future for RequestFuture<F> {
    type Output = Option<Pin<Box<dyn Future<Output = ()>>>>;

    fn poll(mut self: Pin<&mut Self>, wcx: &mut std::task::Context<'_>) -> Poll<Self::Output> {
        match self.promise.poll_unpin(wcx) {
            Poll::Pending => Poll::Pending,
            Poll::Ready((cx, res)) => match self.on_finished.request_finished(res) {
                RequestFinishedResult::Done => Poll::Ready(None),
                RequestFinishedResult::HasContinuation(future) => Poll::Ready(Some(future)),
                RequestFinishedResult::Pending(promise) => {
                    self.promise = PromiseFuture::new(cx, &promise).fuse();
                    self.poll_unpin(wcx)
                }
            },
        }
    }
}
