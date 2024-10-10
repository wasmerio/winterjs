/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use clap::ValueEnum;

#[macro_use]
extern crate ion_proc;

mod builtins;
mod js_app;
mod request_handlers;
mod runners;
mod server;
mod sm_utils;
#[cfg(feature = "weval")]
mod specialized_mode;
#[cfg(not(feature = "weval"))]
mod standalone_mode;
mod tokio_utils;

#[derive(Debug, Clone, ValueEnum)]
pub enum HandlerName {
    WinterCG,
    Cloudflare,
}

fn main() {
    let _log_guard = build_logging_subscriber(true);

    #[cfg(not(feature = "weval"))]
    {
        if let Err(e) = standalone_mode::run_standalone() {
            tracing::error!(?e);
            std::process::exit(-1);
        }
    }

    #[cfg(feature = "weval")]
    {
        tracing::info!("Initializing");
        if let Err(e) = specialized_mode::initialize() {
            tracing::error!(?e);
            std::process::exit(-1);
        }

        wizex_api::finalize_init();

        if let Err(e) = specialized_mode::run_specialized() {
            tracing::error!(?e);
            std::process::exit(-1);
        }
    }
}

fn build_logging_subscriber(color: bool) -> tracing::subscriber::DefaultGuard {
    use std::io::IsTerminal;

    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "winterjs=info,warn");
    }

    let subscriber = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .with_target(true)
        .with_ansi(std::io::stdout().is_terminal() && color)
        .with_writer(std::io::stdout)
        .compact()
        .finish();

    tracing::subscriber::set_default(subscriber)
}
