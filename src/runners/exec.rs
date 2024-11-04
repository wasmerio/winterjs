use std::path::{Path, PathBuf};

use anyhow::{Context, Result};

use crate::{
    builtins,
    js_app::JsAppContextAndRuntime,
    sm_utils::{error_report_option_to_anyhow_error, evaluate_module, evaluate_script},
};

async fn exec_script_inner(path: impl AsRef<Path>, script_mode: bool) -> Result<()> {
    let module_loader = (!script_mode).then(runtime::module::Loader::default);
    let standard_modules = builtins::Modules {
        include_internal: !script_mode,
        hardware_concurrency: 1,
        main_module: path.as_ref().to_string_lossy().into_owned(),
    };

    let cx_rt = JsAppContextAndRuntime::build(module_loader, Some(standard_modules));
    let cx = cx_rt.cx();
    let rt = cx_rt.rt();

    if script_mode {
        let code = std::fs::read_to_string(&path).context("Failed to read script file")?;
        evaluate_script(cx, code, path.as_ref().as_os_str())?;
    } else {
        evaluate_module(cx, path)?;
    }

    rt.run_event_loop()
        .await
        .map_err(|e| error_report_option_to_anyhow_error(cx, e))?;

    Ok(())
}

pub fn exec_script(path: PathBuf, script_mode: bool) -> Result<()> {
    crate::tokio_utils::run_in_single_thread_runtime(exec_script_inner(path, script_mode))
}
