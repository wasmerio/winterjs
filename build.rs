/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::env;
use std::path::PathBuf;
use std::ffi::{OsStr, OsString};
use std::process::{Command, Stdio};


fn find_make() -> OsString {
    if let Some(make) = env::var_os("MAKE") {
        make
    } else {
        match Command::new("gmake").status() {
            Ok(_) => OsStr::new("gmake").to_os_string(),
            Err(_) => OsStr::new("make").to_os_string(),
        }
    }
}

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let target = env::var("TARGET").unwrap();
    let mut make = find_make();
    // Put MOZTOOLS_PATH at the beginning of PATH if specified
    if let Some(moztools) = env::var_os("MOZTOOLS_PATH") {
        let path = env::var_os("PATH").unwrap();
        let moztools_str = moztools.into_string().unwrap();
        let mut paths = env::split_paths(&path).collect::<Vec<_>>();
        paths.insert(0, PathBuf::from(moztools_str.clone()));
        let new_path = env::join_paths(paths).unwrap();
        env::set_var("PATH", &new_path);
        make = OsStr::new("mozmake").to_os_string();
    }

    let mut cmd = Command::new(make);

    // We're using the MSYS make which doesn't work with the mingw32-make-style
    // MAKEFLAGS, so remove that from the env if present.
    if cfg!(windows) {
        cmd.env_remove("MAKEFLAGS").env_remove("MFLAGS");
    } else if let Some(makeflags) = env::var_os("CARGO_MAKEFLAGS") {
        cmd.env("MAKEFLAGS", makeflags);
    }

    let result = cmd.args(&["-R", "-f", "makefile.cargo"])
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .expect("Failed to run `make`");

    assert!(result.success());
    println!("cargo:rustc-link-search=native={}/js/src", out_dir);
    println!("cargo:rustc-link-lib=static=js_static"); // Must come before c++
    if target.contains("windows") {
        println!("cargo:rustc-link-lib=winmm");
        println!("cargo:rustc-link-lib=psapi");
        if target.contains("gnu") {
            println!("cargo:rustc-link-lib=stdc++");
        }
    } else if target.contains("apple") || target.contains("freebsd") {
        println!("cargo:rustc-link-lib=c++");
    } else {
        println!("cargo:rustc-link-lib=stdc++");
    }
    println!("cargo:outdir={}", out_dir);
}
