use std::time::Duration;

use anyhow::{bail, Result};
use futures::{stream::FuturesUnordered, StreamExt};
use libtest_mimic::{Arguments, Failed, Trial};
use reqwest::StatusCode;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct TestCase {
    pub test_name: String,
    pub test_route: String,
    pub expected_output: String,
    pub expected_response_status: u16,

    // Timeout in seconds, will be ignored if zero
    pub timeout: Option<f64>,

    // We don't do anything with the string, but it lets us have
    // documentation in the config file as to why we're skipping
    pub skip: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TestConfig {
    #[serde(rename = "test_case")]
    pub test_cases: Vec<TestCase>,
}

#[derive(Clone, Debug)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub critical: bool,
}

#[derive(Clone, Debug)]
pub struct StressTestConfig {
    pub duration: Duration,
    pub max_concurrent_connections: usize,
    pub min_connections: usize,
    pub max_connections: Option<usize>,
}

#[derive(Debug)]
pub struct TestManager {
    rt: tokio::runtime::Runtime,
    test_config: TestConfig,
    server_config: ServerConfig,
    stress_config: Option<StressTestConfig>,
}

impl TestManager {
    pub fn new(
        test_config: TestConfig,
        server_config: ServerConfig,
        stress_config: Option<StressTestConfig>,
    ) -> Result<Self, anyhow::Error> {
        let rt = tokio::runtime::Runtime::new()?;
        Ok(TestManager {
            rt,
            test_config,
            server_config,
            stress_config,
        })
    }

    fn collect_tests(&self) -> Result<Vec<Trial>, anyhow::Error> {
        let mut tests = vec![];

        for test_case in self.test_config.test_cases.iter() {
            let test_name = test_case.test_name.clone();

            if test_case.skip.is_some() {
                println!("Skipping {test_name}");
                continue;
            }

            let rt = self.rt.handle().clone();
            let test_case = test_case.clone();

            let server_config = self.server_config.clone();
            let test = match self.stress_config {
                Some(ref stress_config) => {
                    let stress_config = stress_config.clone();
                    Trial::test(test_name, move || {
                        stress_test(rt, server_config, stress_config, test_case)
                    })
                }
                None => Trial::test(test_name, move || test_once(rt, server_config, test_case)),
            };

            tests.push(test);
        }

        Ok(tests)
    }

    pub fn run_tests(self, mut args: Arguments) -> Result<(), anyhow::Error> {
        let tests = self.collect_tests()?;
        if self.stress_config.is_some() {
            // Use a single thread for stress tests, since the many concurrent
            // connections can exhaust available ports and cause failures
            args.test_threads = Some(1);
        }
        let conclusion = libtest_mimic::run(&args, tests);
        if conclusion.has_failed() {
            if self.server_config.critical {
                bail!("Some tests failed")
            } else {
                println!(
                    "Warning: Some tests failed, check test output above to \
                    make sure the test cases are correct"
                );
            }
        }

        Ok(())
    }
}

fn stress_test(
    rt: tokio::runtime::Handle,
    server_config: ServerConfig,
    stress_config: StressTestConfig,
    test_case: TestCase,
) -> Result<(), Failed> {
    rt.block_on(async move {
        let client = reqwest::ClientBuilder::new()
            .pool_max_idle_per_host(100)
            .build()?;

        let mut futures = FuturesUnordered::new();

        let mut error = None;
        let mut connections = 0;

        let start_instant = std::time::Instant::now();

        loop {
            if start_instant.elapsed() >= stress_config.duration
                && connections >= stress_config.min_connections
            {
                break;
            }

            if let Some(max_connections) = stress_config.max_connections {
                if connections >= max_connections {
                    break;
                }
            }

            while futures.len() < stress_config.max_concurrent_connections {
                futures.push(run_test_once(&server_config, &test_case, &client));
                connections += 1;
            }

            let res = futures.next().await;
            if let Some(Err(e)) = res {
                error = Some(e.into());
                break;
            }
        }

        if error.is_none() {
            while !futures.is_empty() {
                let res = futures.next().await;
                if let Some(Err(e)) = res {
                    error = Some(e.into());
                    break;
                }
            }
        }

        match error {
            None => {
                println!(
                    "Test {} - {connections} successful connections",
                    test_case.test_name
                );
                Ok(())
            }
            Some(e) => {
                println!(
                    "Test {} - error after {connections} connections",
                    test_case.test_name
                );
                Err(e)
            }
        }
    })
}

fn test_once(
    rt: tokio::runtime::Handle,
    server_config: ServerConfig,
    test_case: TestCase,
) -> Result<(), Failed> {
    let client = reqwest::Client::new();
    rt.block_on(run_test_once(&server_config, &test_case, &client))?;
    Ok(())
}

async fn run_test_once(
    server_config: &ServerConfig,
    test_case: &TestCase,
    client: &reqwest::Client,
) -> Result<()> {
    let expected_response_status =
        StatusCode::from_u16(test_case.expected_response_status).expect("Invalid status code");

    let url = format!(
        "http://{}:{}/{}",
        server_config.host, server_config.port, test_case.test_route
    );
    let mut request = client.get(&url);
    if let Some(timeout) = test_case.timeout {
        request = request.timeout(std::time::Duration::from_secs_f64(timeout));
    }

    let response = request.send().await?;
    let response_status = response.status();
    let response_body = response.text().await?;

    if response_body != test_case.expected_output {
        bail!(
            "Response body '{response_body}' doesn't match expected body '{}'",
            test_case.expected_output
        );
    }

    if response_status != expected_response_status {
        bail!("Response status {response_status} doesn't match expected status {expected_response_status}");
    }

    anyhow::Ok(())
}
