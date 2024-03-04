mod event_loop_stream;
pub mod exec;
mod request_queue;
pub mod single;
pub mod watch;

#[derive(Debug)]
pub enum ResponseData {
    Done(hyper::Response<hyper::Body>),
    RequestError(anyhow::Error),

    // The error can only be returned once, so future calls to the
    // thread will return None instead
    ScriptError(Option<anyhow::Error>),
}
