use std::{
    cell::RefCell,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    pin::Pin,
    sync::atomic::AtomicU8,
};

use anyhow::Context;
use clap::Parser;
use tokio::{join, task::LocalSet};

use crate::{
    js_app::JsApp,
    request_handlers::{cloudflare, wintercg, NewRequestHandler, UserCode},
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
}

pub const SPECIALIZATION_STATE_NONE: u8 = 0; // WinterJS is running standalone with no specialization whatsoever
pub const SPECIALIZATION_STATE_SPECIALIZING: u8 = 1; // WinterJS is currently being specialized
pub const SPECIALIZATION_STATE_SPECIALIZED: u8 = 2; // WinterJS was specialized before and is now resuming

pub static SPECIALIZATION_STATE: AtomicU8 = AtomicU8::new(SPECIALIZATION_STATE_NONE);

wizex_macros::WIZEX_INIT!(crate::specialized_mode::initialize);

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

    SPECIALIZATION_STATE.store(
        SPECIALIZATION_STATE_SPECIALIZING,
        std::sync::atomic::Ordering::Relaxed,
    );

    // Args are separated by newline instead of the usual quoting that shells do. This is
    // meant to simplify parsing and prevent odd edge cases where WinterJS doesn't parse
    // exactly like a shell does.
    let input = std::iter::once(std::ffi::OsString::from("winterjs")).chain(
        std::io::stdin()
            .lines()
            .map(|l| std::ffi::OsString::from(l.context("Failed to read from stdin").unwrap())),
    );

    let cmd = CmdSpecialize::parse_from(input);

    runtime::config::CONFIG
        .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
        .unwrap();

    let mode = match cmd.mode {
        Some(m) => m,
        None => HandlerName::WinterCG,
    };

    tracing::info!(
        "Specializing with code at path '{:?}' in {:?} mode",
        cmd.js_path,
        mode
    );

    let user_code = UserCode::from_path(std::path::Path::new(&cmd.js_path), true)
        .expect("Failed to read user code");

    RUNNER.with_borrow_mut(|runner| {
        runner.replace(match mode {
            HandlerName::Cloudflare => build_runner(cloudflare::new_handler(), &user_code),
            HandlerName::WinterCG => build_runner(wintercg::new_handler(), &user_code),
        })
    });

    SPECIALIZATION_STATE.store(
        SPECIALIZATION_STATE_SPECIALIZED,
        std::sync::atomic::Ordering::Relaxed,
    );
}

// Called by main when SPECIALIZATION_STATE is equal to SPECIALIZATION_STATE_SPECIALIZED
pub fn run_specialized() -> anyhow::Result<()> {
    let Some((runner, runner_future)) = RUNNER.with_borrow_mut(|runner| runner.take()) else {
        panic!("There is no pre-initialized runner");
    };

    let args = match Args::try_parse() {
        Ok(a) => a,
        Err(e) => {
            // Fall back to parsing the serve command for backwards compatibility.

            match CmdServe::try_parse_from(std::env::args_os()) {
                Ok(a) => Args { cmd: Cmd::Serve(a) },
                Err(_) => {
                    // Neither the main args nor the serve command args could be parsed.
                    // Report the original error for full help.
                    e.exit();
                }
            }
        }
    };

    let Cmd::Serve(cmd) = args.cmd;

    let interface = cmd
        .ip
        .unwrap_or_else(|| std::net::Ipv4Addr::UNSPECIFIED.into());

    let port = cmd.port.unwrap_or(8080);

    let addr: SocketAddr = (interface, port).into();
    let config = crate::server::ServerConfig { addr };

    // The server code needs a signal receiver, but we don't ever actually use it under WASIX
    let (_tx, rx) = tokio::sync::oneshot::channel();

    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .expect("Failed building the Runtime")
        .block_on(async move {
            let local_set = LocalSet::new();
            local_set
                .run_until(async move {
                    let server_future = crate::server::run_server(config, runner, rx);
                    let (result, ()) = join!(server_future, runner_future);
                    result
                })
                .await
        })
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

#[derive(clap::Parser, Debug)]
struct CmdSpecialize {
    /// Path to a Javascript file to serve.
    #[clap(env = "WINTERJS_PATH")]
    js_path: PathBuf,

    /// The operating mode of the server. Defaults to WinterCG mode if left
    /// out.
    #[clap(short = 'H', long, env = "WINTERJS_MODE")]
    mode: Option<HandlerName>,
}
