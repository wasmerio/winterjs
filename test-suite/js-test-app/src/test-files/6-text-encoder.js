async function handleRequest(request) {
  try {
    // Test the TextEncoder constructor
    const encoder = new TextEncoder();
    if (!encoder) {
      throw new Error("TextEncoder constructor does not create an object.");
    }

    if (encoder.encoding !== "utf-8") {
      throw new Error(
        `Failed: TextEncoder 'encoding' attribute is not 'utf-8', it is '${encoder.encoding}'.`
      );
    }

    const text = "Hello, world!";
    const encoded = encoder.encode(text);
    if (!(encoded instanceof Uint8Array)) {
      throw new Error(
        "Failed: TextEncoder 'encode' method does not return a Uint8Array."
      );
    }

    const source = "Hello, world!";
    let destination = new Uint8Array(source.length * 3); // Allocate more space than needed
    const result = encoder.encodeInto(source, destination);

    if (typeof result.read !== "number" || typeof result.written !== "number") {
      throw new Error(
        "Failed: TextEncoder 'encodeInto' method does not return the expected object."
      );
    }

    destination = new Uint8Array(source.length); // Allocate just enough space
    const result2 = encoder.encodeInto(source, destination);

    if (result2.read !== source.length || result2.written !== source.length) {
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

export { handleRequest };
