/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

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

mod error;
mod run;
mod server;

fn main() {
    let user_code = r#"
        let x = performance.now();
        console.log(x);
    "#;
    run::run_code(user_code).expect("could not execute Javascript code");
}
