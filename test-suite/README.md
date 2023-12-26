# Winter JS Test Suite Guide

This guide explains you how to use the WinterJS test suite in CI with runners such as winter, wrangler, etc.

## Description

This section explains about the project and the structure of the project.

To test WinterJS's core functionality such as readable stream, fetching, etc. we first have to make some JavaScript tests, we then run this tests with a runner for instance, WinterJS and then we try to make an http request to that endpoint and winter's runner runs that specific piece of functionality.

Example:

Let's say we want to test if mathematical operators work correctly.

So to achieve this we write a test for this by making it a function, let's say `test-add` and serve it on an endpoint `/test-add`. Then making a post request to this specific endpoint would then in turn run our code to add a number given by the user in the request body let's say 5, and would return a response of 6. Thus testing that addition works as expected.

### Structure

The test suite directory contains two sub projects:

1. `js-test-app`
2. The `test-suite` iteself

#### `js-test-app`

This project is a node based project which contains the source code to all the test files written in JavaScript. As edge based runners can only run a single file so **Rollup** is used to bundle everything together and output a `bundle.js` in the **dist** directory.

The code lies in the `src` directory. This directory contains two important things.

1. `test-files` directory
2. `main.js` file

The `test-files` directory contains all the tests seperated into their respected files such as:

1. `1-hello.js`
2. `2-blob.js`
   ... and so on.

These tests export a function for running their specific functionality.

This directory also contains an `index.js` files which re-exports all the files from above for an easier import.

The `main.js` file contains the code to bind the handler with all the files above. It makes a single handler and seperates each test in their seperate paths. It uses the if condition on the url's path to conditionally run the specific test when called to a specific path.

For example, when the project is compiled and ran. The test contained in the file `1-hello.js` could be ran by making a request to `/1-hello`.

#### `test-suite`

The test suite can be understanded as kind of like an automation suite which depends on the `tests.toml` file located under the `tests` directory.

The structure of the `tests.toml` is as follows:

```toml
matrix_runners = ["Winter", "Wrangler"]

[[test_cases]]
test_name = "1-hello"
test_route = "1-hello"
expected_output = "hello"
expected_response_status = 200

[[test_cases]]
test_name = "2-blob"
test_route = "2-blob"
expected_output = "Hello, world!"
expected_response_status = 200
```

The `matrix_runners` defines the runners we want to use for testing our suite.

This runner is used the run the `bundle.js` that we compiled above. Then this test suite takes a bunch of `test_cases` as a vector which defines:

1. `test_name`: The name of the test
2. `test_route`: The route on which this test will run. Example, to test the blob functionality we run a request on the path `2-blob` .
3. `expected_output`: This is the output we want the ideal response from the request we make to that specific path.
4. `expected_response_status`: This is the response status we expect from hitting that specific endpoint.

All these `test_cases` are deserialized from this toml file and read into a vector which the `test-suite` tests by making a request reading specific test_case.
