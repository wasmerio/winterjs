async function handleRequest(request) {
  const testUrl = "https://example.com";
  const testData = { key: "value" };
  const testHeaders = new Headers({ "X-Custom-Header": "Test" });

  try {
    // Test the basic constructor and property accessors
    const basicResponse = new Response("body content", {
      status: 200,
      statusText: "OK",
      headers: testHeaders,
    });
    if (basicResponse.status !== 200) throw new Error("Status should be 200");
    if (basicResponse.statusText !== "OK")
      throw new Error('Status text should be "OK"');
    if (basicResponse.headers.get("X-Custom-Header") !== "Test")
      throw new Error("Custom header should be set");
  } catch (error) {
    let message = "Error while basic construction of response\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }

  try {
    // Test the Response.error() static method
    const errorResponse = Response.error();
    if (errorResponse.type !== "error")
      throw new Error('Response type should be "error"');
    if (errorResponse.status !== 0)
      throw new Error("Status for error response should be 0");
  } catch (error) {
    let message = "Error while testing error response\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }

  try {
    // Test the Response.redirect() static method
    const redirectResponse = Response.redirect(testUrl, 301);
    if (redirectResponse.status !== 301)
      throw new Error("Redirect status should be 301");
    if (redirectResponse.headers.get("Location") !== testUrl)
      throw new Error("Location header should match the test URL");
  } catch (error) {
    let message = "Error while testing redirect response\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }
  try {
    // Test the Response.json() static method
    const jsonResponse = Response.json(testData);
    const data = await jsonResponse.json();
    if (JSON.stringify(data) !== JSON.stringify(testData))
      throw new Error("Body data should match the test data");
  } catch (error) {
    let message = "Error while testing JSON response\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }

  // If all tests pass, send a success response
  return new Response("All tests passed", {
    headers: { "Content-Type": "text/plain" },
  });
}

addEventListener("fetch", async (event) => {
  return event.respondWith(await handleRequest(event.request));
});
