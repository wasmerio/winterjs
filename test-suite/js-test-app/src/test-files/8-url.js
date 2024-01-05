async function handleRequest(request) {
  try {
    // Using the URL constructor without base URL
    const myURL = new URL("https://example.org:443/foo?bar=baz#qux");

    // check if the URL is valid
    if (!myURL) {
      throw new Error("URL constructor does not create an object.");
    }

    if (myURL.protocol !== "https:") {
      throw new Error(
        `Failed: URL 'protocol' attribute is not 'https:', it is '${myURL.protocol}'.`
      );
    }

    if (myURL.port !== 443) {
      throw new Error(
        `Failed: URL 'port' attribute is not '443', it is '${myURL.port}'.`
      );
    }

    if (myURL.host !== "example.org") {
      throw new Error(
        `Failed: URL 'host' attribute is not 'example.org', it is '${myURL.host}'.`
      );
    }

    if (myURL.pathname !== "/foo") {
      throw new Error(
        `Failed: URL 'pathname' attribute is not '/foo', it is '${myURL.pathname}'.`
      );
    }

    if (myURL.search !== "?bar=baz") {
      throw new Error(
        `Failed: URL 'search' attribute is not '?bar=baz', it is '${myURL.search}'.`
      );
    }

    if (myURL.hash !== "#qux") {
      throw new Error(
        `Failed: URL 'hash' attribute is not '#qux', it is '${myURL.hash}'.`
      );
    }

    // check if search params bar is baz in myURL
    if (myURL.searchParams.get("bar") !== "baz") {
      throw new Error(
        `Failed: URLSearchParams 'get' method does not return 'baz', it returns '${searchParams.get(
          "bar"
        )}'.`
      );
    }

    // Try converting it to json

    try {
      const urlJSON = myURL.toJSON();
      //   check if urlJSON is valid
      if (!urlJSON) {
        throw new Error("URL 'toJSON' method does not return an object.");
      }
    } catch (error) {
      throw new Error(
        `Failed: URL 'toJSON' method does not return a json object.`
      );
    }

    // Testing URL with a base
    try {
      const _ = new URL("/path", "https://example.com");
    } catch (error) {
      throw new Error(
        `Failed: URL constructor does not create an object with a base.`
      );
    }
    // Testing URL with a base
    try {
      const baseURL = new URL("https://example.com/base");
      const _ = new URL("path", baseURL);
    } catch (error) {
      throw new Error(
        `Failed: URL constructor does not create an object with URL as its base.`
      );
    }

    // Test URL with unicode characters

    try {
      // URL with unicode characters
      const _ = new URL("https://example.org/🔥");
    } catch (error) {
      throw new Error(
        `Failed: URL constructor does not create an object with unicode characters.`
      );
    }

    try {
      const _ = new URL("/path");
      return new Response('Creating relative URL without a base succeeded when it should have failed', { status: 500 });
    } catch (e) {
    }

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
