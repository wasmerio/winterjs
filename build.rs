/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

extern crate bindgen;
extern crate cc;

use std::env;
use std::path::PathBuf;
use std::ffi::{OsStr, OsString};
use std::process::{Command, Stdio};
use std::str;

fn main() {
    build_jsapi();
    build_jsglue();
    build_jsapi_bindings();
}

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

fn cc_flags() -> Vec<&'static str> {
    let mut result = vec![
        "-DRUST_BINDGEN",
        "-DSTATIC_JS_API",
    ];

    if env::var_os("CARGO_FEATURE_DEBUGMOZJS").is_some() {
        result.extend(&[
            "-DJS_GC_ZEAL",
            "-DDEBUG",
            "-DJS_DEBUG",
        ]);
    }

    let target = env::var("TARGET").unwrap();
    if target.contains("windows") {
        result.extend(&[
            "-std=c++14",
            "-DWIN32",
            // Don't use reinterpret_cast() in offsetof(),
            // since it's not a constant expression, so can't
            // be used in static_assert().
            "-D_CRT_USE_BUILTIN_OFFSETOF",
        ]);
    } else {
        result.extend(&[
            "-std=gnu++14",
            "-fno-sized-deallocation",
            "-Wno-unused-parameter",
            "-Wno-invalid-offsetof",
            "-Wno-unused-private-field",
        ]);
    }

    let is_apple = target.contains("apple");
    let is_freebsd = target.contains("freebsd");

    if is_apple || is_freebsd {
        result.push("-stdlib=libc++");
    }

    result
}

fn build_jsapi() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let target = env::var("TARGET").unwrap();
    let mut make = find_make();
    // Put MOZTOOLS_PATH at the beginning of PATH if specified
    if let Some(moztools) = env::var_os("MOZTOOLS_PATH") {
        let path = env::var_os("PATH").unwrap();
        let mut paths = Vec::new();
        paths.extend(env::split_paths(&moztools));
        paths.extend(env::split_paths(&path));
        let new_path = env::join_paths(paths).unwrap();
        env::set_var("PATH", &new_path);
        make = OsStr::new("mozmake").to_os_string();
    }

    let mut cmd = Command::new(make);

    // We're using the MSYS make which doesn't work with the mingw32-make-style
    // MAKEFLAGS, so remove that from the env if present.
    if target.contains("windows") {
        cmd.env_remove("MAKEFLAGS").env_remove("MFLAGS");
    } else if let Some(makeflags) = env::var_os("CARGO_MAKEFLAGS") {
        cmd.env("MAKEFLAGS", makeflags);
    }

    if target.contains("apple") || target.contains("freebsd") {
        cmd.env("CXXFLAGS", "-stdlib=libc++");
    }

    let result = cmd.args(&["-R", "-f", "makefile.cargo"])
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .expect("Failed to run `make`");

    assert!(result.success());
    println!("cargo:rustc-link-search=native={}/js/src/build", out_dir);
    println!("cargo:rustc-link-lib=static=js_static"); // Must come before c++
    if target.contains("windows") {
        println!("cargo:rustc-link-search=native={}/dist/bin", out_dir);
        println!("cargo:rustc-link-lib=winmm");
        println!("cargo:rustc-link-lib=psapi");
        println!("cargo:rustc-link-lib=user32");
        println!("cargo:rustc-link-lib=Dbghelp");
        if target.contains("gnu") {
            println!("cargo:rustc-link-lib=stdc++");
        }
    } else if target.contains("apple") || target.contains("freebsd") {
        println!("cargo:rustc-link-lib=c++");
    } else {
        println!("cargo:rustc-link-lib=stdc++");
    }
    println!("cargo:outdir={}", out_dir);
    println!("cargo:rerun-if-changed=makefile.cargo");
}


fn build_jsglue() {
    let out = PathBuf::from(env::var("OUT_DIR").unwrap());

    let mut build = cc::Build::new();
    build.cpp(true);

    for flag in cc_flags() {
        build.flag_if_supported(flag);
    }

    let target = env::var("TARGET").unwrap();
    let config = format!("{}/js/src/js-confdefs.h", out.display());
    if target.contains("windows") {
        build.flag("-FI");
    } else {
        build.flag("-include");
    }
    build.flag(&config);

    build.file("src/jsglue.cpp");
    build.include(out.join("dist/include"));
    build.include(out.join("js/src"));

    build.compile("jsglue");
}

