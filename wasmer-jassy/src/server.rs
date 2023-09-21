use std::convert::Infallible;
use std::net::SocketAddr;

use anyhow::Context as _;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};

#[derive(Clone)]
struct AppContext {}

async fn handle(
    context: AppContext,
    addr: SocketAddr,
    req: Request<Body>,
) -> Result<Response<Body>, Infallible> {
    Ok(Response::new(Body::from("Hello World")))
}

async fn run_server() {
    let context = AppContext {};

    let make_service = make_service_fn(move |conn: &AddrStream| {
        let context = context.clone();

        let _addr = conn.remote_addr();

        // Create a `Service` for responding to the request.
        let service = service_fn(move |req| handle(context.clone(), addr, req));

        // Return the service to hyper.
        async move { Ok::<_, Infallible>(service) }
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    Server::bind(&addr)
        .serve(make_service)
        .await
        .context("hyper server failed")
}
