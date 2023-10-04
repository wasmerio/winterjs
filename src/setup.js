// interface RequestInit {
//     /** A BodyInit object or null to set request's body. */
//     body?: BodyInit | null;
//     /** A string indicating how the request will interact with the browser's cache to set request's cache. */
//     cache?: RequestCache;
//     /** A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials. */
//     credentials?: RequestCredentials;
//     /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
//     headers?: HeadersInit;
//     /** A cryptographic hash of the resource to be fetched by request. Sets request's integrity. */
//     integrity?: string;
//     /** A boolean to set request's keepalive. */
//     keepalive?: boolean;
//     /** A string to set request's method. */
//     method?: string;
//     /** A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode. */
//     mode?: RequestMode;
//     /** A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect. */
//     redirect?: RequestRedirect;
//     /** A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer. */
//     referrer?: string;
//     /** A referrer policy to set request's referrerPolicy. */
//     referrerPolicy?: ReferrerPolicy;
//     /** An AbortSignal to set request's signal. */
//     signal?: AbortSignal | null;
//     /** Can only be null. Used to disassociate request from any Window. */
//     window?: null;
// }

class Headers {
  constructor(init) {
    this.items = {};

    if (Array.isArray(init)) {
      const items = new Map();
      for (const item of init) {
        if (!Array.isArray(item) || item.length !== 2) {
          throw new Error('init must be an array of [name, value] tuples');
        }
        const [name, value] = item;
        this.set(name, value);
      }
    } else if (typeof init === 'object') {
      for (const [name, value] of Object.entries(init)) {
        if (typeof value === 'string') {
          this.set(name, value);
        } else if (Array.isArray(value)) {
          for (const x of value) {
            if (typeof x !== 'string') {
              throw new Error('HeaderInit object key contained array with non-string values');
            }
          }
          this.items[name] = value;
        } else {
          throw new Error('HeaderInit object contained non-string values');
        }
      }
    } else if (init) {
      throw new Error('init must be an array, object, or null/undefined');
    }
  }

  set(key, value) {
    if (typeof key !== 'string') {
      throw new Error('key must be a string');
    }
    if (typeof value !== 'string') {
      throw new Error('value must be a string');
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
}

class Request {
  constructor(init) {
    if (init?.method) {
      if (typeof init.method !== 'string') {
        throw new Error('method must be a string');
      }
      this.method = init.method;
    } else {
      this.method = 'GET';
    }

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        this.headers = headers;
      } else {
        this.headers = new Headers(init.headers);
      }
    } else {
      this.headers = new Headers();
    }

    // FIXME: validate url
    this.url = init?.url ?? '';

    // FIXME: implement body validation / conversion
    this.body = init.body;
  }


  async text() {
    return new TextDecoder().decode(this.body);
  }

  async json() {
    const v = await this.text();
    return JSON.parse(v);
  }
}
// Needed to make the class accessible from Rust code.
globalThis.Request = Request;

// interface ResponseInit {
//     headers?: HeadersInit;
//     status?: number;
//     statusText?: string;
// }

