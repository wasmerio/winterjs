/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::{
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    time::Duration,
};

use anyhow::Context as _;
use clap::{Parser, ValueEnum};
use request_handlers::{
    cloudflare::CloudflareRequestHandler, wintercg::WinterCGRequestHandler, UserCode,
};

#[cfg(not(target_os = "wasi"))]
use server::Runner;

#[macro_use]
extern crate ion_proc;

#[allow(unused_macros)]
macro_rules! fail_msg {
    ($cx:expr, $msg:expr) => {
        $crate::run::report_js_error($cx, $msg);
        return false;
    };
}

#[allow(unused_macros)]
macro_rules! js_try {
    ($cx:expr, $expr:expr) => {
        match $expr {
            Ok(v) => v,
            Err(e) => {
                let msg = e.to_string();
                $crate::run::report_js_error($cx, msg);
                return false;
            }
        }
    };
}

mod builtins;
mod request_handlers;
mod runners;
mod server;
mod sm_utils;

#[tokio::main]
async fn main() {
    if let Err(e) = run().await {
        println!("{e:?}");
    }
}

async fn run() -> Result<(), anyhow::Error> {
    // Initialize logging.
    if std::env::var("RUST_LOG").is_err() {
        // Set default log level.
        std::env::set_var("RUST_LOG", "winterjs=info,warn");
    }
    tracing_subscriber::fmt::init();

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
            let interface = if let Some(iface) = cmd.ip {
                iface
            } else if let Ok(value) = std::env::var("LISTEN_IP") {
                value
                    .parse()
                    .context(format!("Invalid interface in LISTEN_IP:  '{value}'"))?
            } else {
                std::net::Ipv4Addr::UNSPECIFIED.into()
            };

            let port = if let Some(port) = cmd.port {
                port
            } else if let Ok(value) = std::env::var("PORT") {
                value
                    .parse()
                    .context(format!("Invalid port in PORT:  '{value}'"))?
            } else {
                8080
            };

            let addr: SocketAddr = (interface, port).into();
            let config = crate::server::ServerConfig { addr };

            let user_code = UserCode::from_path(&cmd.js_path, cmd.script).await?;

            let runner: Box<dyn Runner + Send + Sync> = match cmd.mode {
                Some(HandlerName::Cloudflare) => {
                    tracing::info!("Starting in Cloudflare mode");
                    Box::new(runners::single::SingleRunner::new_request_handler(
                        CloudflareRequestHandler,
                        cmd.max_js_threads,
                        user_code,
                    ))
                }
                Some(HandlerName::WinterCG) | None => {
                    tracing::info!("Starting in WinterCG mode");
                    Box::new(runners::single::SingleRunner::new_request_handler(
                        WinterCGRequestHandler,
                        cmd.max_js_threads,
                        user_code,
                    ))
                }
            };

            runtime::config::CONFIG
                .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
                .unwrap();

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

                let runner_clone = runner.clone();
                let mut shutdown_future = Some(async move {
                    runner_clone.shutdown(timeout).await;
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

            crate::server::run_server(config, runner, rx).await
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

    // /// Watch the Javascript file for changes and automatically reload.
    // #[clap(short, long, env = "WINTERJS_WATCH")]
    // watch: bool,
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

#[derive(Debug, Clone, ValueEnum)]
pub enum HandlerName {
    WinterCG,
    Cloudflare,
}
