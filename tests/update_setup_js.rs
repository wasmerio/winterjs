use std::{
    path::Path,
    process::{Command, Output, Stdio},
};

#[test]
fn setup_js_is_up_to_date() {
    let setup_js = project_root().join("src").join("setup.js");
    let glue_code = project_root().join("glue-code");

    regenerate_glue_code(&glue_code);

    let index_js = glue_code.join("dist").join("index.js");
    let generated = std::fs::read_to_string(index_js).unwrap();
    ensure_file_contents(setup_js, generated);
}

fn regenerate_glue_code(base_dir: &Path) {
    let mut cmd = Command::new("npm");
    cmd.arg("run")
        .arg("build")
        .current_dir(base_dir)
        .stderr(Stdio::piped())
        .stdout(Stdio::piped());
    let debug_command = format!("{cmd:?}");

    let Output {
        status,
        stdout,
        stderr,
    } = cmd.output().unwrap();

    if !status.success() {
        let stdout = String::from_utf8_lossy(&stdout);
        if !stdout.trim().is_empty() {
            eprintln!("=== STDOUT ===");
            eprintln!("{stdout}");
        }
        let stderr = String::from_utf8_lossy(&stderr);
        if !stderr.trim().is_empty() {
            eprintln!("=== STDERR ===");
            eprintln!("{stderr}");
        }

        panic!("Regeneration failed with exit code {status}: {debug_command}");
    }
}

/// Get the root directory for this repository.
fn project_root() -> &'static Path {
    let root_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    assert!(root_dir.join(".git").exists());

    root_dir
}

/// Check that a particular file has the desired contents.
///
/// If the file is missing or outdated, this function will update the file and
/// trigger a panic to fail any test this is called from.
fn ensure_file_contents(path: impl AsRef<Path>, contents: impl AsRef<str>) {
    let path = path.as_ref();
    let contents = normalize_newlines(contents.as_ref());
    if let Ok(old_contents) = std::fs::read_to_string(path) {
        if contents == normalize_newlines(&old_contents) {
            // File is already up to date
            return;
        }
    }

    let display_path = path.strip_prefix(project_root()).unwrap_or(path);

    eprintln!("{} was not up-to-date, updating...", display_path.display());

    if std::env::var("CI").is_ok() {
        eprintln!("Note: run `cargo test` locally and commit the updated files");
    }

    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::write(path, contents).unwrap();
    panic!("some file was not up to date and has been updated. Please re-run the tests.");
}

fn normalize_newlines(s: &str) -> String {
    s.replace("\r\n", "\n")
}
