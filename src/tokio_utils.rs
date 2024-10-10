use std::future::Future;

use anyhow::Context;
use tokio::{runtime, task::LocalSet};

pub fn run_in_single_thread_runtime<F: Future>(future: F) -> F::Output {
    let rt = runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .context("Failed to build single-threaded tokio runtime")
        .unwrap();
    let result = rt.block_on(async move {
        let local_set = LocalSet::new();
        local_set.run_until(future).await
    });
    rt.shutdown_timeout(std::time::Duration::from_secs(30 * 60));
    result
}
