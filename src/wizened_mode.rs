use std::{
    cell::RefCell,
    net::{IpAddr, SocketAddr},
    pin::Pin,
    sync::atomic::AtomicU8,
};

use anyhow::Context;
use clap::Parser;
use tokio::{join, task::LocalSet};

use crate::{
    js_app::JsApp,
    request_handlers::{
        cloudflare, wintercg, NewRequestHandler, Request, RequestHandler, UserCode,
    },
    runners::{self, BoxedDynRunner},
    HandlerName,
};

thread_local! {
    #[allow(clippy::type_complexity)]
    static RUNNER: RefCell<
        Option<(
            BoxedDynRunner,
            Pin<Box<dyn runners::inline::InlineRunnerRequestHandlerFuture>>,
        )>,
    > = const { RefCell::new(None) };

    static JS_APP: RefCell<Option<JsApp<wintercg::WinterCGRequestHandler<wintercg::Initialized>>>> = const { RefCell::new(None) };
}

pub const WIZENING_STATE_NONE: u8 = 0; // WinterJS is running standalone with no wizening whatsoever
pub const WIZENING_STATE_WIZENING: u8 = 1; // WinterJS is currently being wizened
pub const WIZENING_STATE_WIZENED: u8 = 2; // WinterJS was wizened before and is now resuming

pub static WIZENING_STATE: AtomicU8 = AtomicU8::new(WIZENING_STATE_NONE);

wizex_macros::WIZEX_INIT!(crate::wizened_mode::initialize);

// TODO: reduce duplication between this file and standalone_mode.rs

fn initialize() {
    fn build_runner(
        handler: impl NewRequestHandler,
        user_code: &UserCode,
    ) -> (
        BoxedDynRunner,
        Pin<Box<dyn runners::inline::InlineRunnerRequestHandlerFuture>>,
    ) {
        let js_app =
            JsApp::build_specialized(handler, 1, user_code).expect("Failed to evaluate script");
        let (runner, future) = runners::inline::InlineRunner::new_request_handler(js_app);
        (Box::new(runner), Box::pin(future))
    }

    WIZENING_STATE.store(
        WIZENING_STATE_WIZENING,
        std::sync::atomic::Ordering::Relaxed,
    );

    runtime::config::CONFIG
        .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
        .unwrap();

    let file_name = "/app/simple.js"; // TODO
    let mode = HandlerName::WinterCG; // TODO
    let user_code = UserCode::from_path(std::path::Path::new(file_name), true)
        .expect("Failed to read user code");

    // RUNNER.with_borrow_mut(|runner| {
    //     runner.replace(match mode {
    //         HandlerName::Cloudflare => build_runner(cloudflare::new_handler(), &user_code),
    //         HandlerName::WinterCG => build_runner(wintercg::new_handler(), &user_code),
    //     })
    // });

    JS_APP.with_borrow_mut(|js_app| {
        js_app.replace(
            JsApp::build_specialized(wintercg::new_handler(), 1, &user_code)
                .expect("Failed to evaluate script"),
        );
    });

    WIZENING_STATE.store(WIZENING_STATE_WIZENED, std::sync::atomic::Ordering::Relaxed);
}

// Called by main when WIZENING_STATE is equal to WIZENING_STATE_WIZENED
pub fn run_wizened() -> anyhow::Result<()> {
    let Some(mut js_app) = JS_APP.with_borrow_mut(|js_app| js_app.take()) else {
        panic!("XXX");
    };

    let (parts, body) = hyper::Request::<hyper::Body>::new(hyper::Body::empty()).into_parts();

    js_app
        .request_handler
        .start_handling_request(js_app.cx().duplicate(), Request { parts, body })
        .context("xxx")
        .unwrap();

    let _ = js_app.rt().run_event_loop();

    Ok(())

    // let Some((runner, runner_future)) = RUNNER.with_borrow_mut(|runner| runner.take()) else {
    //     panic!("There is no pre-initialized runner");
    // };

    // let args = match Args::try_parse() {
    //     Ok(a) => a,
    //     Err(e) => {
    //         // Fall back to parsing the serve command for backwards compatibility.

    //         match CmdServe::try_parse_from(std::env::args_os()) {
    //             Ok(a) => Args { cmd: Cmd::Serve(a) },
    //             Err(_) => {
    //                 // Neither the main args nor the serve command args could be parsed.
    //                 // Report the original error for full help.
    //                 e.exit();
    //             }
    //         }
    //     }
    // };

    // let Cmd::Serve(cmd) = args.cmd;

    // let interface = cmd
    //     .ip
    //     .unwrap_or_else(|| std::net::Ipv4Addr::UNSPECIFIED.into());

    // let port = cmd.port.unwrap_or(8080);

    // let addr: SocketAddr = (interface, port).into();
    // let config = crate::server::ServerConfig { addr };

    // // The server code needs a signal receiver, but we don't ever actually use it under WASIX
    // let (_tx, rx) = tokio::sync::oneshot::channel();

    // tokio::runtime::Builder::new_current_thread()
    //     .enable_all()
    //     .build()
    //     .expect("Failed building the Runtime")
    //     .block_on(async move {
    //         let local_set = LocalSet::new();
    //         local_set
    //             .run_until(async move {
    //                 let server_future = crate::server::run_server(config, runner, rx);
    //                 let (result, ()) = join!(server_future, runner_future);
    //                 result
    //             })
    //             .await
    //     })
}

#[derive(clap::Parser, Debug)]
#[clap(version)]
struct Args {
    #[clap(subcommand)]
    cmd: Cmd,
}

/// Available commands.
#[derive(clap::Subcommand, Debug)]
enum Cmd {
    Serve(CmdServe),
}

/// Start a WinterJS webserver serving the given JS app.
#[derive(clap::Parser, Debug)]
struct CmdServe {
    /// The port to listen on.
    #[clap(short, long, env = "WINTERJS_PORT")]
    port: Option<u16>,

    /// The interface to listen on.
    /// Defaults to 127.0.0.1
    #[clap(long, default_value = "127.0.0.1", env = "WINTERJS_IP")]
    ip: Option<IpAddr>,

    /// The operating mode of the server. Defaults to WinterCG mode if left
    /// out.
    #[clap(short = 'H', long, env = "WINTERJS_MODE")]
    mode: Option<HandlerName>,
}
