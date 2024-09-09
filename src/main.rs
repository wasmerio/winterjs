/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use clap::ValueEnum;

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
mod js_app;
mod request_handlers;
mod runners;
mod server;
mod sm_utils;
mod standalone_mode;
#[cfg(feature = "weval")]
mod wizened_mode;

#[derive(Debug, Clone, ValueEnum)]
pub enum HandlerName {
    WinterCG,
    Cloudflare,
}

fn main() {
    // Initialize logging.
    if std::env::var("RUST_LOG").is_err() {
        // Set default log level.
        std::env::set_var("RUST_LOG", "winterjs=info,warn");
    }
    tracing_subscriber::fmt::init();

    #[cfg(not(feature = "weval"))]
    if let Err(e) = standalone_mode::run_standalone() {
        tracing::error!(?e);
        std::process::exit(-1);
    }

    #[cfg(feature = "weval")]
    match wizened_mode::WIZENING_STATE.load(std::sync::atomic::Ordering::Relaxed) {
        wizened_mode::WIZENING_STATE_NONE => {
            tracing::info!("Starting in standalone mode");
            if let Err(e) = standalone_mode::run_standalone() {
                tracing::error!(?e);
                std::process::exit(-1);
            }
        }

        wizened_mode::WIZENING_STATE_WIZENED => {
            tracing::info!("Starting from pre-initialized state");
            if let Err(e) = wizened_mode::run_wizened() {
                tracing::error!(?e);
                std::process::exit(-1);
            }
        }

        state => {
            tracing::error!(state, "Invalid wizening state, cannot execute");
            std::process::exit(-1);
        }
    }
}
