/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use anyhow::{bail, Context};
use runtime::config::Config;

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
#[cfg(feature = "client-fetch")]
mod client_fetch;
mod error;
mod fetch;
mod ion_runner;
mod run;
mod server;

#[tokio::main]
async fn main() {
    run().await.unwrap();
}

async fn run() -> Result<(), anyhow::Error> {
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "wasmer_jassy=info,warn");
    }

    tracing_subscriber::fmt::init();

    tracing::info!("starting webserver");

    let code = if let Ok(v) = std::env::var("JS_CODE") {
        v
    } else {
        let mut args = std::env::args().skip(1);

        let path = if let Some(p) = args.next() {
            p
        } else if let Ok(v) = std::env::var("JS_PATH") {
            v
        } else {
            bail!("No path to JS file provided: either pass it as the first argument or set the JS_PATH environment variable");
        };

        std::fs::read_to_string(&path)
            .with_context(|| format!("Could not read js file at '{}'", path))?
    };

    runtime::config::CONFIG
        .set(Config::default().log_level(runtime::config::LogLevel::Error))
        .unwrap();
    crate::server::run_server(code, ion_runner::IonRunner).await
}
