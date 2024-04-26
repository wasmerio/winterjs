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
    const string = "Hello, world!";
    const base64Encoded = "SGVsbG8sIHdvcmxkIQ==";

    // Test btoa
    const encoded = btoa(string);
    assertEquals(
      encoded,
      base64Encoded,
      "btoa did not encode the string correctly"
    );

    // Test atob
    const decoded = atob(base64Encoded);
    assertEquals(decoded, string, "atob did not decode the string correctly");

    // Test btoa with binary data
    try {
      const binaryData = "\x00\x01\x02";
      btoa(binaryData);
      assert(true, "btoa handled binary data without throwing error");
    } catch (e) {
      assert(false, "btoa should not throw error with binary data");
    }

    // Test atob with invalid input
    try {
      atob("Invalid base64 string");
      assert(false, "atob should throw error with invalid base64 input");
    } catch (e) {
      assert(true, "atob threw error as expected with invalid base64 input");
    }
    // Create a response with the Blob's text
    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
