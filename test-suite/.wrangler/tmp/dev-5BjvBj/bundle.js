(() => {
  // .wrangler/tmp/bundle-YQWXdC/checked-fetch.js
  var urls = /* @__PURE__ */ new Set();
  function checkURL(request, init) {
    const url = request instanceof URL ? request : new URL(
      (typeof request === "string" ? new Request(request, init) : request).url
    );
    if (url.port && url.port !== "443" && url.protocol === "https:") {
      if (!urls.has(url.toString())) {
        urls.add(url.toString());
        console.warn(
          `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
        );
      }
    }
  }
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply(target, thisArg, argArray) {
      const [request, init] = argArray;
      checkURL(request, init);
      return Reflect.apply(target, thisArg, argArray);
    }
  });

  // ../../../../../../Users/xorcist/.nvm/versions/node/v20.7.0/lib/node_modules/wrangler/templates/middleware/common.ts
  var __facade_middleware__ = [];
  function __facade_register__(...args) {
    __facade_middleware__.push(...args.flat());
  }
  function __facade_registerInternal__(...args) {
    __facade_middleware__.unshift(...args.flat());
  }
  function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
    const [head, ...tail] = middlewareChain;
    const middlewareCtx = {
      dispatch,
      next(newRequest2, newEnv) {
        return __facade_invokeChain__(newRequest2, newEnv, ctx, dispatch, tail);
      }
    };
    return head(request, env, ctx, middlewareCtx);
  }
  function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
    return __facade_invokeChain__(request, env, ctx, dispatch, [
      ...__facade_middleware__,
      finalMiddleware
    ]);
  }

  // ../../../../../../Users/xorcist/.nvm/versions/node/v20.7.0/lib/node_modules/wrangler/templates/middleware/loader-sw.ts
  var __FACADE_EVENT_TARGET__;
  if (globalThis.MINIFLARE) {
    __FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
  } else {
    __FACADE_EVENT_TARGET__ = new EventTarget();
  }
  function __facade_isSpecialEvent__(type) {
    return type === "fetch" || type === "scheduled";
  }
  var __facade__originalAddEventListener__ = globalThis.addEventListener;
  var __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
  var __facade__originalDispatchEvent__ = globalThis.dispatchEvent;
  globalThis.addEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.addEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalAddEventListener__(type, listener, options);
    }
  };
  globalThis.removeEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.removeEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalRemoveEventListener__(type, listener, options);
    }
  };
  globalThis.dispatchEvent = function(event) {
    if (__facade_isSpecialEvent__(event.type)) {
      return __FACADE_EVENT_TARGET__.dispatchEvent(event);
    } else {
      return __facade__originalDispatchEvent__(event);
    }
  };
  globalThis.addMiddleware = __facade_register__;
  globalThis.addMiddlewareInternal = __facade_registerInternal__;
  var __facade_waitUntil__ = Symbol("__facade_waitUntil__");
  var __facade_response__ = Symbol("__facade_response__");
  var __facade_dispatched__ = Symbol("__facade_dispatched__");
  var __Facade_ExtendableEvent__ = class extends Event {
    [__facade_waitUntil__] = [];
    waitUntil(promise) {
      if (!(this instanceof __Facade_ExtendableEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this[__facade_waitUntil__].push(promise);
    }
  };
  var __Facade_FetchEvent__ = class extends __Facade_ExtendableEvent__ {
    #request;
    #passThroughOnException;
    [__facade_response__];
    [__facade_dispatched__] = false;
    constructor(type, init) {
      super(type);
      this.#request = init.request;
      this.#passThroughOnException = init.passThroughOnException;
    }
    get request() {
      return this.#request;
    }
    respondWith(response) {
      if (!(this instanceof __Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      if (this[__facade_response__] !== void 0) {
        throw new DOMException(
          "FetchEvent.respondWith() has already been called; it can only be called once.",
          "InvalidStateError"
        );
      }
      if (this[__facade_dispatched__]) {
        throw new DOMException(
          "Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.",
          "InvalidStateError"
        );
      }
      this.stopImmediatePropagation();
      this[__facade_response__] = response;
    }
    passThroughOnException() {
      if (!(this instanceof __Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#passThroughOnException();
    }
  };
  var __Facade_ScheduledEvent__ = class extends __Facade_ExtendableEvent__ {
    #scheduledTime;
    #cron;
    #noRetry;
    constructor(type, init) {
      super(type);
      this.#scheduledTime = init.scheduledTime;
      this.#cron = init.cron;
      this.#noRetry = init.noRetry;
    }
    get scheduledTime() {
      return this.#scheduledTime;
    }
    get cron() {
      return this.#cron;
    }
    noRetry() {
      if (!(this instanceof __Facade_ScheduledEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#noRetry();
    }
  };
  __facade__originalAddEventListener__("fetch", (event) => {
    const ctx = {
      waitUntil: event.waitUntil.bind(event),
      passThroughOnException: event.passThroughOnException.bind(event)
    };
    const __facade_sw_dispatch__ = function(type, init) {
      if (type === "scheduled") {
        const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
          scheduledTime: Date.now(),
          cron: init.cron ?? "",
          noRetry() {
          }
        });
        __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
        event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      }
    };
    const __facade_sw_fetch__ = function(request, _env, ctx2) {
      const facadeEvent = new __Facade_FetchEvent__("fetch", {
        request,
        passThroughOnException: ctx2.passThroughOnException
      });
      __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
      facadeEvent[__facade_dispatched__] = true;
      event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      const response = facadeEvent[__facade_response__];
      if (response === void 0) {
        throw new Error("No response!");
      }
      return response;
    };
    event.respondWith(
      __facade_invoke__(
        event.request,
        globalThis,
        ctx,
        __facade_sw_dispatch__,
        __facade_sw_fetch__
      )
    );
  });
  __facade__originalAddEventListener__("scheduled", (event) => {
    const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
      noRetry: event.noRetry.bind(event)
    });
    __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
    event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
  });

  // ../../../../../../Users/xorcist/.nvm/versions/node/v20.7.0/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
  function reduceError(e2) {
    return {
      name: e2?.name,
      message: e2?.message ?? String(e2),
      stack: e2?.stack,
      cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
    };
  }
  var jsonError = async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e2) {
      const error = reduceError(e2);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" }
      });
    }
  };
  var middleware_miniflare3_json_error_default = jsonError;

  // .wrangler/tmp/bundle-YQWXdC/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_miniflare3_json_error_default]);

  // js-test-app/dist/bundle.js
  async function e(e2) {
    try {
      try {
        new TextDecoder("invalid-encoding");
        console.error("Failed: The constructor should throw a RangeError for an invalid encoding.");
      } catch (e4) {
        if (!(e4 instanceof RangeError))
          throw new Error("Failed: The error thrown is not a RangeError.");
        console.log("Passed: Constructor throws RangeError for invalid encoding as expected.");
      }
      try {
        new TextDecoder("utf-8");
      } catch (e4) {
        throw new Error("Failed: The constructor should not throw an error for a valid encoding.");
      }
      try {
        let e4 = new TextDecoder("utf-8"), t2 = "", r = "This is the complete text from which we will take chunks.";
        const o = function* (e5) {
          let t3 = 0;
          for (; t3 < e5.length; ) {
            const r2 = e5.slice(t3, t3 + 10);
            t3 += 10;
            const o2 = new TextEncoder().encode(r2);
            yield o2;
          }
        }(r);
        for (let r2 = o.next(); !r2.done; r2 = o.next()) {
          const o2 = r2.value;
          t2 += e4.decode(o2, { stream: true });
        }
        if (t2 !== r)
          throw new Error("Failed: The decoded string does not match the source string.");
      } catch (e4) {
        throw new Error(`Failed: ${e4.message}`);
      }
      const e3 = new Uint8Array([255, 255, 255]);
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(e3), console.error("Failed: Decoding should throw a TypeError in fatal error mode.");
      } catch (e4) {
        if (!(e4 instanceof TypeError))
          throw new Error("Failed: The error thrown is not a TypeError.");
        console.log("Passed: TypeError thrown in fatal error mode as expected.");
      }
      return new Response("All tests passed!", { headers: { "content-type": "text/plain" } });
    } catch (e3) {
      return new Response(e3.message, { status: 500 });
    }
  }
  function t(t2) {
    const r = new URL(t2.url).pathname;
    return r.startsWith("/1-hello") ? async function(e2) {
      return new Response("hello");
    }() : r.startsWith("/2-blob") ? async function(e2) {
      try {
        const e3 = new Blob(["Hello, world!"], { type: "text/plain" }), t3 = await e3.text();
        return new Response(t3, { headers: { "Content-Type": e3.type, "Content-Length": e3.size.toString() } });
      } catch (e3) {
        return new Response(e3.message, { status: 500 });
      }
    }() : r.startsWith("/3-headers") ? async function(e2) {
      const t3 = new URL(e2.url).pathname, r2 = new Headers({ "Content-Type": "text/plain", "X-Custom-Header": "CustomValue" });
      if (t3.includes("/append"))
        return r2.append("X-Appended-Header", "AppendedValue"), new Response("Header appended", { headers: r2 });
      if (t3.includes("/delete"))
        return r2.delete("X-Custom-Header"), new Response("Header deleted", { headers: r2 });
      if (t3.includes("/get")) {
        const e3 = r2.get("Content-Type");
        return new Response(`Content-Type is ${e3}`, { headers: r2 });
      }
      if (t3.includes("/has")) {
        const e3 = r2.has("Content-Type");
        return new Response(`Has Content-Type: ${e3}`, { headers: r2 });
      }
      if (t3.includes("/set"))
        return r2.set("Content-Type", "text/html"), new Response("Content-Type set to text/html", { headers: r2 });
      if (t3.includes("/iterate")) {
        let e3 = "";
        for (const [t4, o2] of r2)
          e3 += `${t4}: ${o2}
`;
        return new Response(`Headers iterated:
${e3}`, { headers: r2 });
      }
      let o = "";
      for (const [e3, t4] of r2)
        o += `${e3}: ${t4}
`;
      return new Response(`All Headers:
${o}`, { headers: r2 });
    }(t2) : r.startsWith("/4-request") ? async function(e2) {
      try {
        new Request(e2);
      } catch (e3) {
        let t3 = "Error while cloning the request\n";
        return t3 += e3.message, new Response(t3, { status: 500 });
      }
      try {
        newRequest = new Request(newRequest, { method: "POST", headers: new Headers({ "X-Test-Header": "TestValue" }), referrer: "no-referrer", mode: "cors", credentials: "omit", cache: "default", redirect: "follow", integrity: "", keepalive: false, signal: null, duplex: "half", priority: "high" });
      } catch (e3) {
        let t3 = "Error while modifying the request\n";
        return t3 += e3.message, new Response(t3, { status: 500 });
      }
      try {
        newRequest.method, newRequest.url, [...newRequest.headers].reduce((e3, [t3, r2]) => (e3[t3] = r2, e3), {}), newRequest.referrer, newRequest.referrerPolicy, newRequest.mode, newRequest.credentials, newRequest.cache, newRequest.redirect, newRequest.integrity, newRequest.keepalive, newRequest.isReloadNavigation, newRequest.isHistoryNavigation, newRequest.signal, newRequest.duplex;
      } catch (e3) {
        let t3 = "Error while constructing the response\n";
        return t3 += e3.message, new Response(t3, { status: 500 });
      }
      return new Response(JSON.stringify(responseDetails, null, 2), { headers: { "Content-Type": "application/json" } });
    }(t2) : r.startsWith("/5-response") ? async function(e2) {
      const t3 = "https://example.com", r2 = { key: "value" }, o = new Headers({ "X-Custom-Header": "Test" });
      try {
        const e3 = new Response("body content", { status: 200, statusText: "OK", headers: o });
        if (200 !== e3.status)
          throw new Error("Status should be 200");
        if ("OK" !== e3.statusText)
          throw new Error('Status text should be "OK"');
        if ("Test" !== e3.headers.get("X-Custom-Header"))
          throw new Error("Custom header should be set");
      } catch (e3) {
        let t4 = "Error while basic construction of response\n";
        return t4 += e3.message, new Response(t4, { status: 500 });
      }
      try {
        const e3 = Response.error();
        if ("error" !== e3.type)
          throw new Error('Response type should be "error"');
        if (0 !== e3.status)
          throw new Error("Status for error response should be 0");
      } catch (e3) {
        let t4 = "Error while testing error response\n";
        return t4 += e3.message, new Response(t4, { status: 500 });
      }
      try {
        const e3 = Response.redirect(t3, 301);
        if (301 !== e3.status)
          throw new Error("Redirect status should be 301");
        if (e3.headers.get("Location") !== t3)
          throw new Error("Location header should match the test URL");
      } catch (e3) {
        let t4 = "Error while testing redirect response\n";
        return t4 += e3.message, new Response(t4, { status: 500 });
      }
      try {
        const e3 = Response.json(r2), t4 = await e3.json();
        if (JSON.stringify(t4) !== JSON.stringify(r2))
          throw new Error("Body data should match the test data");
      } catch (e3) {
        let t4 = "Error while testing JSON response\n";
        return t4 += e3.message, new Response(t4, { status: 500 });
      }
      return new Response("All tests passed", { headers: { "Content-Type": "text/plain" } });
    }() : r.startsWith("/6-text-encoder") ? async function(e2) {
      try {
        const e3 = new TextEncoder();
        if (!e3)
          throw new Error("TextEncoder constructor does not create an object.");
        if (console.log("Passed: TextEncoder constructor creates an object as expected."), "utf-8" !== e3.encoding)
          throw new Error(`Failed: TextEncoder 'encoding' attribute is not 'utf-8', it is '${e3.encoding}'.`);
        console.log("Passed: TextEncoder 'encoding' attribute is 'utf-8' as expected.");
        const t3 = "Hello, world!";
        if (!(e3.encode(t3) instanceof Uint8Array))
          throw new Error("Failed: TextEncoder 'encode' method does not return a Uint8Array.");
        console.log("Passed: TextEncoder 'encode' method returns a Uint8Array as expected.");
        const r2 = "Hello, world!";
        let o = new Uint8Array(3 * r2.length);
        const s = e3.encodeInto(r2, o);
        throw "number" == typeof s.read && "number" == typeof s.written ? new Error("Passed: TextEncoder 'encodeInto' method returns an object with 'read' and 'written' properties as expected.") : new Error("Failed: TextEncoder 'encodeInto' method does not return the expected object.");
      } catch (e3) {
        return new Response(e3.message, { status: 500 });
      }
    }() : r.startsWith("/7-text-decoder") ? e() : r.startsWith("/8-url") ? async function(e2) {
      try {
        const e3 = new URL("https://example.org/foo?bar=baz#qux");
        if (!e3)
          throw new Error("URL constructor does not create an object.");
        if (console.log("Passed: URL constructor creates an object as expected."), "https:" !== e3.protocol)
          throw new Error(`Failed: URL 'protocol' attribute is not 'https:', it is '${e3.protocol}'.`);
        if (console.log("Passed: URL 'protocol' attribute is 'https:' as expected."), "example.org" !== e3.host)
          throw new Error(`Failed: URL 'host' attribute is not 'example.org', it is '${e3.host}'.`);
        if (console.log("Passed: URL 'host' attribute is 'example.org' as expected."), "/foo" !== e3.pathname)
          throw new Error(`Failed: URL 'pathname' attribute is not '/foo', it is '${e3.pathname}'.`);
        if (console.log("Passed: URL 'pathname' attribute is '/foo' as expected."), "?bar=baz" !== e3.search)
          throw new Error(`Failed: URL 'search' attribute is not 'bar=baz', it is '${e3.search}'.`);
        if (console.log("Passed: URL 'search' attribute is 'bar=baz' as expected."), "#qux" !== e3.hash)
          throw new Error(`Failed: URL 'hash' attribute is not 'qux', it is '${e3.hash}'.`);
        if (console.log("Passed: URL 'hash' attribute is 'qux' as expected."), "baz" !== e3.searchParams.get("bar"))
          throw new Error(`Failed: URLSearchParams 'get' method does not return 'baz', it returns '${searchParams.get("bar")}'.`);
        console.log("Passed: URLSearchParams 'get' method returns 'baz' as expected.");
        try {
          if (!e3.toJSON())
            throw new Error("URL 'toJSON' method does not return an object.");
        } catch (e4) {
          throw new Error("Failed: URL 'toJSON' method does not return a json object.");
        }
        try {
          const e4 = new URL("/path", "https://example.com");
          console.log(`Base URL: ${e4.href}`);
        } catch (e4) {
          throw new Error("Failed: URL constructor does not create an object with a base.");
        }
        try {
          const e4 = new URL("https://example.com/base"), t3 = new URL("path", e4);
          console.log(`New URL using base: ${t3.href}`);
        } catch (e4) {
          throw new Error("Failed: URL constructor does not create an object with URL as its base.");
        }
        try {
          const e4 = new URL("https://example.org/\u{1F4A9}");
          console.log(`Unicode pathname: ${e4.pathname}`);
        } catch (e4) {
          throw new Error("Failed: URL constructor does not create an object with unicode characters.");
        }
        try {
          new URL("/path");
        } catch (e4) {
          console.log("Caught exception for relative URL without base:", e4.message);
        }
        return new Response("All tests passed!", { headers: { "content-type": "text/plain" } });
      } catch (e3) {
        return new Response(e3.message, { status: 500 });
      }
    }() : r.startsWith("/10-atob-btoa") ? async function(e2) {
      const t3 = (e3, t4) => {
        if (!e3)
          throw new Error(t4 || "Assertion failed");
      }, r2 = (e3, r3, o) => {
        t3(e3 === r3, o || `Expected ${r3} but got ${e3}`);
      };
      try {
        const e3 = "Hello, world!", o = "SGVsbG8sIHdvcmxkIQ==";
        r2(btoa(e3), o, "btoa did not encode the string correctly"), r2(atob(o), e3, "atob did not decode the string correctly");
        try {
          btoa("\0"), t3(true, "btoa handled binary data without throwing error");
        } catch (e4) {
          t3(false, "btoa should not throw error with binary data");
        }
        try {
          atob("Invalid base64 string"), t3(false, "atob should throw error with invalid base64 input");
        } catch (e4) {
          t3(true, "atob threw error as expected with invalid base64 input");
        }
        return new Response("All Tests Passed!", { headers: { "content-type": "text/plain" } });
      } catch (e3) {
        return new Response(e3.message, { status: 500 });
      }
    }() : new Response("Route Not Found", { status: 404 });
  }
  addEventListener("fetch", (e2) => {
    e2.respondWith(t(e2.request));
  });
})();
//# sourceMappingURL=bundle.js.map
