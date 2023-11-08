async function handleRequest(request) {
  try {
    // Using the URL constructor without base URL
    const myURL = new URL("https://example.org/foo?bar=baz#qux");

    // check if the URL is valid
    if (myURL) {
      console.log("Passed: URL constructor creates an object as expected.");
    } else {
      throw new Error("URL constructor does not create an object.");
    }

    if (myURL.protocol === "https:") {
      console.log("Passed: URL 'protocol' attribute is 'https:' as expected.");
    } else {
      throw new Error(
        `Failed: URL 'protocol' attribute is not 'https:', it is '${myURL.protocol}'.`
      );
    }

    // if (myURL.port === 443) {
    //   console.log("Passed: URL 'port' attribute is '443' as expected.");
    // } else {
    //   throw new Error(
    //     `Failed: URL 'port' attribute is not '443', it is '${myURL.port}'.`
    //   );
    // }

    if (myURL.host === "example.org") {
      console.log("Passed: URL 'host' attribute is 'example.org' as expected.");
    } else {
      throw new Error(
        `Failed: URL 'host' attribute is not 'example.org', it is '${myURL.host}'.`
      );
    }

    if (myURL.pathname === "/foo") {
      console.log("Passed: URL 'pathname' attribute is '/foo' as expected.");
    } else {
      throw new Error(
        `Failed: URL 'pathname' attribute is not '/foo', it is '${myURL.pathname}'.`
      );
    }

    if (myURL.search === "?bar=baz") {
      console.log("Passed: URL 'search' attribute is 'bar=baz' as expected.");
    } else {
      throw new Error(
        `Failed: URL 'search' attribute is not 'bar=baz', it is '${myURL.search}'.`
      );
    }

    if (myURL.hash === "#qux") {
      console.log("Passed: URL 'hash' attribute is 'qux' as expected.");
    } else {
      throw new Error(
        `Failed: URL 'hash' attribute is not 'qux', it is '${myURL.hash}'.`
      );
    }

    // check if search params bar is baz in myURL
    if (myURL.searchParams.get("bar") === "baz") {
      console.log(
        "Passed: URLSearchParams 'get' method returns 'baz' as expected."
      );
    } else {
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
      const relativeURL = new URL("/path", "https://example.com");
      console.log(`Base URL: ${relativeURL.href}`);
    } catch (error) {
      throw new Error(
        `Failed: URL constructor does not create an object with a base.`
      );
    }
    // Testing URL with a base
    try {
      const baseURL = new URL("https://example.com/base");
      const newURLUsingBase = new URL("path", baseURL);
      console.log(`New URL using base: ${newURLUsingBase.href}`);
    } catch (error) {
      throw new Error(
        `Failed: URL constructor does not create an object with URL as its base.`
      );
    }

    // Test URL with unicode characters

    try {
      // URL with unicode characters
      const unicodeURL = new URL("https://example.org/💩");
      console.log(`Unicode pathname: ${unicodeURL.pathname}`);
    } catch (error) {
      throw new Error(
        `Failed: URL constructor does not create an object with unicode characters.`
      );
    }

    try {
      const relativeURLWithoutBase = new URL("/path");
    } catch (e) {
      console.log("Caught exception for relative URL without base:", e.message);
    }

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