/// Invoke bindgen on the JSAPI headers to produce raw FFI bindings for use from
/// Rust.
///
/// To add or remove which functions, types, and variables get bindings
/// generated, see the `const` configuration variables below.
fn build_jsapi_bindings() {
    let out = PathBuf::from(env::var("OUT_DIR").unwrap());
    let rustfmt_config = Some(PathBuf::from("rustfmt.toml"));

    // By default, constructors, destructors and methods declared in .h files are inlined,
    // so their symbols aren't available. Adding the -fkeep-inlined-functions option
    // causes the jsapi library to bloat from 500M to 6G, so that's not an option.
    let mut config = bindgen::CodegenConfig::all();
    config &= !bindgen::CodegenConfig::CONSTRUCTORS;
    config &= !bindgen::CodegenConfig::DESTRUCTORS;
    config &= !bindgen::CodegenConfig::METHODS;

    let mut builder = bindgen::builder()
        .rust_target(bindgen::RustTarget::Stable_1_25)
        .header("./src/jsglue.hpp")
        // Translate every enum with the "rustified enum" strategy. We should
        // investigate switching to the "constified module" strategy, which has
        // similar ergonomics but avoids some potential Rust UB footguns.
        .rustified_enum(".*")
        .enable_cxx_namespaces()
        .with_codegen_config(config)
        .rustfmt_bindings(true)
        .rustfmt_configuration_file(rustfmt_config)
        .clang_arg("-I").clang_arg(out.join("dist/include").to_str().expect("UTF-8"))
        .clang_arg("-I").clang_arg(out.join("js/src").to_str().expect("UTF-8"))
        .clang_arg("-x").clang_arg("c++");

    let target = env::var("TARGET").unwrap();
    if target.contains("windows") {
        builder = builder.clang_arg("-fms-compatibility");
    }

    if let Ok(flags) = env::var("CXXFLAGS") {
        for flag in flags.split_whitespace() {
            builder = builder.clang_arg(flag);
        }
    }

    if let Ok(flags) = env::var("CLANGFLAGS") {
        for flag in flags.split_whitespace() {
            builder = builder.clang_arg(flag);
        }
    }

    for flag in cc_flags() {
        builder = builder.clang_arg(flag);
    }

    builder = builder.clang_arg("-include");
    builder = builder.clang_arg(out.join("js/src/js-confdefs.h").to_str().expect("UTF-8"));

    println!("Generting bindings {:?} {}.", builder.command_line_flags(), bindgen::clang_version().full);

    for ty in UNSAFE_IMPL_SYNC_TYPES {
        builder = builder.raw_line(format!("unsafe impl Sync for root::{} {{}}", ty));
    }

    for ty in WHITELIST_TYPES {
        builder = builder.whitelist_type(ty);
    }

    for var in WHITELIST_VARS {
        builder = builder.whitelist_var(var);
    }

    for func in WHITELIST_FUNCTIONS {
        builder = builder.whitelist_function(func);
    }

    for ty in OPAQUE_TYPES {
        builder = builder.opaque_type(ty);
    }

    for ty in BLACKLIST_TYPES {
        builder = builder.blacklist_type(ty);
    }

    for &(module, raw_line) in MODULE_RAW_LINES {
        builder = builder.module_raw_line(module, raw_line);
    }

    let bindings = builder.generate()
        .expect("Should generate JSAPI bindings OK");

    bindings.write_to_file(out.join("jsapi.rs"))
        .expect("Should write bindings to file OK");

    println!("cargo:rerun-if-changed=rustfmt.toml");
    println!("cargo:rerun-if-changed=src/jsglue.hpp");
    println!("cargo:rerun-if-changed=src/jsglue.cpp");
}

/// JSAPI types for which we should implement `Sync`.
const UNSAFE_IMPL_SYNC_TYPES: &'static [&'static str] = &[
    "JSClass",
    "JSFunctionSpec",
    "JSNativeWrapper",
    "JSPropertySpec",
    "JSTypedMethodJitInfo",
];

/// Types which we want to generate bindings for (and every other type they
/// transitively use).
const WHITELIST_TYPES: &'static [&'static str] = &[
    "JS.*",
    "js::.*",
    "mozilla::.*",
];

/// Global variables we want to generate bindings to.
const WHITELIST_VARS: &'static [&'static str] = &[
    "JS::NullHandleValue",
    "JS::TrueHandleValue",
    "JS::UndefinedHandleValue",
    "JSCLASS_.*",
    "JSFUN_.*",
    "JSITER_.*",
    "JSPROP_.*",
    "JS_.*",
];

/// Functions we want to generate bindings to.
const WHITELIST_FUNCTIONS: &'static [&'static str] = &[
   "ExceptionStackOrNull",
    "glue::.*",
    "JS::.*",
    "js::.*",
    "JS_.*",
    ".*_TO_JSID",
];

/// Types that should be treated as an opaque blob of bytes whenever they show
/// up within a whitelisted type.
///
/// These are types which are too tricky for bindgen to handle, and/or use C++
/// features that don't have an equivalent in rust, such as partial template
/// specialization.
const OPAQUE_TYPES: &'static [&'static str] = &[
    "JS::Auto.*Impl",
    "JS::Auto.*Vector.*",
    "JS::PersistentRooted.*",
    "JS::ReadOnlyCompileOptions",
    "JS::Rooted<JS::Auto.*Vector.*>",
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

/// Types for which we should NEVER generate bindings, even if it is used within
/// a type or function signature that we are generating bindings for.
const BLACKLIST_TYPES: &'static [&'static str] = &[
    // We'll be using libc::FILE.
    "FILE",
    // We provide our own definition because we need to express trait bounds in
    // the definition of the struct to make our Drop implementation correct.
    "JS::Heap",
    // We provide our own definition because SM's use of templates
    // is more than bindgen can cope with.
    "JS::Rooted",
    // Bindgen generates bitfields with private fields, so they cannot
    // be used in const expressions.
    "JSJitInfo",
];

/// Definitions for types that were blacklisted
const MODULE_RAW_LINES: &'static [(&'static str, &'static str)] = &[
    ("root", "pub type FILE = ::libc::FILE;"),
    ("root", "pub type JSJitInfo = ::jsjit::JSJitInfo;"),
    ("root::JS", "pub type Heap<T> = ::jsgc::Heap<T>;"),
    ("root::JS", "pub type Rooted<T> = ::jsgc::Rooted<T>;"),
];
