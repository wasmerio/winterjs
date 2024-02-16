use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use tokio::task::LocalSet;

use crate::{
    builtins,
    sm_utils::{error_report_option_to_anyhow_error, evaluate_module, evaluate_script, JsApp},
};

async fn exec_script_inner(path: impl AsRef<Path>, script_mode: bool) -> Result<()> {
    let module_loader = (!script_mode).then(runtime::module::Loader::default);
    let standard_modules = builtins::Modules {
        include_internal: !script_mode,
    };

    let js_app = JsApp::build(module_loader, Some(standard_modules));
    let cx = js_app.cx();
    let rt = js_app.rt();

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
    // The top-level tokio runtime is *not* single-threaded, so we
    // need to spawn a new thread with a new single-threaded runtime
    // to run the JS code.
    std::thread::spawn(move || {
        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap()
            .block_on(async move {
                let local_set = LocalSet::new();
                local_set
                    .run_until(exec_script_inner(path, script_mode))
                    .await
            })
    })
    .join()
    .unwrap()
}
