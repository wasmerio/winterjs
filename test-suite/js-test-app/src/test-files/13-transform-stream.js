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
    try {
      let transformedData = "";
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk.toUpperCase());
        },
      });

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue("Hello, ");
          controller.enqueue("Wasmer!");
          controller.close();
        },
      });

      const writable = new WritableStream({
        write(chunk) {
          transformedData += chunk;
        },
      });

      // Connect the streams
      await readable.pipeThrough(transformStream).pipeTo(writable);

      assertEquals(
        transformedData,
        "HELLO, WASMER!",
        `Unexpected result from transform stream. Expected 'HELLO, WASMER!' but got ${transformedData}`
      );
    } catch (error) {
      assert(false, `TransformStream test failed: ${error}`);
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
