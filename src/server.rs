use std::convert::Infallible;
use std::net::SocketAddr;

use anyhow::Context as _;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};

use crate::runners::BoxedDynRunner;

#[derive(Clone, Debug)]
pub struct ServerConfig {
    pub addr: SocketAddr,
}

pub async fn run_server(
    config: ServerConfig,
    runner: BoxedDynRunner,
    shutdown_signal: tokio::sync::oneshot::Receiver<()>,
) -> Result<(), anyhow::Error> {
    let context = AppContext { runner };

    let make_service = make_service_fn(move |conn: &AddrStream| {
        let context = context.clone();

        let addr = conn.remote_addr();

        // Create a `Service` for responding to the request.
        let service = service_fn(move |req| handle(context.clone(), addr, req));

        // Return the service to hyper.
        async move { Ok::<_, Infallible>(service) }
    });

    let addr = config.addr;
    tracing::info!(listen=%addr, "starting server on '{addr}'");

    Server::bind(&addr)
        .serve(make_service)
        .with_graceful_shutdown(async move { _ = shutdown_signal.await })
        .await
        .context("hyper server failed")
}

#[derive(Clone)]
struct AppContext {
    runner: BoxedDynRunner,
}

async fn handle(
    context: AppContext,
    addr: SocketAddr,
    req: Request<Body>,
) -> Result<Response<Body>, Infallible> {
    let (parts, body) = req.into_parts();
    tracing::info!(url = %parts.uri, method = %parts.method, "Incoming request");
    Ok(context.runner.handle(addr, parts, body).await)
}
