use anyhow::Ok;
use libtest_mimic::Arguments;
use std::fs;
use test_suite::{TestConfig, TestManager};

// Read and parse the TOML file into a TestConfig
fn read_test_cases() -> Result<TestConfig, anyhow::Error> {
    let file_path = format!("{}/tests/tests.toml", env!("CARGO_MANIFEST_DIR"));
    let file_content = fs::read_to_string(file_path).expect("File should be read without problems");
    let test_config: TestConfig = toml::from_str(&file_content)?;
    Ok(test_config)
}

fn main() -> Result<(), anyhow::Error> {
    let args = Arguments::from_args();

    // Read the test cases from the TOML file
    let test_config = read_test_cases()?;

    // add a run test inside the test manager which holds the tokio runtime and runs the tests use a handle and clone the handle
    TestManager::new(test_config)?
        .run_tests(&args)
        //stop the server thread
        .map(|_| {
            ()
            // server_thread.join().unwrap();
        })
}
