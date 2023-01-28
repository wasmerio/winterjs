/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

extern crate bindgen;
extern crate cc;
extern crate walkdir;

use std::env;
use std::ffi::{OsStr, OsString};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::str;
use walkdir::WalkDir;

const ENV_VARS: &'static [&'static str] = &[
    "AR",
    "AS",
    "CC",
    "CFLAGS",
    "CLANGFLAGS",
    "CPP",
    "CPPFLAGS",
    "CXX",
    "CXXFLAGS",
    "MAKE",
    "MOZ_TOOLS",
    "MOZJS_FORCE_RERUN",
    "MOZTOOLS_PATH",
    "PYTHON",
    "STLPORT_LIBS",
];

const EXTRA_FILES: &'static [&'static str] = &[
    "makefile.cargo",
    "src/rustfmt.toml",
    "src/jsglue.hpp",
    "src/jsglue.cpp",
];

fn main() {
    // https://github.com/servo/mozjs/issues/113
    env::set_var("MOZCONFIG", "");

    // https://github.com/servo/servo/issues/14759
    env::set_var("MOZ_NO_DEBUG_RTL", "1");

    let out_dir = PathBuf::from(env::var_os("OUT_DIR").unwrap());
    let build_dir = out_dir.join("build");

    // Used by rust-mozjs downstream, don't remove.
    println!("cargo:outdir={}", build_dir.display());

    fs::create_dir_all(&build_dir).expect("could not create build dir");

    build_jsapi(&build_dir);
    build_jsglue(&build_dir);
    build_jsapi_bindings(&build_dir);

    if env::var_os("MOZJS_FORCE_RERUN").is_none() {
        for var in ENV_VARS {
            println!("cargo:rerun-if-env-changed={}", var);
        }

        for entry in WalkDir::new("mozjs") {
            let entry = entry.unwrap();
            let path = entry.path();
            if !ignore(path) {
                println!("cargo:rerun-if-changed={}", path.display());
            }
        }

        for file in EXTRA_FILES {
            println!("cargo:rerun-if-changed={}", file);
        }
    }
}

fn find_make() -> OsString {
    if let Some(make) = env::var_os("MAKE") {
        make
    } else {
        match Command::new("gmake").status() {
            Ok(gmake) => {
                if gmake.success() {
                    OsStr::new("gmake").to_os_string()
                } else {
                    OsStr::new("make").to_os_string()
                }
            }
            Err(_) => OsStr::new("make").to_os_string(),
        }
    }
}

