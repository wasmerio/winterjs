/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::{
    net::{IpAddr, SocketAddr},
    path::PathBuf,
};

use anyhow::Context as _;
use clap::Parser;

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

mod ion_runner;
mod server;

#[tokio::main]
async fn main() {
    run().await.unwrap();
}

async fn run() -> Result<(), anyhow::Error> {
    // Initialize logging.
    if std::env::var("RUST_LOG").is_err() {
        // Set default log level.
        std::env::set_var("RUST_LOG", "wasmer_winter=info,warn");
    }
    tracing_subscriber::fmt::init();

    let args = match Args::try_parse() {
        Ok(a) => a,
        Err(err1) => {
            // Fall back to parsing the serve command for backwards compatibility.

            match CmdServe::try_parse_from(&mut std::env::args_os()) {
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
        Cmd::Serve(cmd) => {
            let code = std::fs::read_to_string(&cmd.js_path).with_context(|| {
                format!(
                    "Could not read Javascript file at '{}'",
                    cmd.js_path.display()
                )
            })?;

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

            runtime::config::CONFIG
                .set(runtime::config::Config::default().log_level(runtime::config::LogLevel::Error))
                .unwrap();

            if cmd.watch {
                let runner = ion_runner::WatchRunner::new(cmd.js_path.clone(), cmd.max_js_threads);
                crate::server::run_server(config, runner).await
            } else {
                let runner = ion_runner::IonRunner::new_request_handler(cmd.max_js_threads, code);
                crate::server::run_server(config, runner).await
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

    /// Watch the Javascript file for changes and automatically reload.
    #[clap(short, long, env = "WINTERJS_WATCH")]
    watch: bool,

    /// Path to a Javascript file to serve.
    #[clap(env = "JS_PATH")]
    js_path: PathBuf,
}
