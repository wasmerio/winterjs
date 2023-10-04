/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

use anyhow::{bail, Context};

macro_rules! fail_msg {
    ($cx:expr, $msg:expr) => {
        $crate::run::report_js_error($cx, $msg);
        return false;
    };
}

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
mod run;
mod server;

#[tokio::main]
async fn main() {
    run().await.unwrap();
}

async fn run() -> Result<(), anyhow::Error> {
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "wasmer_winter=info,warn");
    }

    tracing_subscriber::fmt::init();

    tracing::info!("starting webserver");

    let _handle = &crate::run::ENGINE;

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

    crate::server::run_server(code).await
}
