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
    println!("cargo:rustc-link-search=native={}/dist/lib", out_dir);
    if target.contains("windows") {
        // On Windows, because dynamic libs and static libs end up
        // with different symbols for the import, we have to build
        // with the shared mozjs DLL.
        println!("cargo:rustc-link-lib=mozjs");
    } else {
        println!("cargo:rustc-link-lib=static=js_static");
    }
    println!("cargo:rustc-link-lib=stdc++");
    println!("cargo:outdir={}", out_dir);
}