class Response {
  constructor(body, init) {
    let status = 200;
    if (init?.status) {
      if (typeof init.status !== 'number') {
        throw new Error('status must be a number');
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
      if (typeof body === 'string') {
        this.body = new TextEncoder().encode(body);
      } else if (body instanceof Uint8Array) {
        this.body = body;
      } else {
        throw new Error('invalid body - must be string or Uint8Array');
      }
    } else {
      this.body = new TextEncoder().encode('');
    }

    // TODO: remove, just for debugging
    if (this.body) {
      if (!(this.body instanceof Uint8Array)) {
        throw new Error('internal error: invalid body');
      }
    }
  }

  get statusText() {
    // FIXME: fill this in!
    switch (this.status) {
      case 200: return 'OK';
      case 404: return 'Not Found';
      default: return 'Unknown';
    }
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
}

// Needed to make the class accessible from Rust code.
globalThis.Response = Response;

class FetchEvent {
  constructor(request) {
    this.request = request;
  }

  respondWith(response) {
    this.__response = response;
  }
}

(function() {
    // performance
    if ((typeof __native_performance_now) !== 'function') {
      throw new Error("setup error: __native_performance_now not found");
    }
    globalThis.performance = {
        now: __native_performance_now,
    };

    // console
    if ((typeof __native_log) !== 'function') {
      throw new Error("setup error: __native_log not found");
    }
    globalThis.console = {
        log: function() {
            __native_log.apply(null, Object.values(arguments).map(JSON.stringify));
        }
    };

    // fetch
    if ((typeof __native_fetch) !== 'undefined') {
      globalThis.fetch = function (url, params) {
        let result = new Promise((resolve, reject) => {
          __native_fetch(resolve, reject, url?.toString(), params || {});
        });
        return result;
      };
    }

    // events
    const FETCH_HANDLERS = {};

    globalThis.addEventListener = function(ev, callback) {
      if (ev !== 'fetch') {
        throw new Error('only the "fetch" event is supported');
      }

      if ((typeof callback) !== 'function') {
        throw new Error('callback must be a function');
      }

      const index = Object.keys(FETCH_HANDLERS).length;

      // TODO: support multiple handlers
      if (index > 0) {
        throw new Error('only one fetch handler is supported');
      }
      FETCH_HANDLERS[index] = callback;
      return index;
    };

    function convertValueToResponseData(value) {
      const ty = typeof value;
      if (value instanceof Response) {
        return value;
      } else if (ty === 'string') {
        return new Response(value);
      } else if (ty === 'object') {
        let status = 200;
        if ('status' in value) {
          if (typeof status !== 'number') {
            throw new Error('status must be a number');
          }
          status = value.status;
        } 

        let headers = {};
        if ('headers' in value) {
          headers = value.headers;
        }
        return new Response(value.body, {status, headers});
      } else {
        throw new Error('unsupported response type: ' + JSON.stringify(value));
      }
    }

    globalThis.__wasmer_callFetchHandler = function(request) {
      // FIXME: add support for multiple handlers?

      if (!(request instanceof Request)) {
        throw new Error('request must be an instance of the Request class');
      }

      let event = new FetchEvent(request);
      
      const items = Object.values(FETCH_HANDLERS);
      if (items.length === 0) {
        throw new Error("no fetch handlers registered");
      }

      let res = items[0](event);

      if (event.__response) {
        if (typeof(event.__response) !== "object" && typeof(event.__response) !== "string") {
          throw new Error("the argument to FetchEvent.respondWith must be an object or a string");
        }

        res = event.__response;
      }

      if (!res) {
        throw new Error("fetch handler returned null");
      }

      if (res?.then && (typeof res.then) === 'function') {
        return res.then(convertValueToResponseData);
      } else {
        const o = convertValueToResponseData(res);
        if (!(o instanceof Response)) {
          throw new Error('internal error: response must be an instance of the Response class');
        }
        if (o.body && !(o.body instanceof Uint8Array)) {
          throw new Error('response body must be undefined/null or an Uint8Array');
        }
        return o;
      }
    };
})()


// Taken from.
//
//  TODO: this should be implemented in Rust
//
// https://gist.githubusercontent.com/Yaffle/5458286/raw/1aa5caa5cdd9938fe0fe202357db6c6b33af24f4/TextEncoderTextDecoder.js
// TextEncoder/TextDecoder polyfills for utf-8 - an implementation of TextEncoder/TextDecoder APIs
// Written in 2013 by Viktor Mukhachev <vic99999@yandex.ru>
// To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
// You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

// Some important notes about the polyfill below:
// Native TextEncoder/TextDecoder implementation is overwritten
// String.prototype.codePointAt polyfill not included, as well as String.fromCodePoint
// TextEncoder.prototype.encode returns a regular array instead of Uint8Array
// No options (fatal of the TextDecoder constructor and stream of the TextDecoder.prototype.decode method) are supported.
// TextDecoder.prototype.decode does not valid byte sequences
// This is a demonstrative implementation not intended to have the best performance

// http://encoding.spec.whatwg.org/#textencoder

// http://encoding.spec.whatwg.org/#textencoder

function TextEncoder() {
}

TextEncoder.prototype.encode = function (string) {
  var octets = [];
  var length = string.length;
  var i = 0;
  while (i < length) {
    var codePoint = string.codePointAt(i);
    var c = 0;
    var bits = 0;
    if (codePoint <= 0x0000007F) {
      c = 0;
      bits = 0x00;
    } else if (codePoint <= 0x000007FF) {
      c = 6;
      bits = 0xC0;
    } else if (codePoint <= 0x0000FFFF) {
      c = 12;
      bits = 0xE0;
    } else if (codePoint <= 0x001FFFFF) {
      c = 18;
      bits = 0xF0;
    }
    octets.push(bits | (codePoint >> c));
    c -= 6;
    while (c >= 0) {
      octets.push(0x80 | ((codePoint >> c) & 0x3F));
      c -= 6;
    }
    i += codePoint >= 0x10000 ? 2 : 1;
  }
  return Uint8Array.from(octets);
};

function TextDecoder() {
}

TextDecoder.prototype.decode = function (octets) {
  var string = "";
  var i = 0;
  while (i < octets.length) {
    var octet = octets[i];
    var bytesNeeded = 0;
    var codePoint = 0;
    if (octet <= 0x7F) {
      bytesNeeded = 0;
      codePoint = octet & 0xFF;
    } else if (octet <= 0xDF) {
      bytesNeeded = 1;
      codePoint = octet & 0x1F;
    } else if (octet <= 0xEF) {
      bytesNeeded = 2;
      codePoint = octet & 0x0F;
    } else if (octet <= 0xF4) {
      bytesNeeded = 3;
      codePoint = octet & 0x07;
    }
    if (octets.length - i - bytesNeeded > 0) {
      var k = 0;
      while (k < bytesNeeded) {
        octet = octets[i + k + 1];
        codePoint = (codePoint << 6) | (octet & 0x3F);
        k += 1;
      }
    } else {
      codePoint = 0xFFFD;
      bytesNeeded = octets.length - i;
    }
    string += String.fromCodePoint(codePoint);
    i += bytesNeeded + 1;
  }
  return string
};
