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
      const responsePromise = handleRequest(event.request);
      console.log(responsePromise instanceof Response);
      await event.waitUntil(responsePromise);
      return responsePromise;
    })()
  );
});
