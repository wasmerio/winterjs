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
pub enum Engine {
    WinterJS,
    Wrangler,
    WorkerD,
}

impl Engine {
    pub fn port(&self) -> u16 {
        match self {
            Self::WinterJS => 8080,
            Self::Wrangler => 8787,
            Self::WorkerD => 8789,
        }
    }

    pub fn name(&self) -> String {
        match self {
            Self::WinterJS => "WinterJS".to_string(),
            Self::Wrangler => "Wrangler".to_string(),
            Self::WorkerD => "workerd".to_string(),
        }
    }

    pub fn must_pass(&self) -> bool {
        match self {
            // We mostly don't care if workerd and wrangler pass our tests,
            // since the implementations aren't perfect. If they do, we log
            // the failures as a warning that the test *may* be broken, but
            // don't fail the entire test process otherwise.
            Self::WinterJS => true,
            Self::WorkerD | Self::Wrangler => false,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct EngineConfig {
    pub engine: Engine,

    // The number of seconds to run a stress test for. If this
    // is zero, stress-testing will be disabled.
    // All requests to the engine must pass for a stress-test
    // to be considered successful.
    pub stress_duration: Option<f64>,

    // The number of concurrent connections to open.
    pub max_concurrent_connections: Option<usize>,

    // The minimum number of connections that have to be made
    // for the stress test to be considered successful. The test
    // will not be stopped if this number of connections haven't
    // been made once the duration is up.
    pub min_connections: Option<usize>,

    // The maximum number of connections that can be made. Some
    // times, when making too many connections, the OS starts
    // rejecting more connections, so we limit the total number
    // of connections.
    pub max_connections: Option<usize>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TestConfig {
    #[serde(rename = "engine")]
    pub engines: Vec<EngineConfig>,

    #[serde(rename = "test_case")]
    pub test_cases: Vec<TestCase>,
}

#[derive(Debug)]
pub struct TestManager {
    rt: tokio::runtime::Runtime,
    config: TestConfig,
}

struct Tests {
    must_pass: Vec<Trial>,
    others: Vec<Trial>,
}

impl TestManager {
    pub fn new(config: TestConfig) -> Result<Self, anyhow::Error> {
        let rt = tokio::runtime::Runtime::new()?;
        Ok(TestManager { rt, config })
    }

    fn collect_tests(&self) -> Result<Tests, anyhow::Error> {
        let mut tests = Tests {
            must_pass: vec![],
            others: vec![],
        };

        for engine_config in self.config.engines.iter() {
            let test_collection = if engine_config.engine.must_pass() {
                &mut tests.must_pass
            } else {
                &mut tests.others
            };

            for test_case in self.config.test_cases.iter() {
                let test_name = format!(
                    "{}{}:{}",
                    engine_config.engine.name(),
                    if engine_config.stress_duration.is_some() {
                        "-stress"
                    } else {
                        ""
                    },
                    test_case.test_name
                );

                if test_case.skip.is_some() {
                    println!("Skipping {test_name}");
                    continue;
                }

                let rt = self.rt.handle().clone();
                let test_case = test_case.clone();

                let test = if engine_config.stress_duration.is_some() {
                    let engine_config = engine_config.clone();
                    let test_name_clone = test_name.clone();
                    Trial::test(test_name, move || {
                        stress_test(rt, engine_config, test_case, test_name_clone)
                    })
                } else {
                    let engine = engine_config.engine.clone();
                    Trial::test(test_name, move || test_once(rt, engine, test_case))
                };

                test_collection.push(test);
            }
        }

        Ok(tests)
    }

    pub fn run_tests(self, mut args: Arguments) -> Result<(), anyhow::Error> {
        let tests = self.collect_tests()?;
        if self
            .config
            .engines
            .iter()
            .any(|e| e.stress_duration.is_some())
        {
            // Use a single thread for stress tests, since the many concurrent
            // connections can exhaust available ports and cause failures
            args.test_threads = Some(1);
        }
        let conclusion = libtest_mimic::run(&args, tests.others);
        if conclusion.has_failed() {
            println!(
                "Warning: Some tests failed on other engines, check \
                test output above to make sure the test cases are correct"
            );
        }

        if libtest_mimic::run(&args, tests.must_pass).has_failed() {
            bail!("Some tests failed")
        }

        Ok(())
    }
}

fn stress_test(
    rt: tokio::runtime::Handle,
    config: EngineConfig,
    test_case: TestCase,
    test_name: String,
) -> Result<(), Failed> {
    rt.block_on(async move {
        let client = reqwest::ClientBuilder::new()
            .pool_max_idle_per_host(100)
            .build()?;

        let duration = config
            .stress_duration
            .expect("stress_test must be called with an engine config that has a stress duration");
        if duration <= 0.0 {
            return Err("Stress test duration must be greater than zero".into());
        }

        let min_connections = config.min_connections.unwrap_or_default();
        let Some(max_concurrent_connections) = config.max_concurrent_connections else {
            return Err("max_concurrent_connections must be specified for all stress tests".into());
        };

        let mut futures = FuturesUnordered::new();

        let mut error = None;
        let mut connections = 0;

        let duration = std::time::Duration::from_secs_f64(duration);
        let start_instant = std::time::Instant::now();

        loop {
            if start_instant.elapsed() >= duration && connections >= min_connections {
                break;
            }

            if let Some(max_connections) = config.max_connections {
                if connections >= max_connections {
                    break;
                }
            }

            while futures.len() < max_concurrent_connections {
                futures.push(run_test_once(&config.engine, &test_case, &client));
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
                println!("Test {test_name} - {connections} successful connections");
                Ok(())
            }
            Some(e) => {
                println!("Test {test_name} - error after {connections} connections");
                Err(e)
            }
        }
    })
}

fn test_once(
    rt: tokio::runtime::Handle,
    engine: Engine,
    test_case: TestCase,
) -> Result<(), Failed> {
    let client = reqwest::Client::new();
    rt.block_on(run_test_once(&engine, &test_case, &client))?;
    Ok(())
}

async fn run_test_once(
    engine: &Engine,
    test_case: &TestCase,
    client: &reqwest::Client,
) -> Result<()> {
    let runner_port = engine.port();
    let expected_response_status =
        StatusCode::from_u16(test_case.expected_response_status).expect("Invalid status code");

    let url = format!("http://localhost:{}/{}", runner_port, test_case.test_route);
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
