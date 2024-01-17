async function handleRequest(request) {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  };

  const assertEquals = (actual, expected, message) => {
    assert(
      actual === expected,
      message || `Expected ${expected} but got ${actual}`
    );
  };
  try {
    // Test fetch with following methods
    // GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH, TRACE

    const url = "https://winter-fetch-tests.wasmer.app";

    // Test GET
    try {
      const REQUEST_METHOD = "GET";
      const response = await fetch(url, {
        method: REQUEST_METHOD,
      });
      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${REQUEST_METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "GET request successful",
        `Unexpected response body for ${REQUEST_METHOD} request. Expected 'GET request successful' but got ${text}`
      );
    } catch (error) {
      assert(false, `GET request failed: ${error}`);
    }

    // Test POST
    try {
      const REQUEST_METHOD = "POST";

      const response = await fetch(url, {
        method: REQUEST_METHOD,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: "Winter",
        }),
      });

      assertEquals(
        response.status,
        201,
        `Status code mismatch for ${REQUEST_METHOD}, expected 201 but got ${response.status}`
      );

      const text = await response.json();
      const data = { name: "Winter" };
      assertEquals(
        JSON.stringify(text),
        JSON.stringify(data),
        `Unexpected response body for ${REQUEST_METHOD} request. Expected { name: 'Winter' } but got ${text}`
      );
    } catch (error) {
      assert(false, `POST request failed: ${error}`);
    }

    // Test PUT
    try {
      const REQUEST_METHOD = "PUT";
      const response = await fetch(url, {
        method: REQUEST_METHOD,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: "Winter",
        }),
      });

      assertEquals(
        response.status,
        201,
        `Status code mismatch for ${REQUEST_METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.json();
      const data = { name: "Winter" };
      assertEquals(
        JSON.stringify(text),
        JSON.stringify(data),
        `Unexpected response body for ${REQUEST_METHOD} request. Expected { name: 'Winter' } but got ${text}`
      );
    } catch (error) {
      assert(false, `PUT request failed: ${error}`);
    }

    // Test PATCH
    try {
      const REQUEST_METHOD = "PATCH";
      const response = await fetch(url, {
        method: REQUEST_METHOD,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Winter",
        }),
      });

      assertEquals(
        response.status,
        201,
        `Status code mismatch for ${REQUEST_METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.json();
      const data = { name: "Winter" };

      assertEquals(
        JSON.stringify(text),
        JSON.stringify(data),
        `Unexpected response body for ${REQUEST_METHOD} request. Expected { name: 'Winter' } but got ${text}`
      );
    } catch (error) {
      assert(false, `PATCH request failed: ${error}`);
    }

    // Test DELETE
    try {
      const REQUEST_METHOD = "DELETE";
      const response = await fetch(url, {
        method: REQUEST_METHOD,
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${REQUEST_METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "DELETE request successful",
        `Unexpected response body for ${REQUEST_METHOD} request. Expected 'DELETE request successful' but got ${text}`
      );
    } catch (error) {
      assert(false, `DELETE request failed: ${error}`);
    }

    // Test HEAD
    try {
      const REQUEST_METHOD = "HEAD";
      const response = await fetch(url, {
        method: REQUEST_METHOD,
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${REQUEST_METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "",
        `Unexpected response body for ${REQUEST_METHOD} request. Expected empty string but got ${text}`
      );
    } catch (error) {
      assert(false, `HEAD request failed: ${error}`);
    }

    // Test TRACE
    try {
      const REQUEST_METHOD = "TRACE";
      // create request with some query params
      const response = await fetch(url + "?name=Winter", {
        method: REQUEST_METHOD,
      });
      return new Response('TRACE request succeeded when it should have failed', { status: 500 });
    } catch (error) {
    }

    // Test CONNECT
    try {
      const REQUEST_METHOD = "CONNECT";
      // create request with some query params
      const response = await fetch(url + "?name=Winter", {
        method: REQUEST_METHOD,
      });
      return new Response('CONNECT request succeeded when it should have failed', { status: 500 });
    } catch (error) {
    }

    // Test OPTIONS
    try {
      const REQUEST_METHOD = "OPTIONS";
      const response = await fetch(url, {
        method: "OPTIONS",
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${REQUEST_METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "",
        `Unexpected response body for ${REQUEST_METHOD} request. Expected empty string but got ${text}`
      );

      //   check the allow header
      assertEquals(
        response.headers.get("allow"),
        // TODO: fix the deployed app to not return two spaces before TRACE, and fix here
        "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS,  TRACE",
        `Allow header is incorrect for ${REQUEST_METHOD} request. Expected 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS,  TRACE' but got "${response.headers.get(
          "allow"
        )}"`
      );
    } catch (error) {
      assert(false, `OPTIONS request failed: ${error}`);
    }

    // Create a response with the Blob's text
    return new Response("All Tests Passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };