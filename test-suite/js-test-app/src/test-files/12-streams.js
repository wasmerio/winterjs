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
      // Create a readable stream
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue("Hello, ");
          controller.enqueue("Wasmer!");
          controller.close();
        },
      });

      // Read from the stream
      const reader = readableStream.getReader();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += value;
      }

      assertEquals(
        result,
        "Hello, Wasmer!",
        `Unexpected result from readable stream. Expected 'Hello, Wasmer!' but got ${result}`
      );
    } catch (error) {
      assert(false, `ReadableStream test failed: ${error}`);
    }

    try {
      let accumulatedData = "";
      const writableStream = new WritableStream({
        write(chunk) {
          accumulatedData += chunk;
        },
        close() {
          accumulatedData += "!";
        },
      });

      const writer = writableStream.getWriter();
      writer.write("Hello,");
      writer.write(" ");
      writer.write("Wasmer");
      await writer.close();

      assertEquals(
        accumulatedData,
        "Hello, Wasmer!",
        `Unexpected result from writable stream. Expected 'Hello, Wasmer!' but got ${accumulatedData}`
      );
    } catch (error) {
      assert(false, `WritableStream test failed: ${error}`);
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

// export { handleRequest };

addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(handleRequest(fetchEvent.request));
});
