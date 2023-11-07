async function handleRequest(request) {
  // Parse the URL of the request to determine the action
  const url = new URL(request.url);
  const path = url.pathname;

  // Create a new Headers object
  const headers = new Headers({
    "Content-Type": "text/plain",
    "X-Custom-Header": "CustomValue",
  });

  // Perform action based on the request path
  switch (path) {
    case "/append":
      // Append a new header
      headers.append("X-Appended-Header", "AppendedValue");
      return new Response("Header appended", { headers });

    case "/delete":
      // Delete a header
      headers.delete("X-Custom-Header");
      return new Response("Header deleted", { headers });

    case "/get":
      // Get the value of a header
      const contentType = headers.get("Content-Type");
      return new Response(`Content-Type is ${contentType}`, { headers });

    case "/has":
      // Check if a header exists
      const hasContentType = headers.has("Content-Type");
      return new Response(`Has Content-Type: ${hasContentType}`, { headers });

    case "/set":
      // Set the value of a header
      headers.set("Content-Type", "text/html");
      return new Response("Content-Type set to text/html", { headers });

    case "/iterate":
      // Iterate over headers and collect them
      let headersList = "";
      for (const [name, value] of headers) {
        headersList += `${name}: ${value}\n`;
      }
      return new Response(`Headers iterated:\n${headersList}`, { headers });

    default:
      // Return all headers as a default response
      let allHeaders = "";
      for (const [name, value] of headers) {
        allHeaders += `${name}: ${value}\n`;
      }
      return new Response(`All Headers:\n${allHeaders}`, { headers });
  }
}

export { handleRequest };
