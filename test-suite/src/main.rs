use anyhow::Result;
use clap::Parser;
use test_suite::{TestConfig, TestManager};

use std::{
    fs,
    net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream},
    path::Path,
    time::Duration,
};

// Read and parse the TOML file into a TestConfig
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

fn ensure_ports_open(ports: Vec<u16>) {
    let ip = Ipv4Addr::new(127, 0, 0, 1);

    for port in ports {
        let sock_addr = SocketAddr::new(SocketAddr::V4(SocketAddrV4::new(ip, port)).ip(), port);
        match TcpStream::connect_timeout(&sock_addr, Duration::from_secs(10)) {
            Ok(_) => (),
            Err(_) => panic!("Port {port} is not open, can't continue"),
        }
    }
}

#[derive(clap::Parser)]
struct TestSuiteArguments {
    /// Path to the test definition file. Defaults to './winterjs-tests.toml'
    #[arg(short = 'c', long = "test-config-path")]
    test_config_path: Option<String>,

    #[clap(flatten)]
    test_args: libtest_mimic::Arguments,
}

fn main() -> Result<()> {
    let args = TestSuiteArguments::parse();

    // Read the test cases from the TOML file
    let test_config = read_test_cases(args.test_config_path)?;

    let ports: Vec<u16> = test_config
        .engines
        .iter()
        .map(|runner| runner.engine.port())
        .collect();

    std::thread::sleep(Duration::from_secs(3));
    ensure_ports_open(ports);

    // add a run test inside the test manager which holds the tokio runtime and runs the tests use a handle and clone the handle
    TestManager::new(test_config)?.run_tests(args.test_args)
}
