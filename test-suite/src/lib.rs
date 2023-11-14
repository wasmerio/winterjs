use libtest_mimic::{Arguments, Trial};
use reqwest::StatusCode;
use serde::Deserialize;

// Sample Test Case
// test_name = "3.7-headers"
// test_route = "3-headers"
// expected_output = "Hello, world!"
// expected_response_status = 200

#[derive(Debug, Clone, Deserialize)]
pub struct TestCase {
    pub test_name: String,
    pub test_route: String,
    pub expected_output: String,
    pub expected_response_status: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Runner {
    pub name: String,
    pub command: String,
    pub port: u16,
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub enum ERunner {
    Winter(Runner),
    Wrangler(Runner),
    WorkerD(Runner),
}

pub trait RunnerTrait {
    fn run(&self) -> Result<(), anyhow::Error>;
    fn port(&self) -> u16;
    fn name(&self) -> String;
}

impl RunnerTrait for Runner {
    fn run(&self) -> Result<(), anyhow::Error> {
        let mut command = std::process::Command::new(&self.command);
        command.args(&self.args);
        let output = command.output()?;
        println!("output: {:?}", output);
        Ok(())
    }

    fn port(&self) -> u16 {
        self.port
    }
    fn name(&self) -> String {
        self.name.clone()
    }
}

impl RunnerTrait for ERunner {
    fn run(&self) -> Result<(), anyhow::Error> {
        match self {
            ERunner::Winter(runner) => runner.run(),
            ERunner::Wrangler(runner) => runner.run(),
            ERunner::WorkerD(runner) => runner.run(),
        }
    }
    fn port(&self) -> u16 {
        match self {
            ERunner::Winter(runner) => runner.port(),
            ERunner::Wrangler(runner) => runner.port(),
            ERunner::WorkerD(runner) => runner.port(),
        }
    }
    fn name(&self) -> String {
        match self {
            ERunner::Winter(runner) => runner.name(),
            ERunner::Wrangler(runner) => runner.name(),
            ERunner::WorkerD(runner) => runner.name(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct TestConfig {
    pub matrix_runners: Vec<ERunner>,
    pub test_cases: Vec<TestCase>,
}

#[derive(Debug)]
pub struct TestManager {
    rt: tokio::runtime::Runtime,
    config: TestConfig,
}

impl TestManager {
    pub fn new(config: TestConfig) -> Result<Self, anyhow::Error> {
        let rt = tokio::runtime::Runtime::new()?;
        Ok(TestManager { rt, config })
    }

    fn collect_tests(&self) -> Result<Vec<Trial>, anyhow::Error> {
        let mut tests: Vec<Trial> = Vec::new();
        for runner in self.config.matrix_runners.iter() {
            for test_case in self.config.test_cases.iter() {
                let rt = self.rt.handle().clone();

                let mut test_name = test_case.test_name.clone();
                test_name = format!("{}-{}", runner.name(), test_name);
                let test_route = test_case.test_route.clone();
                let expected_output = test_case.expected_output.clone();
                let expected_resp_status = StatusCode::from_u16(test_case.expected_response_status)
                    .expect("Invalid status code");

                let runner_port = runner.port();

                let test = Trial::test(test_name, move || {
                    let test_route = test_route.clone();
                    let expected_output = expected_output.clone();
                    let expected_response_status = expected_resp_status;
                    rt.block_on(async move {
                        let client = reqwest::Client::new();
                        let url = format!("http://localhost:{}/{}", runner_port, test_route);
                        let response = client.get(&url).send().await?;
                        let response_status = response.status();
                        let response_body = response.text().await?;
                        assert_eq!(response_status, expected_response_status);
                        assert_eq!(response_body, expected_output);
                        anyhow::Result::<()>::Ok(())
                    })?;
                    Ok(())
                });
                tests.push(test);
            }
        }
        Ok(tests)
    }

    pub fn run_tests(self, args: &Arguments) -> Result<(), anyhow::Error> {
        let tests = self.collect_tests()?;
        libtest_mimic::run(args, tests).exit();
    }
}
