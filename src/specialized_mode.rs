use std::{
    cell::RefCell,
    net::{IpAddr, Ipv4Addr, SocketAddr, SocketAddrV4},
    path::PathBuf,
    pin::Pin,
    sync::atomic::AtomicU8,
};

use anyhow::Context;
use clap::Parser;
use tokio::{join, select};

use crate::{
    js_app::JsApp,
    request_handlers::{cloudflare, wintercg, NewRequestHandler, UserCode},
    runners::{self, BoxedDynRunner, Runner},
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
        crate::tokio_utils::run_in_single_thread_runtime(
            js_app.warmup(), // async move { anyhow::Ok(()) },
        )
        .expect("Script failed to initialize");
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

    println!(
        "Specializing with code at path {:?} in {:?} mode",
        cmd.js_path, mode
    );

    let user_code = UserCode::from_path(std::path::Path::new(&cmd.js_path), cmd.script)
        .expect("Failed to read user code");

    RUNNER.with_borrow_mut(|runner_global| {
        let (runner, mut runner_future) = match mode {
            HandlerName::Cloudflare => build_runner(cloudflare::new_handler(), &user_code),
            HandlerName::WinterCG => build_runner(wintercg::new_handler(), &user_code),
        };
        // if !cmd.warmup_urls.is_empty() {
        //     run_warmup_requests(runner.as_ref(), &mut runner_future, &cmd.warmup_urls);
        // }
        runner_global.replace((runner, runner_future))
    });

    SPECIALIZATION_STATE.store(
        SPECIALIZATION_STATE_SPECIALIZED,
        std::sync::atomic::Ordering::Relaxed,
    );
}

fn run_warmup_requests(
    runner: &dyn Runner,
    runner_future: &mut Pin<Box<dyn runners::inline::InlineRunnerRequestHandlerFuture>>,
    warmup_urls: &Vec<String>,
) {
    crate::tokio_utils::run_in_single_thread_runtime(async move {
        for url in warmup_urls {
            println!("Running warm-up request with URL '{}' ...", url);

            let (parts, body) = hyper::Request::builder()
                .uri(url)
                .body(hyper::Body::empty())
                .context("Failed to build request")
                .unwrap()
                .into_parts();

            let request_future = runner.handle(
                SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::LOCALHOST, 80)),
                parts,
                body,
            );

            select! {
                response = request_future => {
                    if response.status().is_client_error() || response.status().is_server_error() {
                        panic!("Got error response {} from warmup URL", response.status())
                    }
                    println!("OK");
                }
                _ = &mut *runner_future => {
                    panic!("Request handler exited unexpectedly")
                }
            }
        }
    })
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

    crate::tokio_utils::run_in_single_thread_runtime(async move {
        let server_future = crate::server::run_server(config, runner, rx);
        let (result, ()) = join!(server_future, runner_future);
        result
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

    /// Run in script mode. If this flag is not specified, the JS file will
    /// be loaded in module mode instead.
    #[clap(short, long, env = "WINTERJS_SCRIPT")]
    script: bool,

    /// The operating mode of the server. Defaults to WinterCG mode if left
    /// out.
    #[clap(short = 'H', long, env = "WINTERJS_MODE")]
    mode: Option<HandlerName>,

    /// A list of URLs to make requests to during specialization. Can be used
    /// to pre-populate global state of JS code.
    /// To gain the maximum possible performance, make sure all dynamically
    /// imported modules are encountered at least once when these requests
    /// are handled. Modules encountered at runtime will be interpreted and
    /// run more slowly than specialized code.
    #[clap(short = 'W', long = "warmup-url", env = "WINTERJS_WARMUP_URL")]
    warmup_urls: Vec<String>,
}
