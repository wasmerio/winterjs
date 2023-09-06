/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::env;
use std::path::PathBuf;

fn main() {
    let mut build = cc::Build::new();
    let outdir = env::var("DEP_MOZJS_OUTDIR").unwrap();
    let include_path: PathBuf = [&outdir, "dist", "include"].iter().collect();

    build
        .cpp(true)
        .file("src/jsglue.cpp")
        .flag("-DSTATIC_JS_API")
        .include(include_path);
    if env::var("CARGO_FEATURE_DEBUGMOZJS").is_ok() {
        build.define("DEBUG", "");

        if cfg!(target_os = "windows") {
            build.flag("-Od");
        } else {
            build.flag("-g");
            build.flag("-O0");
        }
    }

    if env::var("CARGO_FEATURE_PROFILEMOZJS").is_ok() {
        build.flag_if_supported("-fno-omit-frame-pointer");
    }

    build.flag_if_supported("-Wno-c++0x-extensions");
    build.flag_if_supported("-Wno-return-type-c-linkage");
    build.flag_if_supported("-Wno-invalid-offsetof");
    build.flag_if_supported("-Wno-unused-parameter");

    let confdefs_path: PathBuf = [&outdir, "js", "src", "js-confdefs.h"].iter().collect();
    if build.get_compiler().is_like_msvc() {
        build.flag(&format!("-FI{}", confdefs_path.to_string_lossy()));
        build.define("WIN32", "");
        build.flag("-Zi");
        build.flag("-GR-");
        build.flag("-std:c++17");
    } else {
        build.flag("-fPIC");
        build.flag("-fno-rtti");
        build.flag("-std=c++17");
        build.define("JS_NO_JSVAL_JSID_STRUCT_TYPES", "");
        build.flag("-include");
        build.flag(&confdefs_path.to_string_lossy());
    }

    build.compile("jsglue");
    println!("cargo:rerun-if-changed=src/jsglue.cpp");
}
