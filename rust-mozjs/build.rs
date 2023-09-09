/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::env;
use std::path::PathBuf;

fn cc_flags(bindgen: bool) -> Vec<&'static str> {
    let mut result = vec!["-DSTATIC_JS_API"];

    if env::var("CARGO_FEATURE_DEBUGMOZJS").is_ok() {
        result.push("-DDEBUG");

        // bindgen doesn't like this
        if !bindgen {
            if cfg!(target_os = "windows") {
                result.push("-Od");
            } else {
                result.push("-g");
                result.push("-O0");
            }
        }
    }

    if env::var("CARGO_FEATURE_PROFILEMOZJS").is_ok() {
        result.push("-fno-omit-frame-pointer");
    }

    result.push("-Wno-c++0x-extensions");
    result.push("-Wno-return-type-c-linkage");
    result.push("-Wno-invalid-offsetof");
    result.push("-Wno-unused-parameter");

    result
}

fn main() {
    //let mut build = cxx_build::bridge("src/jsglue.rs"); // returns a cc::Build;
    let mut build = cc::Build::new();
    let outdir = env::var("DEP_MOZJS_OUTDIR").unwrap();
    let include_path: PathBuf = [&outdir, "dist", "include"].iter().collect();

    build
        .cpp(true)
        .file("src/jsglue.cpp")
        .include(&include_path);
    for flag in cc_flags(false) {
        build.flag_if_supported(flag);
    }

    let confdefs_path: PathBuf = [&outdir, "js", "src", "js-confdefs.h"].iter().collect();
    let msvc = if build.get_compiler().is_like_msvc() {
        build.flag(&format!("-FI{}", confdefs_path.to_string_lossy()));
        build.define("WIN32", "");
        build.flag("-Zi");
        build.flag("-GR-");
        build.flag("-std:c++17");
        true
    } else {
        build.flag("-fPIC");
        build.flag("-fno-rtti");
        build.flag("-std=c++17");
        build.flag("-include");
        build.flag(&confdefs_path.to_string_lossy());
        false
    };

    build.compile("jsglue");
    println!("cargo:rerun-if-changed=src/jsglue.cpp");
    let mut builder = bindgen::Builder::default()
        .header("./src/jsglue.cpp")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks))
        .size_t_is_usize(true)
        .formatter(bindgen::Formatter::Rustfmt)
        .clang_arg("-x")
        .clang_arg("c++")
        .clang_args(cc_flags(true))
        .clang_args(["-I", &include_path.to_string_lossy()])
        .enable_cxx_namespaces()
        .allowlist_file("./src/jsglue.cpp")
        .allowlist_recursively(false);

    if msvc {
        builder = builder.clang_args([
            &format!("-FI{}", confdefs_path.to_string_lossy()),
            "-DWIN32",
            "-GR-",
            "-std=c++17",
        ])
    } else {
        builder = builder
            .clang_args(["-fPIC", "-fno-rtti", "-std=c++17"])
            .clang_args(["-include", &confdefs_path.to_str().expect("UTF-8")])
    }

    for ty in BLACKLIST_TYPES {
        builder = builder.blocklist_type(ty);
    }

    for ty in OPAQUE_TYPES {
        builder = builder.opaque_type(ty);
    }

    for &(module, raw_line) in MODULE_RAW_LINES {
        builder = builder.module_raw_line(module, raw_line);
    }
    let bindings = builder
        .generate()
        .expect("Unable to generate bindings to jsglue");

    // Write the bindings to the $OUT_DIR/bindings.rs file.
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap()).join("gluebindings.rs");
    bindings
        .write_to_file(out_path)
        .expect("Couldn't write bindings!");
}

/// Types that have generic arguments must be here or else bindgen does not generate <T>
/// as it treats them as opaque types
const BLACKLIST_TYPES: &'static [&'static str] = &[
    "JS::.*",
    "already_AddRefed",
    // we don't want it null
    "EncodedStringCallback",
];

/// Types that should be treated as an opaque blob of bytes whenever they show
/// up within a whitelisted type.
///
/// These are types which are too tricky for bindgen to handle, and/or use C++
/// features that don't have an equivalent in rust, such as partial template
/// specialization.
const OPAQUE_TYPES: &'static [&'static str] = &[
    "JS::Auto.*Impl",
    "JS::StackGCVector.*",
    "JS::PersistentRooted.*",
    "JS::detail::CallArgsBase.*",
    "js::detail::UniqueSelector.*",
    "mozilla::BufferList",
    "mozilla::Maybe.*",
    "mozilla::UniquePtr.*",
    "mozilla::Variant",
    "mozilla::Hash.*",
    "mozilla::detail::Hash.*",
    "RefPtr_Proxy.*",
];

/// Map mozjs_sys mod namespaces to bindgen mod namespaces
const MODULE_RAW_LINES: &'static [(&'static str, &'static str)] = &[
    ("root", "pub(crate) use mozjs_sys::jsapi::*;"),
    ("root", "pub use crate::glue::EncodedStringCallback;"),
    ("root::js", "pub(crate) use mozjs_sys::jsapi::js::*;"),
    (
        "root::mozilla",
        "pub(crate) use mozjs_sys::jsapi::mozilla::*;",
    ),
    ("root::JS", "pub(crate) use mozjs_sys::jsapi::JS::*;"),
];
