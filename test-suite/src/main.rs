use libtest_mimic::Arguments;
use test_suite::{Run, Runner, TestConfig, TestManager};

use std::{
    net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream},
    thread,
    time::Duration,
};

// Read and parse the TOML file into a TestConfig
fn read_test_cases() -> Result<TestConfig, anyhow::Error> {
    let file_content = include_str!("../tests/tests.toml");
    let test_config: TestConfig = toml::from_str(&file_content)?;
    Ok(test_config)
}

fn wait_for_ports(ports: Vec<u16>) {
    let ip = Ipv4Addr::new(127, 0, 0, 1);

    let mut remaining_ports = ports;

    while !remaining_ports.is_empty() {
        remaining_ports.retain(|&port| {
            let sockaddr = SocketAddr::new(SocketAddr::V4(SocketAddrV4::new(ip, port)).ip(), port);
            match TcpStream::connect_timeout(&sockaddr, Duration::from_secs(3)) {
                Ok(_) => {
                    eprintln!("Connected to port {}", port);
                    false
                }
                Err(_) => {
                    eprintln!("Waiting for port {}...", port);
                    thread::sleep(Duration::from_secs(3));
                    true
                }
            }
        });
    }
}

fn main() -> Result<(), anyhow::Error> {
    let args = Arguments::from_args();

    // Read the test cases from the TOML file
    let test_config = read_test_cases()?;

    let matrix_runners: Vec<Runner> = test_config.matrix_runners.clone();
    let server_threads: Vec<thread::JoinHandle<Result<(), anyhow::Error>>> = matrix_runners
        .clone()
        .into_iter()
        .map(|runner| thread::spawn(move || runner.run()))
        .collect();

    std::thread::sleep(Duration::from_secs(3));
    let ports: Vec<u16> = test_config
        .matrix_runners
        .iter()
        .map(|runner| runner.port())
        .collect();

    wait_for_ports(ports);

    // add a run test inside the test manager which holds the tokio runtime and runs the tests use a handle and clone the handle
    TestManager::new(test_config)?
        .run_tests(&args)
        //stop the server thread
        .map(|_| {
            for server_thread in server_threads {
                let _ = server_thread.join().unwrap();
            }
        })
}
