use std::{
    cell::RefCell,
    net::{IpAddr, Ipv4Addr, SocketAddr, SocketAddrV4},
    path::PathBuf,
    sync::atomic::AtomicU8,
};

use anyhow::Context;
use clap::Parser;
use tokio::{join, select};

use crate::{
    js_app::JsApp,
    request_handlers::{cloudflare, wintercg, UserCode},
    runners::{self, inline::InlineRunner, Runner},
    sm_utils::error_report_option_to_anyhow_error,
    HandlerName,
};

thread_local! {
    #[allow(clippy::type_complexity)]
    static JS_APP: RefCell<Option<JsApp>> = const { RefCell::new(None) };
}

pub const SPECIALIZATION_STATE_NONE: u8 = 0; // WinterJS is running standalone with no specialization whatsoever
pub const SPECIALIZATION_STATE_SPECIALIZING: u8 = 1; // WinterJS is currently being specialized
pub const SPECIALIZATION_STATE_SPECIALIZED: u8 = 2; // WinterJS was specialized before and is now resuming

pub static SPECIALIZATION_STATE: AtomicU8 = AtomicU8::new(SPECIALIZATION_STATE_NONE);

// TODO: reduce duplication between this file and standalone_mode.rs

pub fn initialize() -> anyhow::Result<()> {
    // Create a scoped subscriber without setting the default, which will interfere with
    // the initialization logic in main()
    let _log_guard = super::build_logging_subscriber(false);

    SPECIALIZATION_STATE.store(
        SPECIALIZATION_STATE_SPECIALIZING,
        std::sync::atomic::Ordering::Relaxed,
    );

    // Args are separated by newline instead of the usual quoting that shells do. This is
    // meant to simplify parsing and prevent odd edge cases where WinterJS doesn't parse
    // exactly like a shell does.
    let input = std::iter::once(Ok(std::ffi::OsString::from("winterjs")))
        .chain(std::io::stdin().lines().map(|l| {
            Ok(std::ffi::OsString::from(
                l.context("Failed to read from stdin")?,
            ))
        }))
        .collect::<anyhow::Result<Vec<_>>>()?;

    let cmd = CmdSpecialize::parse_from(input);

    runtime::config::CONFIG
        .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
        .unwrap();

    let mode = match cmd.mode {
        Some(m) => m,
        None => HandlerName::WinterCG,
    };

    tracing::info!(
        "Specializing with code at path {:?} in {:?} mode",
        cmd.js_path,
        mode
    );

    let user_code = UserCode::from_path(std::path::Path::new(&cmd.js_path), cmd.script)
        .expect("Failed to read user code");

    JS_APP.with_borrow_mut(|js_app| {
        let app = match mode {
            HandlerName::Cloudflare => {
                JsApp::build_specialized(cloudflare::new_handler(), 1, &user_code)
            }
            HandlerName::WinterCG => {
                JsApp::build_specialized(wintercg::new_handler(), 1, &user_code)
            }
        }
        .context("Failed to evaluate script")?;

        let app_clone = app.clone();
        crate::tokio_utils::run_in_single_thread_runtime(async move {
            app_clone
                .warmup()
                .await
                .context("Script failed to initialize")?;
            if !cmd.warmup_urls.is_empty() {
                run_warmup_requests(&app_clone, &cmd.warmup_urls).await;
            }

            // Remove the SF runtime from the current tokio runtime, so
            // we can later install it in a new runtime at resume time
            app_clone.rt().remove_from_tokio_runtime();

            anyhow::Ok(())
        })?;

        js_app.replace(app);

        anyhow::Ok(())
    })?;

    SPECIALIZATION_STATE.store(
        SPECIALIZATION_STATE_SPECIALIZED,
        std::sync::atomic::Ordering::Relaxed,
    );

    Ok(())
}

async fn run_warmup_requests(js_app: &JsApp, warmup_urls: &Vec<String>) {
    let (runner, runner_future) = InlineRunner::new_request_handler(js_app.clone());
    let mut runner_future = Box::pin(runner_future);

    for url in warmup_urls {
        tracing::info!("Running warm-up request with URL '{}' ...", url);

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
                tracing::info!("OK");
            }
            _ = &mut runner_future => {
                panic!("Request handler exited unexpectedly")
            }
        }
    }

    join!(runner.shutdown(None), runner_future);

    js_app
        .rt()
        .run_event_loop()
        .await
        .map_err(|e| error_report_option_to_anyhow_error(js_app.cx(), e))
        .expect("Failed to flush event loop");

    if !js_app.rt().event_loop_is_empty() {
        panic!("Internal error: event loop should be empty after warmup requests are sent");
    }
}

// Called by main when SPECIALIZATION_STATE is equal to SPECIALIZATION_STATE_SPECIALIZED
pub fn run_specialized() -> anyhow::Result<()> {
    crate::tokio_utils::run_in_single_thread_runtime(async move {
        let Some(js_app) = JS_APP.with_borrow_mut(Option::take) else {
            panic!("There is no pre-initialized app");
        };

        js_app.rt().install_in_tokio_runtime();

        let (runner, runner_future) = runners::inline::InlineRunner::new_request_handler(js_app);

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

        let server_future = crate::server::run_server(config, Box::new(runner), rx);
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
