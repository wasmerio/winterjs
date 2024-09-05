mod event_loop_stream;
pub mod exec;
pub mod inline;
mod request_loop;
mod request_queue;
pub mod single;
pub mod watch;

#[derive(Debug)]
pub enum ResponseData {
    Done(hyper::Response<hyper::Body>),
    RequestError(anyhow::Error),
    InternalError(anyhow::Error),
}

fn generate_internal_error() -> hyper::Response<hyper::Body> {
    generate_error_response(500, "Internal server error".into())
}

fn generate_error_response(
    status: u16,
    message: std::borrow::Cow<'static, str>,
) -> hyper::Response<hyper::Body> {
    hyper::Response::builder()
        .status(status)
        .body(hyper::Body::from(message))
        .expect("Failed to construct response")
}
