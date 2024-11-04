// The definition of ReadableStream is in SpiderMonkey's C++ source, and
// I'd rather not mess with that just to add in a couple of short functions.

(function () {
  class ReadableStreamAsyncIterator {
    reader;

    constructor(stream) {
      this.reader = stream.getReader();
    }

    next() {
      return this.reader.read();
    }

    [Symbol.asyncIterator]() {
      return this;
    }
  }

  globalThis.ReadableStream.prototype[Symbol.asyncIterator] = function () {
    return new ReadableStreamAsyncIterator(this);
  };

  globalThis.ReadableStream.prototype["values"] = function () {
    return new ReadableStreamAsyncIterator(this);
  };

  const originalPipeTo = globalThis.ReadableStream.prototype["pipeTo"];

  globalThis.ReadableStream.prototype["pipeTo"] = function (dest, options) {
    // The ReadableStream implementation doesn't support signals
    options.signal = undefined;
    return Reflect.apply(originalPipeTo, this, [dest, options]);
  };

  globalThis.ReadableStream.from = function (iterable) {
    if (iterable[Symbol.iterator]) {
      const iterator = iterable[Symbol.iterator]();
      return new ReadableStream({
        pull: function (controller) {
          const next = iterator.next();
          if (next.done) {
            controller.close();
          } else {
            if (typeof next.value === "undefined") {
              throw new TypeError(
                "Iterator passed to ReadableStream.from failed to produce an element"
              );
            }
            controller.enqueue(next.value);
          }
        },
      });
    } else if (iterable[Symbol.asyncIterator]) {
      const iterator = iterable[Symbol.asyncIterator]();
      return new ReadableStream({
        pull: async function (controller) {
          const next = await iterator.next();
          if (next.done) {
            controller.close();
          } else {
            if (typeof next.value === "undefined") {
              throw new TypeError(
                "Iterator passed to ReadableStream.from failed to produce an element"
              );
            }
            controller.enqueue(next.value);
          }
        },
      });
    } else {
      throw new TypeError(
        "The parameter passed to ReadableStream.from is not iterable"
      );
    }
  };
})();
