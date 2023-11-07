// Utility function to get chunks of data
function* nextChunk() {
  const textSource =
    "This is the complete text from which we will take chunks.";
  let currentPosition = 0;
  const CHUNK_SIZE = 10;

  while (currentPosition < textSource.length) {
    const chunk = textSource.slice(
      currentPosition,
      currentPosition + CHUNK_SIZE
    );
    currentPosition += CHUNK_SIZE;

    const encoder = new TextEncoder();
    const encodedChunk = encoder.encode(chunk);

    yield encodedChunk;
  }
}

async function handleRequest(request) {
  try {
    // Test the TextEncoder constructor
    try {
      const decoder = new TextDecoder("invalid-encoding");
      console.error(
        "Failed: The constructor should throw a RangeError for an invalid encoding."
      );
    } catch (e) {
      if (e instanceof RangeError) {
        console.log(
          "Passed: Constructor throws RangeError for invalid encoding as expected."
        );
      } else {
        throw new Error("Failed: The error thrown is not a RangeError.");
      }
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

    try {
      const encoding = "utf-8";
      let decoder = new TextDecoder(encoding);
    } catch (error) {
      throw new Error(
        "Failed: The constructor should not throw an error for a valid encoding."
      );
    }
    try {
      let string = "";
      // Create an instance of the generator
      const chunkGenerator = nextChunk();

      // Iterate over the generator
      for (
        let result = chunkGenerator.next();
        !result.done;
        result = chunkGenerator.next()
      ) {
        // Get the buffer from the result
        const buffer = result.value;
        string += decoder.decode(buffer, { stream: true });
      }

      // Decode the remaining bytes in the stream
      string += decoder.decode();

      console.log(`Decoded string: ${string}`);
    } catch (error) {
      throw new Error(`Failed: ${error.message}`);
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

    // Test the Fatal error mode
    const invalidData = new Uint8Array([0xff, 0xff, 0xff]); // Invalid UTF-8 sequence
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      decoder.decode(invalidData);
      console.error(
        "Failed: Decoding should throw a TypeError in fatal error mode."
      );
    } catch (e) {
      if (e instanceof TypeError) {
        console.log(
          "Passed: TypeError thrown in fatal error mode as expected."
        );
      } else {
        throw new Error("Failed: The error thrown is not a TypeError.");
      }
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
