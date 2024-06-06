// The definition of ReadableStream is from SpiderMonkey, and I'd rather not mess with
// that just to add in a couple of short functions.

(function () {
  globalThis.ReadableStream.prototype[Symbol.asyncIterator] = function () {
    const reader = this.getReader();
    return {
      next: function () {
        return reader.read();
      },
    };
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
