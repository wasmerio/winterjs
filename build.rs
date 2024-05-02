use std::process::Command;

fn main() {
    // We want to let people install WinterJS from source, so we can't have
    // a dependency on TSC at all times. The assumption here is that whoever
    // updates TS sources for builtin modules will at least run WinterJS
    // once in debug mode, and the JS scripts will be updated and pushed.
    let profile = std::env::var("PROFILE").unwrap();
    if profile == "debug" {
        let mut dir = std::env::current_dir().unwrap();
        dir.extend(["src", "builtins", "internal_js_modules"]);
        assert!(Command::new("npx")
            .arg("tsc")
            .current_dir(dir)
            .output()
            .unwrap()
            .status
            .success());
    }

    // npx tsc modules/*.ts --declaration --emitDeclarationOnly --module es6  --outDir __types
    if profile == "debug" {
        let mut dir = std::env::current_dir().unwrap();
        dir.extend(["src", "builtins", "js_modules"]);
        assert!(Command::new("npx")
            .arg("tsc")
            .current_dir(dir)
            .output()
            .unwrap()
            .status
            .success());
    }
}
