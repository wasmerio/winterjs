use anyhow::{anyhow, Context as _, Error};
use clap::builder::OsStr;
use include_dir::{include_dir, Dir, File};
use ion::{
    module::{Module, ModuleRequest},
    Context,
};

const JS_MODULES_DIR: Dir = include_dir!("src/builtins/js_modules");
const MODULES_DIR: Dir = include_dir!("src/builtins/js_modules/modules");

pub(super) fn define(cx: &Context) -> bool {
    match scan_dir(cx, &MODULES_DIR) {
        Ok(_) => match compile_and_evaluate_global_assign(cx) {
            Ok(_) => true,
            Err(e) => {
                log_error(&e);
                false
            }
        },
        Err(e) => {
            log_error(&e);
            false
        }
    }
}

fn log_error(e: &Error) {
    tracing::error!(
        error = %e,
        "Failed to load internal modules"
    );
}

fn scan_dir(cx: &Context, modules_dir: &Dir) -> anyhow::Result<()> {
    for file in modules_dir.files() {
        if file.path().extension() == Some(&OsStr::from("js")) {
            compile_and_register_modules(cx, file)?;
        }
    }

    for dir in modules_dir.dirs() {
        scan_dir(cx, dir)?;
    }

    Ok(())
}

fn compile_and_register_modules(cx: &Context, script_file: &File) -> anyhow::Result<()> {
    let module_name = format!(
        "jsmodule:{}",
        script_file
            .path()
            .file_stem()
            .and_then(|os_str| os_str.to_str())
            .context("Failed to convert module path to string")?
    );

    let contents = script_file
        .contents_utf8()
        .context("Failed to convert file contents to UTF-8")?;

    let module = Module::compile(cx, &module_name, None, contents)
        .map_err(|e| anyhow::anyhow!("Module compilation failed: {e:?}"))?;

    match unsafe { &mut (*cx.get_inner_data().as_ptr()).module_loader } {
        Some(loader) => {
            let request = ModuleRequest::new(cx, module_name);
            loader
                .register(cx, module.module_object(), &request)
                .map_err(|e| anyhow!("Failed to register internal module due to: {e}"))?;
            Ok(())
        }
        None => anyhow::bail!("No module loader present, cannot register internal module"),
    }
}

fn compile_and_evaluate_global_assign(cx: &Context) -> anyhow::Result<(), Error> {
    let script_file = JS_MODULES_DIR.get_file("globals.js").unwrap();

    if script_file.path().extension() == Some(&OsStr::from("js")) {
        let module_name = "globals.js";

        let contents = script_file
            .contents_utf8()
            .context("Failed to convert file contents to UTF-8")?;

        match Module::compile_and_evaluate(cx, &module_name, None, contents)
            .map_err(|e| anyhow::anyhow!("Module compilation failed: {e:?}"))
        {
            Ok((_, _)) => Ok(()),
            Err(_) => Err(anyhow!(
                "Failed evaluate js modules global assign file `global.js`"
            )),
        }
    } else {
        Err(anyhow!("Failed load file global.js"))
    }
}
