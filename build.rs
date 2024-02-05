use std::process::Command;

fn main() {
    let mut dir = std::env::current_dir().unwrap();
    dir.extend(["src", "ion_runner", "internal_js_modules"]);
    assert!(Command::new("npx")
        .arg("tsc")
        .current_dir(dir)
        .output()
        .unwrap()
        .status
        .success());
}
