// AUTOMATICALLY GENERATED. DO NOT EDIT.
"use strict";
(() => {
  // src/headers.ts
  var Headers = class {
    constructor(init) {
      this.items = {};
      if (Array.isArray(init)) {
        const items = /* @__PURE__ */ new Map();
        for (const item of init) {
          if (!Array.isArray(item) || item.length !== 2) {
            throw new Error(
              "init must be an array of [name, value] tuples"
            );
          }
          const [name, value] = item;
          this.set(name, value);
        }
      } else if (typeof init === "object") {
        for (const [name, value] of Object.entries(init)) {
          if (typeof value === "string") {
            this.set(name, value);
          } else if (Array.isArray(value)) {
            for (const x of value) {
              if (typeof x !== "string") {
                throw new Error(
                  "HeaderInit object key contained array with non-string values"
                );
              }
            }
            this.items[name] = value;
          } else {
            throw new Error(
              "HeaderInit object contained non-string values"
            );
          }
        }
      } else if (init) {
        throw new Error("init must be an array, object, or null/undefined");
      }
    }
    set(key, value) {
      if (typeof key !== "string") {
        throw new Error("key must be a string");
      }
      if (typeof value !== "string") {
        throw new Error("value must be a string");
      }
      this.items[key] = [value];
    }
    append(key, value) {
      if (typeof key !== "string") {
        throw new Error("key must be a string");
      }
      if (typeof value !== "string") {
        throw new Error("value must be a string");
      }
      if (this.items[key]) {
        this.items[key].push(value);
      } else {
        this.items[key] = [value];
      }
    }
    toList() {
      const items = [];
      for (const [name, values] of Object.entries(this.items)) {
        for (const value of values) {
          items.push([name, value]);
        }
      }
      return items;
    }
  };

  // src/text.ts
  var TextEncoder2 = class {
    encode(string) {
      const octets = [];
      const length = string.length;
      let i = 0;
      while (i < length) {
        const codePoint = string.codePointAt(i);
        let c = 0;
        let bits = 0;
        if (codePoint <= 127) {
          c = 0;
          bits = 0;
        } else if (codePoint <= 2047) {
          c = 6;
          bits = 192;
        } else if (codePoint <= 65535) {
          c = 12;
          bits = 224;
        } else if (codePoint <= 2097151) {
          c = 18;
          bits = 240;
        }
        octets.push(bits | codePoint >> c);
        c -= 6;
        while (c >= 0) {
          octets.push(128 | codePoint >> c & 63);
          c -= 6;
        }
        i += codePoint >= 65536 ? 2 : 1;
      }
      return Uint8Array.from(octets);
    }
  };
  var TextDecoder2 = class {
    decode(octets) {
      let string = "";
      let i = 0;
      while (i < octets.length) {
        let octet = octets[i];
        let bytesNeeded = 0;
        let codePoint = 0;
        if (octet <= 127) {
          bytesNeeded = 0;
          codePoint = octet & 255;
        } else if (octet <= 223) {
          bytesNeeded = 1;
          codePoint = octet & 31;
        } else if (octet <= 239) {
          bytesNeeded = 2;
          codePoint = octet & 15;
        } else if (octet <= 244) {
          bytesNeeded = 3;
          codePoint = octet & 7;
        }
        if (octets.length - i - bytesNeeded > 0) {
          var k = 0;
          while (k < bytesNeeded) {
            octet = octets[i + k + 1];
            codePoint = codePoint << 6 | octet & 63;
            k += 1;
          }
        } else {
          codePoint = 65533;
          bytesNeeded = octets.length - i;
        }
        string += String.fromCodePoint(codePoint);
        i += bytesNeeded + 1;
      }
      return string;
    }
  };

  // src/request.ts
  var Request = class {
    constructor(init) {
      if (init?.method) {
        if (typeof init.method !== "string") {
          throw new Error("method must be a string");
        }
        this.method = init.method;
      } else {
        this.method = "GET";
      }
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          this.headers = init.headers;
        } else {
          this.headers = new Headers(init.headers);
        }
      } else {
        this.headers = new Headers();
      }
      this.url = init?.url ?? "";
      this.body = init?.body;
    }
    async text() {
      return new TextDecoder().decode(this.body);
    }
    async json() {
      const v = await this.text();
      return JSON.parse(v);
    }
  };

  // src/response.ts
  var Response = class {
    constructor(body, init) {
      let status = 200;
      if (init?.status) {
        if (typeof init.status !== "number") {
          throw new Error("status must be a number");
        }
        status = init.status;
      }
      this.status = status;
      let headers;
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          headers = init.headers;
        } else {
          headers = new Headers(init.headers);
        }
      } else {
        headers = new Headers();
      }
      this.headers = headers;
      if (body) {
        if (typeof body === "string") {
          this.body = new TextEncoder().encode(body);
        } else if (body instanceof Uint8Array) {
          this.body = body;
        } else {
          throw new Error("invalid body - must be string or Uint8Array");
        }
      } else {
        this.body = new TextEncoder().encode("");
      }
      if (this.body) {
        if (!(this.body instanceof Uint8Array)) {
          throw new Error("internal error: invalid body");
        }
      }
    }
    get statusText() {
      switch (this.status) {
        case 200:
          return "OK";
        case 404:
          return "Not Found";
        default:
          return "Unknown";
      }
    }
    async json() {
      return this.text().then(JSON.parse);
    }
    async text() {
      return new TextDecoder().decode(this.body);
    }
  };

  // src/fetch_handler.ts
  var FETCH_HANDLERS = {};
  function registerFetchHandler(callback) {
    const index = Object.keys(FETCH_HANDLERS).length;
    if (index > 0) {
      throw new Error("only one fetch handler is supported");
    }
    FETCH_HANDLERS[index] = callback;
    return index;
  }
  function convertValueToResponseData(value) {
    if (value instanceof Response) {
      return value;
    } else if (typeof value == "string") {
      return new Response(value);
    } else if (typeof value === "object") {
      let status = 200;
      if ("status" in value) {
        if (typeof value.status !== "number") {
          throw new Error("status must be a number");
        }
        status = value.status;
      }
      const headers = "headers" in value ? value.headers : {};
      const body = "body" in value ? value.body : null;
      return new Response(body || void 0, { status, headers });
    } else {
      throw new Error("unsupported response type: " + JSON.stringify(value));
    }
  }
  globalThis.__wasmer_callFetchHandler = function(request) {
    if (!(request instanceof Request)) {
      throw new TypeError("request must be an instance of the Request class");
    }
    const items = Object.values(FETCH_HANDLERS);
    if (items.length === 0) {
      throw new Error("no fetch handlers registered");
    }
    let res = items[0](request);
    if (!res) {
      throw new Error("fetch handler returned null");
    }
    if (isAwaitable(res)) {
      return res.then(convertValueToResponseData);
    } else {
      const o = convertValueToResponseData(res);
      if (!(o instanceof Response)) {
        throw new Error(
          "internal error: response must be an instance of the Response class"
        );
      }
      if (o.body && !(o.body instanceof Uint8Array)) {
        throw new Error(
          "response body must be undefined/null or an Uint8Array"
        );
      }
      return o;
    }
  };
  function isAwaitable(value) {
    return value?.hasOwnProperty("then") || typeof value.then == "function";
  }

  // src/events.ts
  function addEventListener(event, callback) {
    if (typeof callback !== "function") {
      throw new Error("callback must be a function");
    }
    switch (event) {
      case "fetch":
        return registerFetchHandler(callback);
      default:
        throw new Error(`Unknown event type, "${event}"`);
    }
  }

  // src/console.ts
  function log() {
    __native_log.apply(
      null,
      Object.values(arguments).map((arg) => JSON.stringify(arg))
    );
  }

  // src/performance.ts
  function now() {
    return __native_performance_now();
  }

  // src/fetch.ts
  async function fetch(url, params) {
    const response = await new Promise(
      (resolve, reject) => {
        __native_fetch(resolve, reject, url?.toString(), params || {});
      }
    );
    return new Response(response?.body, response);
  }

  // src/index.ts
  globalThis.TextEncoder = TextEncoder2;
  globalThis.TextDecoder = TextDecoder2;
  globalThis.Headers = Headers;
  globalThis.console = { log };
  globalThis.performance = { now };
  globalThis.addEventListener = addEventListener;
  globalThis.fetch = fetch;
})();
