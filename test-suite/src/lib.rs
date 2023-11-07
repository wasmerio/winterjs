use std::ffi::OsString;

#[derive(Debug, Clone)]
pub struct Test {
    test_name: String,
    test_file: OsString,
}

#[derive(Debug, Clone)]
pub struct TestConfig {
    pub tests: Vec<Test>,
}

#[derive(Debug)]
pub struct TestManager {
    rt: tokio::runtime::Runtime,
    config: TestConfig,
}
