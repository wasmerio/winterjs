use std::{path::PathBuf, sync::Arc};

use anyhow::bail;
use tokio::sync::Mutex;

use crate::ion_runner::UserCode;

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

// TODO: support watching modules. This is complicated by the fact that we must
// watch all modules loaded in after the entry module was loaded as well.
impl WatchRunner {
    pub fn new(js_path: PathBuf, script_mode: bool, max_js_threads: usize) -> anyhow::Result<Self> {
        if !script_mode {
            bail!("Watch mode is not compatible with module mode yet. Use --script to run in script mode instead.");
        }
        Ok(Self {
            state: Arc::new(State {
                js_path,
                max_js_threads,
                mutable: Mutex::new(None),
            }),
        })
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

        let (contents, file_name) = match UserCode::from_path(&self.state.js_path, true)
            .await
            .unwrap()
        {
            UserCode::Script { code, file_name } => (code, file_name),
            UserCode::Module(_) => unreachable!(),
        };

        if let Some(mutable) = mutable.as_mut() {
            if mutable.contents == contents {
                return Ok(mutable.runner.clone());
            }
        }

        tracing::info!(path=%self.state.js_path.display(), "reloaded application code");

        let runner = IonRunner::new_request_handler(
            self.state.max_js_threads,
            UserCode::Script {
                code: contents.clone(),
                file_name,
            },
        );
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
