use anyhow::Result;
use clap::Parser;
use test_suite::{ServerConfig, StressTestConfig, TestConfig, TestManager};

use std::{fs, path::Path, time::Duration};

fn read_test_cases(test_definition_file_path: Option<impl AsRef<Path>>) -> Result<TestConfig> {
    let file_content = fs::read_to_string(
        test_definition_file_path
            .as_ref()
            .map(|p| p.as_ref())
            .unwrap_or("winterjs-tests.toml".as_ref()),
    )
    .expect("Cannot read test definition file");
    let test_config: TestConfig = toml::from_str(file_content.as_str())?;
    Ok(test_config)
}

#[derive(clap::Parser)]
struct TestSuiteArguments {
    /// Path to the test definition file. Defaults to './winterjs-tests.toml'
    #[arg(short = 'c', long)]
    test_config_path: Option<String>,

    /// Defaults to localhost
    #[arg(long)]
    host: Option<String>,

    /// Defaults to 8080
    #[arg(long)]
    port: Option<u16>,

    /// If specified, exit code will be 0 regardless of whether tests succeed.
    /// Useful for running test suite against other engines
    #[arg(long)]
    not_critical: bool,

    /// The number of seconds to run a stress test for. If left out, each test
    /// will be run once only.
    #[arg(long)]
    stress_duration: Option<u32>,

    /// Maximum number of concurrent connections when stress testing.
    /// Defaults to 100.
    #[arg(long)]
    stress_max_concurrent_connections: Option<usize>,

    /// The minimum number of connections that have to be made
    /// for the stress test to be considered successful. The test
    /// will not be stopped if this number of connections haven't
    /// been made once the duration is up.
    #[arg(long)]
    stress_min_connections: Option<usize>,

    /// The maximum number of connections that can be made. The test
    /// will be considered successful if this many connections are
    /// made regardless of whether the duration is up.
    #[arg(long)]
    stress_max_connections: Option<usize>,

    #[clap(flatten)]
    test_args: libtest_mimic::Arguments,
}

fn main() -> Result<()> {
    let args = TestSuiteArguments::parse();

    let test_config = read_test_cases(args.test_config_path)?;
    let server_config = ServerConfig {
        host: args.host.unwrap_or_else(|| "localhost".to_string()),
        port: args.port.unwrap_or(8080),
        critical: !args.not_critical,
    };
    let stress_config = args.stress_duration.map(|d| StressTestConfig {
        duration: Duration::from_secs(d as u64),
        max_concurrent_connections: args.stress_max_concurrent_connections.unwrap_or(100),
        min_connections: args.stress_min_connections.unwrap_or(0),
        max_connections: args.stress_max_connections,
    });

    TestManager::new(test_config, server_config, stress_config)?.run_tests(args.test_args)
}
