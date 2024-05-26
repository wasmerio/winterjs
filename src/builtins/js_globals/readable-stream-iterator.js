(function () {
  globalThis.ReadableStream.prototype[Symbol.asyncIterator] = function () {
    const reader = this.getReader();
    return {
      next: function () {
        return reader.read();
      },
    };
  };
})();
