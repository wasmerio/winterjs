async function handleRequest(request) {
  try {
    // Create a response with the Blob's text
    return new Response("Hello World!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      // by definition, waitUntil is used to perform work *after* the handler
      // has returned, so we can't verify it's working since any verification
      // we do would be within the handler itself. We just check that it doesn't
      // throw an error here.
      event.waitUntil(handleRequest(event.request));
      return handleRequest(event.request);
    })()
  );
});