fn cc_flags() -> Vec<&'static str> {
    let mut result = vec!["-DRUST_BINDGEN", "-DSTATIC_JS_API"];

    if env::var_os("CARGO_FEATURE_DEBUGMOZJS").is_some() {
        result.extend(&["-DJS_GC_ZEAL", "-DDEBUG", "-DJS_DEBUG"]);
    }

    let target = env::var("TARGET").unwrap();
    if target.contains("windows") {
        result.extend(&[
            "-std=c++17",
            "-DWIN32",
            // Don't use reinterpret_cast() in offsetof(),
            // since it's not a constant expression, so can't
            // be used in static_assert().
            "-D_CRT_USE_BUILTIN_OFFSETOF",
        ]);
    } else {
        result.extend(&[
            "-std=gnu++17",
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

fn build_jsapi(build_dir: &Path) {
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

    let encoding_c_mem_include_dir = env::var("DEP_ENCODING_C_MEM_INCLUDE_DIR").unwrap();
    let mut cppflags = OsString::from("-I");
    cppflags.push(OsString::from(
        encoding_c_mem_include_dir.replace("\\", "/"),
    ));
    cppflags.push(" ");
    cppflags.push(env::var_os("CPPFLAGS").unwrap_or_default());
    cmd.env("CPPFLAGS", cppflags);

    if let Some(makeflags) = env::var_os("CARGO_MAKEFLAGS") {
        cmd.env("MAKEFLAGS", makeflags);
    }

    if target.contains("apple") || target.contains("freebsd") {
        cmd.env("CXXFLAGS", "-stdlib=libc++");
    }

    let cargo_manifest_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());

    let result = cmd
        .args(&["-R", "-f"])
        .arg(cargo_manifest_dir.join("makefile.cargo"))
        .current_dir(&build_dir)
        .env("SRC_DIR", &cargo_manifest_dir.join("mozjs"))
        .env("NO_RUST_PANIC_HOOK", "1")
        .status()
        .expect("Failed to run `make`");
    assert!(result.success());

    println!(
        "cargo:rustc-link-search=native={}/js/src/build",
        build_dir.display()
    );
    println!("cargo:rustc-link-lib=static=js_static"); // Must come before c++
    if target.contains("windows") {
        println!(
            "cargo:rustc-link-search=native={}/dist/bin",
            build_dir.display()
        );
        println!("cargo:rustc-link-lib=winmm");
        println!("cargo:rustc-link-lib=psapi");
        println!("cargo:rustc-link-lib=user32");
        println!("cargo:rustc-link-lib=Dbghelp");
        if target.contains("gnu") {
            println!("cargo:rustc-link-lib=stdc++");
        }
        if cfg!(feature = "uwp") {
            println!("cargo:rustc-link-lib=mincore");
        }
    } else if target.contains("apple") || target.contains("freebsd") {
        println!("cargo:rustc-link-lib=c++");
    } else {
        println!("cargo:rustc-link-lib=stdc++");
    }
}

fn build_jsglue(build_dir: &Path) {
    let mut build = cc::Build::new();
    build.cpp(true);

    for flag in cc_flags() {
        build.flag_if_supported(flag);
    }

    let config = format!("{}/js/src/js-confdefs.h", build_dir.display());
    if build.get_compiler().is_like_msvc() {
        build.flag_if_supported("-std:c++17");
        build.flag("-FI");
    } else {
        build.flag("-include");
    }
    build
        .flag(&config)
        .file("src/jsglue.cpp")
        .include(build_dir.join("dist/include"))
        .include(build_dir.join("js/src"))
        .out_dir(build_dir.join("glue"))
        .compile("jsglue");
}

/// Invoke bindgen on the JSAPI headers to produce raw FFI bindings for use from
/// Rust.
///
/// To add or remove which functions, types, and variables get bindings
/// generated, see the `const` configuration variables below.
fn build_jsapi_bindings(build_dir: &Path) {
    let rustfmt_config = Some(PathBuf::from("src/rustfmt.toml"));

    // By default, constructors, destructors and methods declared in .h files are inlined,
    // so their symbols aren't available. Adding the -fkeep-inlined-functions option
    // causes the jsapi library to bloat from 500M to 6G, so that's not an option.
    let mut config = bindgen::CodegenConfig::all();
    config &= !bindgen::CodegenConfig::CONSTRUCTORS;
    config &= !bindgen::CodegenConfig::DESTRUCTORS;
    config &= !bindgen::CodegenConfig::METHODS;

    let mut builder = bindgen::builder()
        .rust_target(bindgen::RustTarget::Stable_1_40)
        .header("./src/jsglue.hpp")
        // Translate every enum with the "rustified enum" strategy. We should
        // investigate switching to the "constified module" strategy, which has
        // similar ergonomics but avoids some potential Rust UB footguns.
        .rustified_enum(".*")
        .size_t_is_usize(true)
        .enable_cxx_namespaces()
        .with_codegen_config(config)
        .rustfmt_bindings(true)
        .rustfmt_configuration_file(rustfmt_config)
        .clang_arg("-I")
        .clang_arg(build_dir.join("dist/include").to_str().expect("UTF-8"))
        .clang_arg("-I")
        .clang_arg(build_dir.join("js/src").to_str().expect("UTF-8"))
        .clang_arg("-x")
        .clang_arg("c++");

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
    builder = builder.clang_arg(
        build_dir
            .join("js/src/js-confdefs.h")
            .to_str()
            .expect("UTF-8"),
    );

    println!(
        "Generting bindings {:?} {}.",
        builder.command_line_flags(),
        bindgen::clang_version().full
    );

    for ty in UNSAFE_IMPL_SYNC_TYPES {
        builder = builder.raw_line(format!("unsafe impl Sync for root::{} {{}}", ty));
    }

    for ty in WHITELIST_TYPES {
        builder = builder.allowlist_type(ty);
    }

    for var in WHITELIST_VARS {
        builder = builder.allowlist_var(var);
    }

    for func in WHITELIST_FUNCTIONS {
        builder = builder.allowlist_function(func);
    }

    for func in BLACKLIST_FUNCTIONS {
        builder = builder.blocklist_function(func);
    }

    for ty in OPAQUE_TYPES {
        builder = builder.opaque_type(ty);
    }

    for ty in BLACKLIST_TYPES {
        builder = builder.blocklist_type(ty);
    }

    for &(module, raw_line) in MODULE_RAW_LINES {
        builder = builder.module_raw_line(module, raw_line);
    }

    let bindings = builder
        .generate()
        .expect("Should generate JSAPI bindings OK");

    bindings
        .write_to_file(build_dir.join("jsapi.rs"))
        .expect("Should write bindings to file OK");
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
const WHITELIST_TYPES: &'static [&'static str] = &["JS.*", "js::.*", "mozilla::.*"];

/// Global variables we want to generate bindings to.
const WHITELIST_VARS: &'static [&'static str] = &[
    "JS::NullHandleValue",
    "JS::TrueHandleValue",
    "JS::UndefinedHandleValue",
    "JSCLASS_.*",
    "JSFUN_.*",
    "JSITER_.*",
    "JSPROP_.*",
    "JSREG_.*",
    "JS_.*",
    "js::Proxy.*",
];

/// Functions we want to generate bindings to.
const WHITELIST_FUNCTIONS: &'static [&'static str] = &[
    "ExceptionStackOrNull",
    "glue::.*",
    "JS::.*",
    "js::.*",
    "JS_.*",
    ".*_TO_JSID",
    "JS_DeprecatedStringHasLatin1Chars",
];

