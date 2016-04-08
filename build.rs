/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::env;
use std::process::{Command, Stdio};

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let target = env::var("TARGET").unwrap();
    let result = Command::new("make")
        .args(&["-R", "-f", "makefile.cargo"])
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .unwrap();
    assert!(result.success());
    println!("cargo:rustc-link-search=native={}/mozglue/build", out_dir);
    println!("cargo:rustc-link-search=native={}/js/src", out_dir);
    println!("cargo:rustc-link-lib=static=mozglue");
    println!("cargo:rustc-link-lib=static=js_static");
    if target.contains("windows") {
        println!("cargo:rustc-link-lib=winmm");
        println!("cargo:rustc-link-lib=psapi");
    }
    println!("cargo:rustc-link-lib=stdc++");
    println!("cargo:outdir={}", out_dir);
}
