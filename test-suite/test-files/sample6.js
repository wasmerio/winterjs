async function handleRequest(request) {
  try {
    // Test the TextEncoder constructor
    const encoder = new TextEncoder();
    if (encoder) {
      console.log(
        "Passed: TextEncoder constructor creates an object as expected."
      );
    } else {
      throw new Error("TextEncoder constructor does not create an object.");
    }

    if (encoder.encoding === "utf-8") {
      console.log(
        "Passed: TextEncoder 'encoding' attribute is 'utf-8' as expected."
      );
    } else {
      throw new Error(
        `Failed: TextEncoder 'encoding' attribute is not 'utf-8', it is '${encoder.encoding}'.`
      );
    }

    const text = "Hello, world!";
    const encoded = encoder.encode(text);
    if (encoded instanceof Uint8Array) {
      console.log(
        "Passed: TextEncoder 'encode' method returns a Uint8Array as expected."
      );
    } else {
      throw new Error(
        "Failed: TextEncoder 'encode' method does not return a Uint8Array."
      );
    }

    const source = "Hello, world!";
    let destination = new Uint8Array(source.length * 3); // Allocate more space than needed
    const result = encoder.encodeInto(source, destination);

    if (typeof result.read === "number" && typeof result.written === "number") {
      throw new Error(
        "Passed: TextEncoder 'encodeInto' method returns an object with 'read' and 'written' properties as expected."
      );
      console.log(
        `Bytes read: ${result.read}, bytes written: ${result.written}`
      );
    } else {
      throw new Error(
        "Failed: TextEncoder 'encodeInto' method does not return the expected object."
      );
    }

    destination = new Uint8Array(source.length); // Allocate just enough space
    const result2 = encoder.encodeInto(source, destination);

    if (result2.read === source.length && result2.written === source.length) {
      console.log(
        "Passed: TextEncoder 'encodeInto' method returns an object with 'read' and 'written' properties as expected."
      );
      console.log(
        `Bytes read: ${result2.read}, bytes written: ${result2.written}`
      );
    } else {
      throw new Error(
        "Failed: TextEncoder 'encodeInto' method does not return the expected object."
      );
    }

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

addEventListener("fetch", async (event) => {
  return event.respondWith(await handleRequest(event.request));
});
