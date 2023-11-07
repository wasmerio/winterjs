async function handleRequest(request) {
  // Clone the request to ensure it's a new, mutable Request object
  try {
    let newRequest = new Request(request);
  } catch (error) {
    let message = "Error while cloning the request\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }

  try {
    // Modify the Request object as per the `RequestInit` dictionary
    newRequest = new Request(newRequest, {
      method: "POST",
      headers: new Headers({ "X-Test-Header": "TestValue" }),
      referrer: "no-referrer",
      mode: "cors",
      credentials: "omit",
      cache: "default",
      redirect: "follow",
      integrity: "",
      keepalive: false,
      signal: null,
      duplex: "half",
      priority: "high",
    });
  } catch (error) {
    let message = "Error while modifying the request\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }

  try {
    // Construct a response containing details from the Request object
    const responseDetails = {
      method: newRequest.method,
      url: newRequest.url,
      headers: [...newRequest.headers].reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {}),
      referrer: newRequest.referrer,
      referrerPolicy: newRequest.referrerPolicy,
      mode: newRequest.mode,
      credentials: newRequest.credentials,
      cache: newRequest.cache,
      redirect: newRequest.redirect,
      integrity: newRequest.integrity,
      keepalive: newRequest.keepalive,
      isReloadNavigation: newRequest.isReloadNavigation,
      isHistoryNavigation: newRequest.isHistoryNavigation,
      signal: newRequest.signal,
      duplex: newRequest.duplex,
    };
  } catch (error) {
    let message = "Error while constructing the response\n";
    message += error.message;
    return new Response(message, { status: 500 });
  }

  // Return a JSON response with the Request details
  return new Response(JSON.stringify(responseDetails, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}

export { handleRequest };
