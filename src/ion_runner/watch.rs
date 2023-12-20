use std::{path::PathBuf, sync::Arc};

use anyhow::Context as _;
use tokio::sync::Mutex;

use super::{IonRunner, SharedIonRunner};

/// Wraps an [`IonRunner`] with auto-reload capabilities.
///
/// Will auto-reload the JS code, and re-initialize the runner on changes.
#[derive(Clone)]
pub struct WatchRunner {
    state: Arc<State>,
}

struct State {
    js_path: PathBuf,
    max_js_threads: usize,
    mutable: Mutex<Option<MutableState>>,
}

struct MutableState {
    contents: String,
    runner: SharedIonRunner,
}

impl WatchRunner {
    pub fn new(js_path: PathBuf, max_js_threads: usize) -> Self {
        Self {
            state: Arc::new(State {
                js_path,
                max_js_threads,
                mutable: Mutex::new(None),
            }),
        }
    }

    async fn acquire_runner(&self) -> Result<SharedIonRunner, anyhow::Error> {
        // WASIX does not support inotify file watching APIs, so we naively
        // load the full file contents on every request.
        //
        // This is slow, but this should be sufficient for debugging.
        //
        // We should investigate just going by the file modification time.
        // but loading the full contents is more reliable.

        let mut mutable = self.state.mutable.lock().await;

        let contents = tokio::fs::read_to_string(&self.state.js_path)
            .await
            .with_context(|| {
                format!(
                    "Could not read Javascript file at '{}'",
                    self.state.js_path.display()
                )
            })?;

        if let Some(mutable) = mutable.as_mut() {
            if mutable.contents == contents {
                return Ok(mutable.runner.clone());
            }
        }

        tracing::info!(path=%self.state.js_path.display(), "reloaded application code");

        let runner = IonRunner::new_request_handler(self.state.max_js_threads, contents.clone());
        *mutable = Some(MutableState {
            contents,
            runner: runner.clone(),
        });

        Ok(runner)
    }
}

#[async_trait::async_trait]
impl crate::server::RequestHandler for WatchRunner {
    async fn handle(
        &self,
        addr: std::net::SocketAddr,
        req: http::request::Parts,
        body: hyper::Body,
    ) -> Result<hyper::Response<hyper::Body>, anyhow::Error> {
        let runner = self.acquire_runner().await?;
        runner.handle(addr, req, body).await
    }
}
