use std::convert::Infallible;
use std::net::SocketAddr;

use anyhow::Context as _;
use async_trait::async_trait;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};

#[derive(Clone, Debug)]
pub struct ServerConfig {
    pub addr: SocketAddr,
}

pub async fn run_server<H: Runner + Send + Sync>(
    config: ServerConfig,
    handler: H,
) -> Result<(), anyhow::Error> {
    let context = AppContext { handler };

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
        .await
        .context("hyper server failed")
}

#[async_trait]
pub trait Runner: Send + Clone + 'static {
    async fn handle(
        &self,
        addr: SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> anyhow::Result<hyper::Response<hyper::Body>>;
}

#[derive(Clone)]
struct AppContext<H: Runner> {
    handler: H,
}

async fn handle(
    context: AppContext<impl Runner>,
    addr: SocketAddr,
    req: Request<Body>,
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

    Ok(res)
}

async fn handle_inner(
    context: AppContext<impl Runner>,
    addr: SocketAddr,
    req: Request<Body>,
) -> Result<Response<Body>, anyhow::Error> {
    let (parts, body) = req.into_parts();
    context
        .handler
        .handle(addr, parts, body)
        .await
        .context("JavaScript failed")
}
