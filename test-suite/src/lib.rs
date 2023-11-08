use libtest_mimic::{Arguments, Trial};
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
pub struct TestConfig {
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
        for test_case in self.config.test_cases.iter() {
            let rt = self.rt.handle().clone();

            let test_name = test_case.test_name.clone();
            let test_route = test_case.test_route.clone();
            let expected_output = test_case.expected_output.clone();
            let expected_resp_status = test_case.expected_response_status;

            let test = Trial::test(test_name, move || {
                let test_route = test_route.clone();
                let expected_output = expected_output.clone();
                // let expected_response_status = expected_resp_status;
                rt.block_on(async move {
                    let client = reqwest::Client::new();
                    let url = format!("http://localhost:8080/{}", test_route);
                    let response = client.get(&url).send().await?;
                    // let response_status = response.status();
                    let response_body = response.text().await?;
                    // assert_eq!(response_status, expected_response_status.try_into()?);
                    assert_eq!(response_body, expected_output);
                    anyhow::Result::<()>::Ok(())
                })?;
                Ok(())
            });
            tests.push(test);
        }
        Ok(tests)
    }

    pub fn run_tests(self, args: &Arguments) -> Result<(), anyhow::Error> {
        let tests = self.collect_tests()?;
        libtest_mimic::run(args, tests).exit();
    }
}
