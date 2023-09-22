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
      let out;
      if (typeof res === 'string') {
        out = {
          status: 200,
          headers: {},
          body: res,
        };
      } else {
        throw new Error('unsupported response type: ' + JSON.stringify(res));
      }

      return JSON.stringify(out);
    }

    globalThis.__wasmer_callFetchHandler = function(request) {
      // FIXME: add support for multiple handlers?
      
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