/// Functions we do not want to generate bindings to.
const BLACKLIST_FUNCTIONS: &'static [&'static str] = &[
    "JS::FromPropertyDescriptor",
    "JS_GetOwnPropertyDescriptorById",
    "JS_GetOwnPropertyDescriptor",
    "JS_GetOwnUCPropertyDescriptor",
    "JS_GetPropertyDescriptorById",
    "JS_GetPropertyDescriptor",
    "JS_GetUCPropertyDescriptor",
    "js::SetPropertyIgnoringNamedGetter",
    "JS::FinishOffThreadStencil",
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
    // We don't need them and bindgen doesn't like them.
    "JS::HandleVector",
    "JS::MutableHandleVector",
    "JS::Rooted.*Vector",
    "JS::RootedValueArray",
    // Classes we don't use and we cannot generate theri
    // types properly from bindgen so we'll skip them for now.
    "JS::dbg::Builder",
    "JS::dbg::Builder_BuiltThing",
    "JS::dbg::Builder_Object",
    "JS::dbg::Builder_Object_Base",
    "JS::dbg::BuilderOrigin",
];

/// Definitions for types that were blacklisted
const MODULE_RAW_LINES: &'static [(&'static str, &'static str)] = &[
    ("root", "pub type FILE = ::libc::FILE;"),
    ("root::JS", "pub type Heap<T> = ::jsgc::Heap<T>;"),
    ("root::JS", "pub type Rooted<T> = ::jsgc::Rooted<T>;"),
];

/// Rerun this build script if files under mozjs/ changed, unless this returns true.
/// Keep this in sync with .gitignore
fn ignore(path: &Path) -> bool {
    // Python pollutes a bunch of source directories with pyc and so files,
    // making cargo believe that the crate needs a rebuild just because a
    // directory's mtime changed.
    if path.is_dir() {
        return true;
    }

    let ignored_extensions = ["pyc", "o", "so", "dll", "dylib"];

    path.extension().map_or(false, |extension| {
        ignored_extensions
            .iter()
            .any(|&ignored| extension == ignored)
    })
}
