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

    // const url = "https://winter-fetch-tests.wasmer.app";
    const url = "http://localhost:3000";

    // Test GET
    try {
      const METHOD = "GET";
      const response = await fetch(url, {
        method: METHOD,
      });
      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "GET request successful",
        `Unexpected response body for ${METHOD} request. Expected 'GET request successful' but got ${text}`
      );
    } catch (error) {
      assert(false, "GET request failed");
    }

    // Test POST

    try {
      const METHOD = "POST";
      const response = await fetch(url, {
        method: METHOD,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Winter",
        }),
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.json();
      assertEquals(
        text,
        { name: "Winter" },
        `Unexpected response body for ${METHOD} request. Expected { name: 'Winter' } but got ${text}`
      );
    } catch (error) {
      assert(false, "POST request failed");
    }

    // Test PUT
    try {
      const METHOD = "PUT";
      const response = await fetch(url, {
        method: METHOD,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Winter",
        }),
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.json();
      assertEquals(
        text,
        { name: "Winter" },
        `Unexpected response body for ${METHOD} request. Expected { name: 'Winter' } but got ${text}`
      );
    } catch (error) {
      assert(false, "POST request failed");
    }

    // Test PATCH
    try {
      const METHOD = "PATCH";
      const response = await fetch(url, {
        method: METHOD,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Winter",
        }),
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.json();

      assertEquals(
        text,
        { name: "Winter" },
        `Unexpected response body for ${METHOD} request. Expected { name: 'Winter' } but got ${text}`
      );
    } catch (error) {
      assert(false, "PATCH request failed");
    }

    // Test DELETE
    try {
      const METHOD = "DELETE";
      const response = await fetch(url, {
        method: METHOD,
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "DELETE request successful",
        `Unexpected response body for ${METHOD} request. Expected 'DELETE request successful' but got ${text}`
      );
    } catch (error) {
      assert(false, "DELETE request failed");
    }

    // Test HEAD
    try {
      const METHOD = "HEAD";
      const response = await fetch(url, {
        method: METHOD,
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "",
        `Unexpected response body for ${METHOD} request. Expected empty string but got ${text}`
      );
    } catch (error) {
      assert(false, "HEAD request failed");
    }

    // Test TRACE
    try {
      const METHOD = "TRACE";
      // create request with some query params
      const response = await fetch(url + "?name=Winter", {
        method: METHOD,
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "name=Winter",
        `Unexpected response body for ${METHOD} request. Expected 'name=Winter' but got ${text}`
      );
    } catch (error) {
      assert(false, "TRACE request failed");
    }

    // Test OPTIONS
    try {
      const METHOD = "OPTIONS";
      const response = await fetch(url, {
        method: "OPTIONS",
      });

      assertEquals(
        response.status,
        200,
        `Status code mismatch for ${METHOD}, expected 200 but got ${response.status}`
      );

      const text = await response.text();
      assertEquals(
        text,
        "",
        `Unexpected response body for ${METHOD} request. Expected empty string but got ${text}`
      );

      //   check the allow header
      assertEquals(
        response.headers.get("allow"),
        "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE",
        `Allow header is incorrect for ${METHOD} request. Expected 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE' but got ${response.headers.get(
          "allow"
        )}`
      );
    } catch (error) {
      assert(false, "OPTIONS request failed");
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
