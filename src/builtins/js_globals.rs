//! Here, we initialize globals that are defined in JS, as opposed
//! to defining classes in Rust. The scripts need to do something
//! meaningful, such as making assignments to `globalThis`.
//!
//! Note: Files that don't have a .js extension will be ignored.

use anyhow::{bail, Context as _};
use clap::builder::OsStr;
use include_dir::{include_dir, Dir, File};
use ion::{script::Script, Context};

const MODULES_DIR: Dir = include_dir!("src/builtins/js_globals");

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
            compile_and_evaluate(cx, file)?;
        }
    }

    for dir in dir.dirs() {
        scan_dir(cx, dir)?;
    }

    Ok(())
}

fn compile_and_evaluate(cx: &Context, script_file: &File) -> anyhow::Result<()> {
    tracing::debug!("Evaluating global script at {:?}", script_file.path());

    let contents = script_file
        .contents_utf8()
        .context("Failed to convert file contents to UTF-8")?;

    let script = Script::compile(cx, script_file.path(), contents)
        .map_err(|e| anyhow::anyhow!("Script compilation failed: {e:?}"))?;

    match script.evaluate(cx) {
        Ok(val) => {
            if !val.get().is_undefined() {
                tracing::warn!(
                    "js_globals script {} returned a result, ignoring",
                    script_file.path().to_string_lossy()
                );
            }
            Ok(())
        }
        Err(e) => bail!("Script execution failed: {e:?}"),
    }
}
