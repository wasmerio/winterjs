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
      let out;
      if (ty === 'string') {
        out = {
          status: 200,
          headers: {},
          body: value,
        };
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

        let body = undefined;
        if ('body' in value) {
          body = value.body;
        }

        out = {
          status,
          headers,
          body,
        };

      } else {
        throw new Error('unsupported response type: ' + JSON.stringify(value));
      }

      return JSON.stringify(out);
    }

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
        const items = {};

        if (Array.isArray(init)) {
          const items = new Map();
          for (const item of init) {
            if (!Array.isArray(item) || item.length !== 2) {
              throw new Error('init must be an array of [name, value] tuples');
            }
            const [name, value] = item;
            if (typeof name !== 'string') {
              throw new Error('name must be a string');
            }
            if (typeof value !== 'string') {
              throw new Error('value must be a string');
            }

            if (items[name]) {
              items[name].push(value);
            } else {
              items[name] = [value];
            }
          }
        } else if (typeof init === 'object') {
          for (const [name, value] of Object.entries(init)) {
            if (typeof name !== 'string') {
              throw new Error('name must be a string');
            }

            if (typeof value === 'string') {
              if (items[name]) {
                items[name].push(value);
              } else {
                items[name] = [value];
              }
            } else if (Array.isArray(value)) {
              for (const x of value) {
                if (typeof x !== 'string') {
                  throw new Error('HeaderInit object key contained array with non-string values');
                }
              }
              items[name] = value;
            } else {
              throw new Error('HeaderInit object contained non-string values');
            }
          }
        } else if (headers) {
          throw new Error('init must be an array, object, or null/undefined');
        }

        this.items = items;
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

        if (init.body) {
        }
      }
    }

    globalThis.__wasmer_callFetchHandler = function(rawRequest) {
      // FIXME: add support for multiple handlers?

      if (typeof rawRequest !== 'string') {
        throw new Error('request must be a string');
      }
      const requestData = JSON.parse(rawRequest);

      
      const items = Object.values(FETCH_HANDLERS);
      if (items.length === 0) {
        throw new Error("no fetch handlers registered");
      }

      const res = items[0](request);

      if (!res) {
        throw new Error("fetch handler returned null");
      }
      if (res?.then && (typeof res.then) === 'function') {
        return res.then(convertValueToResponseData);
      } else {
        return convertValueToResponseData(res);
      }
    };
})()
