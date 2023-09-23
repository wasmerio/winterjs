use std::convert::Infallible;
use std::net::SocketAddr;

use anyhow::Context as _;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};

#[derive(Clone)]
struct AppContext {
    /// Javascript code.
    code: String,
}

async fn handle(
    context: AppContext,
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
    context: AppContext,
    addr: SocketAddr,
    req: Request<Body>,
) -> Result<Response<Body>, anyhow::Error> {
    let code = context.code.clone();

    let (parts, body) = req.into_parts();
    let body = hyper::body::to_bytes(body)
        .await
        .context("could not read body")?;

    tokio::task::spawn_blocking(move || crate::run::run_request(&context.code, parts, Some(body)))
        .await
        .context("processing task failed")?
        .context("javascript failed")
}

pub async fn run_server(code: String) -> Result<(), anyhow::Error> {
    let context = AppContext { code };

    let make_service = make_service_fn(move |conn: &AddrStream| {
        let context = context.clone();

        let addr = conn.remote_addr();

        // Create a `Service` for responding to the request.
        let service = service_fn(move |req| handle(context.clone(), addr, req));

        // Return the service to hyper.
        async move { Ok::<_, Infallible>(service) }
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!(listen=%addr, "starting server on {addr}");

    Server::bind(&addr)
        .serve(make_service)
        .await
        .context("hyper server failed")
}
