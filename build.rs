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

    let result = Command::new(make)
        .args(&["-R", "-f", "makefile.cargo"])
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .unwrap();
    assert!(result.success());
    println!("cargo:rustc-link-search=native={}/js/src", out_dir);
    if target.contains("windows") {
        println!("cargo:rustc-link-lib=winmm");
        println!("cargo:rustc-link-lib=psapi");
        if target.contains("gnu") {
            println!("cargo:rustc-link-lib=stdc++");
        }
    } else {
        println!("cargo:rustc-link-lib=stdc++");
    }
    println!("cargo:rustc-link-lib=static=js_static");
    println!("cargo:outdir={}", out_dir);
}
