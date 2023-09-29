use std::convert::Infallible;
use std::net::SocketAddr;
use std::time::Duration;

use anyhow::Context as _;
use bytes::Bytes;
use futures::FutureExt;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};

pub trait RequestHandler: Send + Clone + 'static {
    fn handle(
        &self,
        user_code: &str,
        addr: SocketAddr,
        req: http::request::Parts,
        body: Option<Bytes>,
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error>;
}

#[derive(Clone)]
struct AppContext<H: RequestHandler> {
    /// Javascript code.
    code: String,

    handler: H,
}

async fn handle(
    context: AppContext<impl RequestHandler>,
    addr: SocketAddr,
    req: Request<Body>,
    shutdown_tx: tokio::sync::mpsc::Sender<()>,
) -> Result<Response<Body>, Infallible> {
    let res = match handle_inner(context, addr, req).await {
        Ok(r) => r,
        Err(err) => {
            tracing::error!(error = format!("{err:#?}"), "could not process request");

            hyper::Response::builder()
                .status(hyper::StatusCode::INTERNAL_SERVER_ERROR)
                .body(hyper::Body::from(err.to_string()))
                .unwrap()
        }
    };

    // TODO: figure out why the runtime segfaults after
    // multiple requests so we can keep the instance running
    // in the meantime, we can serve only one request per
    // instance.
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(500)).await;
        shutdown_tx.send(()).await.unwrap();
    });

    Ok(res)
}

async fn handle_inner(
    context: AppContext<impl RequestHandler>,
    addr: SocketAddr,
    req: Request<Body>,
) -> Result<Response<Body>, anyhow::Error> {
    let (parts, body) = req.into_parts();
    let body = hyper::body::to_bytes(body)
        .await
        .context("could not read body")?;

    tokio::task::spawn_blocking(move || {
        context
            .handler
            .handle(&context.code, addr, parts, Some(body))
    })
    .await
    .context("processing task failed")?
    .context("javascript failed")
}

pub async fn run_server<H: RequestHandler>(code: String, handler: H) -> Result<(), anyhow::Error> {
    let context = AppContext { code, handler };

    let (tx, mut rx) = tokio::sync::mpsc::channel(1);

    let make_service = make_service_fn(move |conn: &AddrStream| {
        let context = context.clone();

        let addr = conn.remote_addr();

        // Create a `Service` for responding to the request.
        let tx = tx.clone();
        let service = service_fn(move |req| handle(context.clone(), addr, req, tx.clone()));

        // Return the service to hyper.
        async move { Ok::<_, Infallible>(service) }
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!(listen=%addr, "starting server on {addr}");

    Server::bind(&addr)
        .serve(make_service)
        .with_graceful_shutdown(rx.recv().map(|_| ()))
        .await
        .context("hyper server failed")
}
