use std::{
    pin::Pin,
    task::{self, Poll},
};

use ion::ErrorReport;

use crate::js_app::JsAppContextAndRuntime;

/// This stream keeps stepping the event loop of its runtime, generating a
/// value whenever the event loop is empty, but never finishing.
pub struct EventLoopStream<'app> {
    pub(super) cx_rt: &'app JsAppContextAndRuntime,
}

impl<'app> futures::Stream for EventLoopStream<'app> {
    type Item = Result<(), Option<ErrorReport>>;

    fn poll_next(self: Pin<&mut Self>, wcx: &mut task::Context<'_>) -> Poll<Option<Self::Item>> {
        let rt = self.cx_rt.rt();
        let event_loop_was_empty = rt.event_loop_is_empty();
        match rt.step_event_loop(wcx) {
            Err(e) => Poll::Ready(Some(Err(e))),
            Ok(()) if rt.event_loop_is_empty() && !event_loop_was_empty => {
                Poll::Ready(Some(Ok(())))
            }
            Ok(()) => Poll::Pending,
        }
    }
}
