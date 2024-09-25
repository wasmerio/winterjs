use std::{
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    pin::Pin,
};

#[cfg(not(target_os = "wasi"))]
use std::time::Duration;

use anyhow::Context as _;
use clap::Parser;
use tokio::join;

use crate::{
    js_app::JsApp,
    request_handlers::{cloudflare, wintercg, Either, NewRequestHandler, UserCode},
    runners::{self, BoxedDynRunner},
    HandlerName,
};

pub fn run_standalone() -> anyhow::Result<()> {
    let args = match Args::try_parse() {
        Ok(a) => a,
        Err(err1) => {
            // Fall back to parsing the serve command for backwards compatibility.

            match CmdServe::try_parse_from(std::env::args_os()) {
                Ok(a) => Args { cmd: Cmd::Serve(a) },
                Err(_) => {
                    // Neither the main args nor the serve command args could be parsed.
                    // Report the original error for full help.
                    err1.exit();
                }
            }
        }
    };

    match args.cmd {
        Cmd::Exec(cmd) => {
            runtime::config::CONFIG
                .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
                .unwrap();

            runners::exec::exec_script(cmd.js_path, cmd.script)
        }

        Cmd::Serve(cmd) => {
            let interface = cmd
                .ip
                .unwrap_or_else(|| std::net::Ipv4Addr::UNSPECIFIED.into());

            let port = cmd.port.unwrap_or(8080);

            let addr: SocketAddr = (interface, port).into();
            let config = crate::server::ServerConfig { addr };

            runtime::config::CONFIG
                .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
                .unwrap();

            let user_code = UserCode::from_path(&cmd.js_path, cmd.script)?;
            let mode = match cmd.mode {
                Some(m) => m,
                None => HandlerName::WinterCG,
            };

            tracing::info!("Starting in {mode:?} mode");

            let runner: Either<
                BoxedDynRunner,
                (
                    BoxedDynRunner,
                    Pin<Box<dyn runners::inline::InlineRunnerRequestHandlerFuture>>,
                ),
            > = if cmd.single_threaded {
                fn build_runner(
                    handler: impl NewRequestHandler,
                    user_code: &UserCode,
                ) -> anyhow::Result<(
                    BoxedDynRunner,
                    Pin<Box<dyn runners::inline::InlineRunnerRequestHandlerFuture>>,
                )> {
                    let js_app =
                        JsApp::build(handler, 1, user_code).context("Failed to evaluate script")?;
                    crate::tokio_utils::run_in_single_thread_runtime(js_app.warmup())
                        .context("Script failed to initialize")?;
                    let (runner, future) =
                        runners::inline::InlineRunner::new_request_handler(js_app);
                    Ok((Box::new(runner), Box::pin(future)))
                }
                Either::Right(match mode {
                    HandlerName::Cloudflare => build_runner(cloudflare::new_handler(), &user_code)?,
                    HandlerName::WinterCG => build_runner(wintercg::new_handler(), &user_code)?,
                })
            } else {
                Either::Left(match mode {
                    HandlerName::Cloudflare => {
                        Box::new(runners::single::SingleRunner::new_request_handler(
                            cmd.max_js_threads,
                            cloudflare::new_handler(),
                            user_code,
                        ))
                    }
                    HandlerName::WinterCG => {
                        Box::new(runners::single::SingleRunner::new_request_handler(
                            cmd.max_js_threads,
                            wintercg::new_handler(),
                            user_code,
                        ))
                    }
                })
            };

            #[cfg_attr(target_os = "wasi", allow(unused))]
            let (tx, rx) = tokio::sync::oneshot::channel();

            // There are two main points to consider here:
            // * ctrlc is not available on WASIX and signal handling in
            //   general is not stable and fully wired up yet.
            // * When running under WASIX, we expect 99% of usage to be
            //   either local development or running on Wasmer Edge.
            //   Wasmer Edge already keeps instances alive while they're
            //   processing a request, and dropping requests during local
            //   development isn't likely to cause problems.
            // Given the two points above, clean shutdown is implemented
            // for native builds only.
            #[cfg(not(target_os = "wasi"))]
            {
                let timeout = cmd
                    .shutdown_timeout
                    .map(Duration::from_secs)
                    .unwrap_or_else(|| Duration::from_secs(60));
                let timeout = if timeout.is_zero() {
                    None
                } else {
                    Some(timeout)
                };

                let runner_clone = match runner {
                    Either::Left(ref r) => Either::Left(r.clone()),
                    Either::Right((ref r, _)) => Either::Right(r.clone()),
                };
                let mut shutdown_future = Some(async move {
                    match runner_clone {
                        Either::Left(r) => r.shutdown(timeout).await,
                        Either::Right(r) => r.shutdown(timeout).await,
                    }
                    _ = tx.send(());
                });
                ctrlc::set_handler(move || {
                    if let Some(f) = shutdown_future.take() {
                        tokio::runtime::Builder::new_current_thread()
                            .enable_all()
                            .build()
                            .unwrap()
                            .block_on(f);
                    }
                })
                .expect("Failed to set Ctrl-C handler");
            }

            match runner {
                Either::Left(runner) => tokio::runtime::Builder::new_multi_thread()
                    .enable_all()
                    .build()
                    .expect("Failed building the Runtime")
                    .block_on(crate::server::run_server(config, runner, rx)),
                Either::Right((runner, runner_future)) => {
                    crate::tokio_utils::run_in_single_thread_runtime(async move {
                        let server_future = crate::server::run_server(config, runner, rx);
                        let (result, ()) = join!(server_future, runner_future);
                        result
                    })
                }
            }
        }
    }
}

/// winterjs CLI
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
    Exec(CmdExec),
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

    /// Maximum amount of Javascript worker threads to spawn.
    #[clap(long, default_value = "16", env = "WINTERJS_MAX_JS_THREADS")]
    max_js_threads: usize,

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

    /// If this flag is specified, WinterJS will run in single-threaded mode,
    /// using only the main thread.
    #[clap(long, env = "WINTERJS_SINGLE_THREADED")]
    single_threaded: bool,

    #[cfg(not(target_os = "wasi"))]
    /// Clean shutdown timeout, i.e. how long to wait before forcefully
    /// terminating request handler threads after Ctrl+C is pressed, in
    /// seconds. Pass in zero to disable the timeout. Defaults to 60
    /// seconds.
    #[clap(short = 't', long, env = "WINTERJS_SHUTDOWN_TIMEOUT")]
    shutdown_timeout: Option<u64>,
}

/// Execute a JS file directly and exit. This is useful for cron jobs, etc.
#[derive(clap::Parser, Debug)]
struct CmdExec {
    /// Path to a Javascript file to serve.
    #[clap(env = "WINTERJS_PATH")]
    js_path: PathBuf,

    /// Run in script mode. If this flag is not specified, the JS file will
    /// be loaded in module mode instead.
    #[clap(short, long, env = "WINTERJS_SCRIPT")]
    script: bool,
}
