//! Here, we initialize those modules that are defined in JS, as
//! opposed to native modules defined in Rust. The sources for
//! these modules should be put under the internal_js_modules dir
//! that lives next to this source file.
//!
//! The name of the modules will be equivalent to their path on disk,
//! but forward slashes (/) will be changed to a colon (:) and the .js
//! extension will be stripped. So, to create a node:buffer module,
//! one must put the source under `internal_js_modules/node/buffer.js`.
//!
//! Note: Files that don't have a .js extension will be ignored.

use std::path::PathBuf;

use anyhow::{anyhow, Context as _};
use clap::builder::OsStr;
use include_dir::{include_dir, Dir, File};
use ion::{module::Module, Context};

const MODULES_DIR: Dir = include_dir!("src/builtins/internal_js_modules");

pub(super) fn define(cx: &Context) -> bool {
    match scan_dir(cx, &MODULES_DIR) {
        Ok(()) => true,
        Err(e) => {
            tracing::error!(
                error = %e,
                "Failed to load internal modules"
            );
            false
        }
    }
}

fn scan_dir(cx: &Context, dir: &Dir) -> anyhow::Result<()> {
    for file in dir.files() {
        if file.path().extension() == Some(&OsStr::from("js")) {
            compile_and_register(cx, file)?;
        }
    }

    for dir in dir.dirs() {
        scan_dir(cx, dir)?;
    }

    Ok(())
}

fn compile_and_register(cx: &Context, script_file: &File) -> anyhow::Result<()> {
    tracing::debug!("Registering internal module at {:?}", script_file.path());

    let file_path = script_file
        .path()
        .to_str()
        .context("Failed to convert module path to string")?;

    let file_path_no_suffix = file_path
        .strip_suffix(".js")
        .context("Script file path must have a .js suffix")?;

    let module_name = file_path
        .starts_with("node")
        .then(|| file_path_no_suffix.replacen('/', ":", 1));

    let module_path = format!("$winterjs_internal$/{file_path}");

    let contents = script_file
        .contents_utf8()
        .context("Failed to convert file contents to UTF-8")?;

    let module = Module::compile(
        cx,
        &module_path,
        Some(&PathBuf::from(module_path.clone())),
        contents,
    )
    .map_err(|e| anyhow::anyhow!("Module compilation failed: {e:?}"))?;

    match unsafe { &mut (*cx.get_inner_data().as_ptr()).module_loader } {
        Some(loader) => {
            for name in [module_path].iter().chain(module_name.iter()) {
                tracing::debug!(%name, "Registering internal module with name");
                loader
                    .register(cx, module.module_object(), name.clone())
                    .map_err(|e| anyhow!("Failed to register internal module due to: {e}"))?;
            }
            Ok(())
        }
        None => anyhow::bail!("No module loader present, cannot register internal module"),
    }
}
