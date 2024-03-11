use std::path::Path;

use anyhow::{bail, Context, Result};
use serde::Deserialize;

#[derive(Deserialize)]
struct RoutesJson {
    version: u32,
    include: Vec<String>,
    exclude: Vec<String>,
}

pub struct Routes {
    include: Vec<String>,
    exclude: Vec<String>,
}

impl Routes {
    pub fn try_parse(dir: impl AsRef<Path>) -> Result<Option<Self>> {
        let file_path = dir.as_ref().join("_routes.json");
        let metadata = match std::fs::metadata(&file_path) {
            Ok(m) => m,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e).context("Failed to get metadata for _routes.json"),
        };
        if !metadata.is_file() {
            bail!("Expected _routes.json to be a file");
        }

        let file_content =
            std::fs::read_to_string(file_path).context("Failed to read _routes.json")?;
        let routes_json = serde_json::from_str::<RoutesJson>(&file_content)
            .context("Failed to parse _routes.json")?;

        if routes_json.version != 1 {
            bail!("Unsupported _routes.json version, only version 1 is supported");
        }
        if routes_json.include.is_empty() {
            bail!("_routes.json must have at least one include rule");
        }

        tracing::info!(
            "Read {} rules from _routes.json",
            routes_json.include.len() + routes_json.exclude.len()
        );

        let wildcard_to_glob = |s: &String| s.replace('*', "**");

        Ok(Some(Self {
            include: routes_json.include.iter().map(wildcard_to_glob).collect(),
            exclude: routes_json.exclude.iter().map(wildcard_to_glob).collect(),
        }))
    }

    pub fn should_route_to_function(&self, route: &str) -> bool {
        if self.include.is_empty() && self.exclude.is_empty() {
            // Special case for a missing _routes.json
            true
        } else if self
            .exclude
            .iter()
            .any(|p| glob_match::glob_match(p, route))
        {
            false
        } else if self
            .include
            .iter()
            .any(|p| glob_match::glob_match(p, route))
        {
            true
        } else {
            // This is the default when no match is found
            false
        }
    }
}
