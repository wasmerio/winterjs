import {
  assert_array_equals,
  assert_equals,
  assert_false,
  assert_throws_js,
  assert_true,
  assert_unreached,
  delay,
  flushAsyncEvents,
  promise_rejects_exactly,
  promise_rejects_js,
  promise_test,
  test,
} from "../test-utils.js";

class LipFuzzTransformer {
  constructor(substitutions) {
    this.substitutions = substitutions;
    this.partialChunk = "";
    this.lastIndex = undefined;
  }

  transform(chunk, controller) {
    chunk = this.partialChunk + chunk;
    this.partialChunk = "";
    // lastIndex is the index of the first character after the last substitution.
    this.lastIndex = 0;
    chunk = chunk.replace(
      /\{\{([a-zA-Z0-9_-]+)\}\}/g,
      this.replaceTag.bind(this)
    );
    // Regular expression for an incomplete template at the end of a string.
    const partialAtEndRegexp = /\{(\{([a-zA-Z0-9_-]+(\})?)?)?$/g;
    // Avoid looking at any characters that have already been substituted.
    partialAtEndRegexp.lastIndex = this.lastIndex;
    this.lastIndex = undefined;
    const match = partialAtEndRegexp.exec(chunk);
    if (match) {
      this.partialChunk = chunk.substring(match.index);
      chunk = chunk.substring(0, match.index);
    }
    controller.enqueue(chunk);
  }

  flush(controller) {
    if (this.partialChunk.length > 0) {
      controller.enqueue(this.partialChunk);
    }
  }

  replaceTag(match, p1, offset) {
    let replacement = this.substitutions[p1];
    if (replacement === undefined) {
      replacement = "";
    }
    this.lastIndex = offset + replacement.length;
    return replacement;
  }
}

const recordingTransformStream = (
  extras = {},
  writableStrategy,
  readableStrategy
) => {
  let controllerToCopyOver;
  const stream = new TransformStream(
    {
      start(controller) {
        controllerToCopyOver = controller;

        if (extras.start) {
          return extras.start(controller);
        }

        return undefined;
      },

      transform(chunk, controller) {
        stream.events.push("transform", chunk);

        if (extras.transform) {
          return extras.transform(chunk, controller);
        }

        controller.enqueue(chunk);

        return undefined;
      },

      flush(controller) {
        stream.events.push("flush");

        if (extras.flush) {
          return extras.flush(controller);
        }

        return undefined;
      },
    },
    writableStrategy,
    readableStrategy
  );

  stream.controller = controllerToCopyOver;
  stream.events = [];

  return stream;
};

const substitutions = {
  in1: "out1",
  in2: "out2",
  quine: "{{quine}}",
  bogusPartial: "{{incompleteResult}",
};

const lipFuzzTestCases = [
  {
    input: [""],
    output: [""],
  },
  {
    input: [],
    output: [],
  },
  {
    input: ["{{in1}}"],
    output: ["out1"],
  },
  {
    input: ["z{{in1}}"],
    output: ["zout1"],
  },
  {
    input: ["{{in1}}q"],
    output: ["out1q"],
  },
  {
    input: ["{{in1}}{{in1}"],
    output: ["out1", "{{in1}"],
  },
  {
    input: ["{{in1}}{{in1}", "}"],
    output: ["out1", "out1"],
  },
  {
    input: ["{{in1", "}}"],
    output: ["", "out1"],
  },
  {
    input: ["{{", "in1}}"],
    output: ["", "out1"],
  },
  {
    input: ["{", "{in1}}"],
    output: ["", "out1"],
  },
  {
    input: ["{{", "in1}"],
    output: ["", "", "{{in1}"],
  },
  {
    input: ["{"],
    output: ["", "{"],
  },
  {
    input: ["{", ""],
    output: ["", "", "{"],
  },
  {
    input: ["{", "{", "i", "n", "1", "}", "}"],
    output: ["", "", "", "", "", "", "out1"],
  },
  {
    input: ["{{in1}}{{in2}}{{in1}}"],
    output: ["out1out2out1"],
  },
  {
    input: ["{{wrong}}"],
    output: [""],
  },
  {
    input: ["{{wron", "g}}"],
    output: ["", ""],
  },
  {
    input: ["{{quine}}"],
    output: ["{{quine}}"],
  },
  {
    input: ["{{bogusPartial}}"],
    output: ["{{incompleteResult}"],
  },
  {
    input: ["{{bogusPartial}}}"],
    output: ["{{incompleteResult}}"],
  },
];

async function handleRequest(request) {
  function readableStreamToArray(stream) {
    var array = [];
    var writable = new WritableStream({
      write(chunk) {
        array.push(chunk);
      },
    });
    return stream.pipeTo(writable).then(() => array);
  }

  try {
    const thrownError = new Error("bad things are happening!");
    thrownError.name = "error1";

    const originalReason = new Error("original reason");
    originalReason.name = "error2";

    test(() => {
      new TransformStream({ transform() {} });
    }, "TransformStream can be constructed with a transform function");

    test(() => {
      new TransformStream();
      new TransformStream({});
    }, "TransformStream can be constructed with no transform function");

    test(() => {
      const ts = new TransformStream({ transform() {} });

      const writer = ts.writable.getWriter();
      assert_equals(writer.desiredSize, 1, "writer.desiredSize should be 1");
    }, "TransformStream writable starts in the writable state");

    await promise_test(() => {
      const ts = new TransformStream();

      const writer = ts.writable.getWriter();
      writer.write("a");
      assert_equals(
        writer.desiredSize,
        0,
        "writer.desiredSize should be 0 after write()"
      );

      return ts.readable
        .getReader()
        .read()
        .then((result) => {
          assert_equals(
            result.value,
            "a",
            "result from reading the readable is the same as was written to writable"
          );
          assert_false(result.done, "stream should not be done");

          return delay(0).then(() =>
            assert_equals(
              writer.desiredSize,
              1,
              "desiredSize should be 1 again"
            )
          );
        });
    }, "Identity TransformStream: can read from readable what is put into writable");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform(chunk) {
          c.enqueue(chunk.toUpperCase());
        },
      });

      const writer = ts.writable.getWriter();
      writer.write("a");

      return ts.readable
        .getReader()
        .read()
        .then((result) => {
          assert_equals(
            result.value,
            "A",
            "result from reading the readable is the transformation of what was written to writable"
          );
          assert_false(result.done, "stream should not be done");
        });
    }, "Uppercaser sync TransformStream: can read from readable transformed version of what is put into writable");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform(chunk) {
          c.enqueue(chunk.toUpperCase());
          c.enqueue(chunk.toUpperCase());
        },
      });

      const writer = ts.writable.getWriter();
      writer.write("a");

      const reader = ts.readable.getReader();

      return reader.read().then((result1) => {
        assert_equals(
          result1.value,
          "A",
          "the first chunk read is the transformation of the single chunk written"
        );
        assert_false(result1.done, "stream should not be done");

        return reader.read().then((result2) => {
          assert_equals(
            result2.value,
            "A",
            "the second chunk read is also the transformation of the single chunk written"
          );
          assert_false(result2.done, "stream should not be done");
        });
      });
    }, "Uppercaser-doubler sync TransformStream: can read both chunks put into the readable");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform(chunk) {
          return delay(0).then(() => c.enqueue(chunk.toUpperCase()));
        },
      });

      const writer = ts.writable.getWriter();
      writer.write("a");

      return ts.readable
        .getReader()
        .read()
        .then((result) => {
          assert_equals(
            result.value,
            "A",
            "result from reading the readable is the transformation of what was written to writable"
          );
          assert_false(result.done, "stream should not be done");
        });
    }, "Uppercaser async TransformStream: can read from readable transformed version of what is put into writable");

    await promise_test(() => {
      let doSecondEnqueue;
      let returnFromTransform;
      const ts = new TransformStream({
        transform(chunk, controller) {
          delay(0).then(() => controller.enqueue(chunk.toUpperCase()));
          doSecondEnqueue = () => controller.enqueue(chunk.toUpperCase());
          return new Promise((resolve) => {
            returnFromTransform = resolve;
          });
        },
      });

      const reader = ts.readable.getReader();

      const writer = ts.writable.getWriter();
      writer.write("a");

      return reader.read().then((result1) => {
        assert_equals(
          result1.value,
          "A",
          "the first chunk read is the transformation of the single chunk written"
        );
        assert_false(result1.done, "stream should not be done");
        doSecondEnqueue();

        return reader.read().then((result2) => {
          assert_equals(
            result2.value,
            "A",
            "the second chunk read is also the transformation of the single chunk written"
          );
          assert_false(result2.done, "stream should not be done");
          returnFromTransform();
        });
      });
    }, "Uppercaser-doubler async TransformStream: can read both chunks put into the readable");

    await promise_test(() => {
      const ts = new TransformStream({ transform() {} });

      const writer = ts.writable.getWriter();
      writer.close();

      return Promise.all([writer.closed, ts.readable.getReader().closed]);
    }, "TransformStream: by default, closing the writable closes the readable (when there are no queued writes)");

    await promise_test(() => {
      let transformResolve;
      const transformPromise = new Promise((resolve) => {
        transformResolve = resolve;
      });
      const ts = new TransformStream(
        {
          transform() {
            return transformPromise;
          },
        },
        undefined,
        { highWaterMark: 1 }
      );

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();

      let rsClosed = false;
      ts.readable.getReader().closed.then(() => {
        rsClosed = true;
      });

      return delay(0).then(() => {
        assert_equals(rsClosed, false, "readable is not closed after a tick");
        transformResolve();

        return writer.closed.then(() => {
          // TODO: Is this expectation correct?
          assert_equals(rsClosed, true, "readable is closed at that point");
        });
      });
    }, "TransformStream: by default, closing the writable waits for transforms to finish before closing both");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform() {
          c.enqueue("x");
          c.enqueue("y");
          return delay(0);
        },
      });

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();

      const readableChunks = readableStreamToArray(ts.readable);

      return writer.closed.then(() => {
        return readableChunks.then((chunks) => {
          assert_array_equals(
            chunks,
            ["x", "y"],
            "both enqueued chunks can be read from the readable"
          );
        });
      });
    }, "TransformStream: by default, closing the writable closes the readable after sync enqueues and async done");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform() {
          return delay(0)
            .then(() => c.enqueue("x"))
            .then(() => c.enqueue("y"))
            .then(() => delay(0));
        },
      });

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();

      const readableChunks = readableStreamToArray(ts.readable);

      return writer.closed.then(() => {
        return readableChunks.then((chunks) => {
          assert_array_equals(
            chunks,
            ["x", "y"],
            "both enqueued chunks can be read from the readable"
          );
        });
      });
    }, "TransformStream: by default, closing the writable closes the readable after async enqueues and async done");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        suffix: "-suffix",

        start(controller) {
          c = controller;
          c.enqueue("start" + this.suffix);
        },

        transform(chunk) {
          c.enqueue(chunk + this.suffix);
        },

        flush() {
          c.enqueue("flushed" + this.suffix);
        },
      });

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();

      const readableChunks = readableStreamToArray(ts.readable);

      return writer.closed.then(() => {
        return readableChunks.then((chunks) => {
          assert_array_equals(
            chunks,
            ["start-suffix", "a-suffix", "flushed-suffix"],
            "all enqueued chunks have suffixes"
          );
        });
      });
    }, "Transform stream should call transformer methods as methods");

    await promise_test(() => {
      function functionWithOverloads() {}
      functionWithOverloads.apply = () =>
        assert_unreached("apply() should not be called");
      functionWithOverloads.call = () =>
        assert_unreached("call() should not be called");
      const ts = new TransformStream({
        start: functionWithOverloads,
        transform: functionWithOverloads,
        flush: functionWithOverloads,
      });
      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();

      return readableStreamToArray(ts.readable);
    }, "methods should not not have .apply() or .call() called");

    await promise_test(() => {
      let transformCalled = false;
      const ts = new TransformStream(
        {
          transform() {
            transformCalled = true;
          },
        },
        undefined,
        { highWaterMark: Infinity }
      );
      // transform() is only called synchronously when there is no backpressure and all microtasks have run.
      return delay(1).then(() => {
        const writePromise = ts.writable.getWriter().write();
        assert_true(transformCalled, "transform() should have been called");
        return writePromise;
      });
    }, "it should be possible to call transform() synchronously");

    await promise_test(() => {
      const ts = new TransformStream({}, undefined, { highWaterMark: 0 });

      const writer = ts.writable.getWriter();
      writer.close();

      return Promise.all([writer.closed, ts.readable.getReader().closed]);
    }, "closing the writable should close the readable when there are no queued chunks, even with backpressure");

    test(() => {
      new TransformStream({
        start(controller) {
          controller.terminate();
          assert_throws_js(() => controller.enqueue(), "enqueue should throw");
        },
      });
    }, "enqueue() should throw after controller.terminate()");

    await promise_test(() => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
      });
      const cancelPromise = ts.readable.cancel();
      assert_throws_js(() => controller.enqueue(), "enqueue should throw");
      return cancelPromise;
    }, "enqueue() should throw after readable.cancel()");

    test(() => {
      new TransformStream({
        start(controller) {
          controller.terminate();
          controller.terminate();
        },
      });
    }, "controller.terminate() should do nothing the second time it is called");

    await promise_test(() => {
      let calls = 0;
      new TransformStream({
        start() {
          ++calls;
        },
      });
      return delay(1).then(
        flushAsyncEvents().then(() => {
          assert_equals(
            calls,
            1,
            "start() should have been called exactly once"
          );
        })
      );
    }, "start() should not be called twice");

    test(() => {
      class Subclass extends TransformStream {
        extraFunction() {
          return true;
        }
      }
      assert_equals(
        Object.getPrototypeOf(Subclass.prototype),
        TransformStream.prototype,
        "Subclass.prototype's prototype should be TransformStream.prototype"
      );
      assert_equals(
        Object.getPrototypeOf(Subclass),
        TransformStream,
        "Subclass's prototype should be TransformStream"
      );
      const sub = new Subclass();
      assert_true(
        sub instanceof TransformStream,
        "Subclass object should be an instance of TransformStream"
      );
      assert_true(
        sub instanceof Subclass,
        "Subclass object should be an instance of Subclass"
      );
      const readableGetter = Object.getOwnPropertyDescriptor(
        TransformStream.prototype,
        "readable"
      ).get;
      assert_equals(
        readableGetter.call(sub),
        sub.readable,
        "Subclass object should pass brand check"
      );
      assert_true(
        sub.extraFunction(),
        "extraFunction() should be present on Subclass object"
      );
    }, "Subclassing TransformStream should work");

    for (const testCase of lipFuzzTestCases) {
      const inputChunks = testCase.input;
      const outputChunks = testCase.output;
      promise_test(() => {
        const lft = new TransformStream(new LipFuzzTransformer(substitutions));
        const writer = lft.writable.getWriter();
        const promises = [];
        for (const inputChunk of inputChunks) {
          promises.push(writer.write(inputChunk));
        }
        promises.push(writer.close());
        const reader = lft.readable.getReader();
        let readerChain = Promise.resolve();
        for (const outputChunk of outputChunks) {
          readerChain = readerChain.then(() => {
            return reader.read().then(({ value, done }) => {
              assert_false(
                done,
                `done should be false when reading ${outputChunk}`
              );
              assert_equals(
                value,
                outputChunk,
                `value should match outputChunk`
              );
            });
          });
        }
        readerChain = readerChain.then(() => {
          return reader
            .read()
            .then(({ done }) => assert_true(done, `done should be true`));
        });
        promises.push(readerChain);
        return Promise.all(promises);
      }, `testing "${inputChunks}" (length ${inputChunks.length})`);
    }

    await promise_test(async (t) => {
      let cancelled = undefined;
      const ts = new TransformStream({
        cancel(reason) {
          cancelled = reason;
        },
      });
      const res = await ts.readable.cancel(thrownError);
      assert_equals(
        res,
        undefined,
        "readable.cancel() should return undefined"
      );
      assert_equals(
        cancelled,
        thrownError,
        "transformer.cancel() should be called with the passed reason"
      );
    }, "cancelling the readable side should call transformer.cancel()");

    await promise_test(async (t) => {
      const ts = new TransformStream({
        cancel(reason) {
          assert_equals(
            reason,
            originalReason,
            "transformer.cancel() should be called with the passed reason"
          );
          throw thrownError;
        },
      });
      const writer = ts.writable.getWriter();
      const cancelPromise = ts.readable.cancel(originalReason);
      await promise_rejects_exactly(
        thrownError,
        cancelPromise,
        "readable.cancel() should reject with thrownError"
      );
      await promise_rejects_exactly(
        thrownError,
        writer.closed,
        "writer.closed should reject with thrownError"
      );
    }, "cancelling the readable side should reject if transformer.cancel() throws");

    await promise_test(async (t) => {
      let aborted = undefined;
      const ts = new TransformStream({
        cancel(reason) {
          aborted = reason;
        },
        flush: t.unreached_func("flush should not be called"),
      });
      const res = await ts.writable.abort(thrownError);
      assert_equals(res, undefined, "writable.abort() should return undefined");
      assert_equals(
        aborted,
        thrownError,
        "transformer.abort() should be called with the passed reason"
      );
    }, "aborting the writable side should call transformer.abort()");

    await promise_test(async (t) => {
      const ts = new TransformStream({
        cancel(reason) {
          assert_equals(
            reason,
            originalReason,
            "transformer.cancel() should be called with the passed reason"
          );
          throw thrownError;
        },
        flush: t.unreached_func("flush should not be called"),
      });
      const reader = ts.readable.getReader();
      const abortPromise = ts.writable.abort(originalReason);
      await promise_rejects_exactly(
        thrownError,
        abortPromise,
        "writable.abort() should reject with thrownError"
      );
      await promise_rejects_exactly(
        thrownError,
        reader.closed,
        "reader.closed should reject with thrownError"
      );
    }, "aborting the writable side should reject if transformer.cancel() throws");

    await promise_test(async (t) => {
      const ts = new TransformStream({
        async cancel(reason) {
          assert_equals(
            reason,
            originalReason,
            "transformer.cancel() should be called with the passed reason"
          );
          throw thrownError;
        },
        flush: t.unreached_func("flush should not be called"),
      });
      const cancelPromise = ts.readable.cancel(originalReason);
      const closePromise = ts.writable.close();
      await Promise.all([
        promise_rejects_exactly(
          thrownError,
          cancelPromise,
          "cancelPromise should reject with thrownError"
        ),
        promise_rejects_exactly(
          thrownError,
          closePromise,
          "closePromise should reject with thrownError"
        ),
      ]);
    }, "closing the writable side should reject if a parallel transformer.cancel() throws");

    await promise_test(async (t) => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
        async cancel(reason) {
          assert_equals(
            reason,
            originalReason,
            "transformer.cancel() should be called with the passed reason"
          );
          controller.error(thrownError);
        },
        flush: t.unreached_func("flush should not be called"),
      });
      const cancelPromise = ts.readable.cancel(originalReason);
      const closePromise = ts.writable.close();
      await Promise.all([
        promise_rejects_exactly(
          thrownError,
          cancelPromise,
          "cancelPromise should reject with thrownError"
        ),
        promise_rejects_exactly(
          thrownError,
          closePromise,
          "closePromise should reject with thrownError"
        ),
      ]);
    }, "readable.cancel() and a parallel writable.close() should reject if a transformer.cancel() calls controller.error()");

    await promise_test(async (t) => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
        async cancel(reason) {
          assert_equals(
            reason,
            originalReason,
            "transformer.cancel() should be called with the passed reason"
          );
          controller.error(thrownError);
        },
        flush: t.unreached_func("flush should not be called"),
      });
      const cancelPromise = ts.writable.abort(originalReason);
      await promise_rejects_exactly(
        thrownError,
        cancelPromise,
        "cancelPromise should reject with thrownError"
      );
      const closePromise = ts.readable.cancel(1);
      await promise_rejects_exactly(
        thrownError,
        closePromise,
        "closePromise should reject with thrownError"
      );
    }, "writable.abort() and readable.cancel() should reject if a transformer.cancel() calls controller.error()");

    await promise_test((t) => {
      const ts = new TransformStream({
        transform() {
          throw thrownError;
        },
        cancel: t.unreached_func("cancel should not be called"),
      });

      const reader = ts.readable.getReader();

      const writer = ts.writable.getWriter();

      return Promise.all([
        promise_rejects_exactly(
          thrownError,
          writer.write("a"),
          "writable's write should reject with the thrown error"
        ),
        promise_rejects_exactly(
          thrownError,
          reader.read(),
          "readable's read should reject with the thrown error"
        ),
        promise_rejects_exactly(
          thrownError,
          reader.closed,
          "readable's closed should be rejected with the thrown error"
        ),
        promise_rejects_exactly(
          thrownError,
          writer.closed,
          "writable's closed should be rejected with the thrown error"
        ),
      ]);
    }, "TransformStream errors thrown in transform put the writable and readable in an errored state");

    await promise_test((t) => {
      const ts = new TransformStream({
        transform() {},
        flush() {
          throw thrownError;
        },
        cancel: t.unreached_func("cancel should not be called"),
      });

      const reader = ts.readable.getReader();

      const writer = ts.writable.getWriter();

      return Promise.all([
        writer.write("a"),
        promise_rejects_exactly(
          thrownError,
          writer.close(),
          "writable's close should reject with the thrown error"
        ),
        promise_rejects_exactly(
          thrownError,
          reader.read(),
          "readable's read should reject with the thrown error"
        ),
        promise_rejects_exactly(
          thrownError,
          reader.closed,
          "readable's closed should be rejected with the thrown error"
        ),
        promise_rejects_exactly(
          thrownError,
          writer.closed,
          "writable's closed should be rejected with the thrown error"
        ),
      ]);
    }, "TransformStream errors thrown in flush put the writable and readable in an errored state");

    test((t) => {
      new TransformStream({
        start(c) {
          c.enqueue("a");
          c.error(new Error("generic error"));
          assert_throws_js(() => c.enqueue("b"), "enqueue() should throw");
        },
        cancel: t.unreached_func("cancel should not be called"),
      });
    }, "errored TransformStream should not enqueue new chunks");

    await promise_test((t) => {
      const ts = new TransformStream({
        start() {
          return flushAsyncEvents().then(() => {
            throw thrownError;
          });
        },
        transform: t.unreached_func("transform should not be called"),
        flush: t.unreached_func("flush should not be called"),
        cancel: t.unreached_func("cancel should not be called"),
      });

      const writer = ts.writable.getWriter();
      const reader = ts.readable.getReader();
      return Promise.all([
        promise_rejects_exactly(
          thrownError,
          writer.write("a"),
          "writer should reject with thrownError"
        ),
        promise_rejects_exactly(
          thrownError,
          writer.close(),
          "close() should reject with thrownError"
        ),
        promise_rejects_exactly(
          thrownError,
          reader.read(),
          "reader should reject with thrownError"
        ),
      ]);
    }, "TransformStream transformer.start() rejected promise should error the stream");

    await promise_test((t) => {
      const controllerError = new Error("start failure");
      controllerError.name = "controllerError";
      const ts = new TransformStream({
        start(c) {
          return flushAsyncEvents().then(() => {
            c.error(controllerError);
            throw new Error("ignored error");
          });
        },
        transform: t.unreached_func(
          "transform should never be called if start() fails"
        ),
        flush: t.unreached_func(
          "flush should never be called if start() fails"
        ),
        cancel: t.unreached_func(
          "cancel should never be called if start() fails"
        ),
      });

      const writer = ts.writable.getWriter();
      const reader = ts.readable.getReader();
      return Promise.all([
        promise_rejects_exactly(
          controllerError,
          writer.write("a"),
          "writer should reject with controllerError"
        ),
        promise_rejects_exactly(
          controllerError,
          writer.close(),
          "close should reject with same error"
        ),
        promise_rejects_exactly(
          controllerError,
          reader.read(),
          "reader should reject with same error"
        ),
      ]);
    }, "when controller.error is followed by a rejection, the error reason should come from controller.error");

    test(() => {
      assert_throws_js(
        () =>
          new TransformStream({
            start() {
              throw new URIError("start thrown error");
            },
            transform() {},
          }),
        "constructor should throw"
      );
    }, "TransformStream constructor should throw when start does");

    // TODO: backpressure not implemented yet
    // test(() => {
    //   const strategy = {
    //     size() {
    //       throw new URIError("size thrown error");
    //     },
    //   };

    //   assert_throws_js(
    //     () =>
    //       new TransformStream(
    //         {
    //           start(c) {
    //             c.enqueue("a");
    //           },
    //           transform() {},
    //         },
    //         undefined,
    //         strategy
    //       ),
    //     "constructor should throw the same error strategy.size throws"
    //   );
    // }, "when strategy.size throws inside start(), the constructor should throw the same error");

    // TODO: backpressure not implemented yet
    // test(() => {
    //   const controllerError = new URIError("controller.error");

    //   let controller;
    //   const strategy = {
    //     size() {
    //       controller.error(controllerError);
    //       throw new Error("redundant error");
    //     },
    //   };

    //   assert_throws_js(
    //     () =>
    //       new TransformStream(
    //         {
    //           start(c) {
    //             controller = c;
    //             c.enqueue("a");
    //           },
    //           transform() {},
    //         },
    //         undefined,
    //         strategy
    //       ),
    //     "the first error should be thrown"
    //   );
    // }, "when strategy.size calls controller.error() then throws, the constructor should throw the first error");

    await promise_test((t) => {
      const ts = new TransformStream();
      const writer = ts.writable.getWriter();
      const closedPromise = writer.closed;
      return Promise.all([
        ts.readable.cancel(thrownError),
        promise_rejects_exactly(
          thrownError,
          closedPromise,
          "closed should throw a TypeError"
        ),
      ]);
    }, "cancelling the readable side should error the writable");

    await promise_test((t) => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
      });
      const writer = ts.writable.getWriter();
      const reader = ts.readable.getReader();
      const writePromise = writer.write("a");
      const closePromise = writer.close();
      controller.error(thrownError);
      return Promise.all([
        promise_rejects_exactly(
          thrownError,
          reader.closed,
          "reader.closed should reject"
        ),
        promise_rejects_exactly(
          thrownError,
          writePromise,
          "writePromise should reject"
        ),
        promise_rejects_exactly(
          thrownError,
          closePromise,
          "closePromise should reject"
        ),
      ]);
    }, "it should be possible to error the readable between close requested and complete");

    await promise_test((t) => {
      const ts = new TransformStream(
        {
          transform(chunk, controller) {
            controller.enqueue(chunk);
            controller.terminate();
            throw thrownError;
          },
        },
        undefined,
        { highWaterMark: 1 }
      );
      const writePromise = ts.writable.getWriter().write("a");
      const closedPromise = ts.readable.getReader().closed;
      return Promise.all([
        promise_rejects_exactly(
          thrownError,
          writePromise,
          "write() should reject"
        ),
        promise_rejects_exactly(
          thrownError,
          closedPromise,
          "reader.closed should reject"
        ),
      ]);
    }, "an exception from transform() should error the stream if terminate has been requested but not completed");

    await promise_test((t) => {
      const ts = new TransformStream();
      const writer = ts.writable.getWriter();
      // The microtask following transformer.start() hasn't completed yet, so the abort is queued and not notified to the
      // TransformStream yet.
      const abortPromise = writer.abort(thrownError);
      const cancelPromise = ts.readable.cancel(new Error("cancel reason"));
      return Promise.all([
        abortPromise,
        cancelPromise,
        promise_rejects_exactly(
          thrownError,
          writer.closed,
          "writer.closed should reject"
        ),
      ]);
    }, "abort should set the close reason for the writable when it happens before cancel during start, and cancel should " + "reject");

    await promise_test((t) => {
      let resolveTransform;
      const transformPromise = new Promise((resolve) => {
        resolveTransform = resolve;
      });
      const ts = new TransformStream(
        {
          transform() {
            return transformPromise;
          },
        },
        undefined,
        { highWaterMark: 2 }
      );
      const writer = ts.writable.getWriter();
      return delay(0).then(() => {
        const writePromise = writer.write();
        const abortPromise = writer.abort(thrownError);
        const cancelPromise = ts.readable.cancel(new Error("cancel reason"));
        resolveTransform();
        return Promise.all([
          writePromise,
          abortPromise,
          cancelPromise,
          promise_rejects_exactly(
            thrownError,
            writer.closed,
            "writer.closed should reject with thrownError"
          ),
        ]);
      });
    }, "abort should set the close reason for the writable when it happens before cancel during underlying sink write, " + "but cancel should still succeed");

    const ignoredError = new Error("ignoredError");
    ignoredError.name = "ignoredError";

    await promise_test((t) => {
      const ts = new TransformStream({
        start(controller) {
          controller.error(thrownError);
          controller.error(ignoredError);
        },
      });
      return promise_rejects_exactly(
        thrownError,
        ts.writable.abort(),
        "abort() should reject with thrownError"
      );
    }, "controller.error() should do nothing the second time it is called");

    await promise_test((t) => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
      });
      const cancelPromise = ts.readable.cancel(ignoredError);
      controller.error(thrownError);
      return Promise.all([
        cancelPromise,
        promise_rejects_exactly(
          thrownError,
          ts.writable.getWriter().closed,
          "closed should reject with thrownError"
        ),
      ]);
    }, "controller.error() should close writable immediately after readable.cancel()");

    await promise_test((t) => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
      });
      return ts.readable.cancel(thrownError).then(() => {
        controller.error(ignoredError);
        return promise_rejects_exactly(
          thrownError,
          ts.writable.getWriter().closed,
          "closed should reject with thrownError"
        );
      });
    }, "controller.error() should do nothing after readable.cancel() resolves");

    await promise_test((t) => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        },
      });
      return ts.writable.abort(thrownError).then(() => {
        controller.error(ignoredError);
        return promise_rejects_exactly(
          thrownError,
          ts.writable.getWriter().closed,
          "closed should reject with thrownError"
        );
      });
    }, "controller.error() should do nothing after writable.abort() has completed");

    await promise_test((t) => {
      let controller;
      const ts = new TransformStream(
        {
          start(c) {
            controller = c;
          },
          transform() {
            throw thrownError;
          },
        },
        undefined,
        { highWaterMark: Infinity }
      );
      const writer = ts.writable.getWriter();
      return promise_rejects_exactly(
        thrownError,
        writer.write(),
        "write() should reject"
      ).then(() => {
        controller.error();
        return promise_rejects_exactly(
          thrownError,
          writer.closed,
          "closed should reject with thrownError"
        );
      });
    }, "controller.error() should do nothing after a transformer method has thrown an exception");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   let controller;
    //   let calls = 0;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //       transform() {
    //         ++calls;
    //       },
    //     },
    //     undefined,
    //     { highWaterMark: 1 }
    //   );
    //   return delay(0).then(() => {
    //     // Create backpressure.
    //     controller.enqueue("a");
    //     const writer = ts.writable.getWriter();
    //     // transform() will not be called until backpressure is relieved.
    //     const writePromise = writer.write("b");
    //     assert_equals(calls, 0, "transform() should not have been called");
    //     controller.error(thrownError);
    //     // Now backpressure has been relieved and the write can proceed.
    //     return promise_rejects_exactly(
    //       thrownError,
    //       writePromise,
    //       "write() should reject"
    //     ).then(() => {
    //       assert_equals(calls, 0, "transform() should not be called");
    //     });
    //   });
    // }, "erroring during write with backpressure should result in the write failing");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   const ts = new TransformStream({}, undefined, { highWaterMark: 0 });
    //   return delay(0).then(() => {
    //     const writer = ts.writable.getWriter();
    //     // write should start synchronously
    //     const writePromise = writer.write(0);
    //     // The underlying sink's abort() is not called until the write() completes.
    //     const abortPromise = writer.abort(thrownError);
    //     // Perform a read to relieve backpressure and permit the write() to complete.
    //     const readPromise = ts.readable.getReader().read();
    //     return Promise.all([
    //       promise_rejects_exactly(
    //         thrownError,
    //         readPromise,
    //         "read() should reject"
    //       ),
    //       promise_rejects_exactly(
    //         thrownError,
    //         writePromise,
    //         "write() should reject"
    //       ),
    //       abortPromise,
    //     ]);
    //   });
    // }, "a write() that was waiting for backpressure should reject if the writable is aborted");

    await promise_test((t) => {
      const ts = new TransformStream();
      ts.writable.abort(thrownError);
      const reader = ts.readable.getReader();
      return promise_rejects_exactly(
        thrownError,
        reader.read(),
        "read() should reject with thrownError"
      );
    }, "the readable should be errored with the reason passed to the writable abort() method");

    await promise_test(() => {
      let flushCalled = false;
      const ts = new TransformStream({
        transform() {},
        flush() {
          flushCalled = true;
        },
      });

      return ts.writable
        .getWriter()
        .close()
        .then(() => {
          return assert_true(
            flushCalled,
            "closing the writable triggers the transform flush immediately"
          );
        });
    }, "TransformStream flush is called immediately when the writable is closed, if no writes are queued");

    await promise_test(() => {
      let flushCalled = false;
      let resolveTransform;
      const ts = new TransformStream(
        {
          transform() {
            return new Promise((resolve) => {
              resolveTransform = resolve;
            });
          },
          flush() {
            flushCalled = true;
            return new Promise(() => {}); // never resolves
          },
        },
        undefined,
        { highWaterMark: 1 }
      );

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();
      assert_false(
        flushCalled,
        "closing the writable does not immediately call flush if writes are not finished"
      );

      let rsClosed = false;
      ts.readable.getReader().closed.then(() => {
        rsClosed = true;
      });

      return delay(1)
        .then(() => {
          assert_false(
            flushCalled,
            "closing the writable does not asynchronously call flush if writes are not finished"
          );
          resolveTransform();
          return delay(1);
        })
        .then(() => {
          assert_true(flushCalled, "flush is eventually called");
          assert_false(
            rsClosed,
            "if flushPromise does not resolve, the readable does not become closed"
          );
        });
    }, "TransformStream flush is called after all queued writes finish, once the writable is closed");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform() {},
        flush() {
          c.enqueue("x");
          c.enqueue("y");
        },
      });

      const reader = ts.readable.getReader();

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();
      return reader.read().then((result1) => {
        assert_equals(
          result1.value,
          "x",
          "the first chunk read is the first one enqueued in flush"
        );
        assert_equals(
          result1.done,
          false,
          "the first chunk read is the first one enqueued in flush"
        );

        return reader.read().then((result2) => {
          assert_equals(
            result2.value,
            "y",
            "the second chunk read is the second one enqueued in flush"
          );
          assert_equals(
            result2.done,
            false,
            "the second chunk read is the second one enqueued in flush"
          );
        });
      });
    }, "TransformStream flush gets a chance to enqueue more into the readable");

    await promise_test(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform() {},
        flush() {
          c.enqueue("x");
          c.enqueue("y");
          return delay(0);
        },
      });

      const reader = ts.readable.getReader();

      const writer = ts.writable.getWriter();
      writer.write("a");
      writer.close();

      return Promise.all([
        reader.read().then((result1) => {
          assert_equals(
            result1.value,
            "x",
            "the first chunk read is the first one enqueued in flush"
          );
          assert_equals(
            result1.done,
            false,
            "the first chunk read is the first one enqueued in flush"
          );

          return reader.read().then((result2) => {
            assert_equals(
              result2.value,
              "y",
              "the second chunk read is the second one enqueued in flush"
            );
            assert_equals(
              result2.done,
              false,
              "the second chunk read is the second one enqueued in flush"
            );
          });
        }),
        reader.closed.then(() => {
          assert_true(true, "readable reader becomes closed");
        }),
      ]);
    }, "TransformStream flush gets a chance to enqueue more into the readable, and can then async close");

    const error1 = new Error("error1");
    error1.name = "error1";

    await promise_test((t) => {
      const ts = new TransformStream({
        flush(controller) {
          controller.error(error1);
        },
      });
      return promise_rejects_exactly(
        error1,
        ts.writable.getWriter().close(),
        "close() should reject"
      );
    }, "error() during flush should cause writer.close() to reject");

    await promise_test(async (t) => {
      let flushed = false;
      const ts = new TransformStream({
        flush() {
          flushed = true;
        },
        cancel: t.unreached_func("cancel should not be called"),
      });
      const closePromise = ts.writable.close();
      await delay(0);
      const cancelPromise = ts.readable.cancel(error1);
      await Promise.all([closePromise, cancelPromise]);
      assert_equals(flushed, true, "transformer.flush() should be called");
    }, "closing the writable side should call transformer.flush() and a parallel readable.cancel() should not reject");

    const transformerMethods = {
      start: {
        length: 1,
        trigger: () => Promise.resolve(),
      },
      transform: {
        length: 2,
        trigger: (ts) => ts.writable.getWriter().write(),
      },
      flush: {
        length: 1,
        trigger: (ts) => ts.writable.getWriter().close(),
      },
    };

    for (const method in transformerMethods) {
      const { length, trigger } = transformerMethods[method];

      // Some semantic tests of how transformer methods are called can be found in general.js, as well as in the test files
      // specific to each method.
      promise_test(() => {
        let argCount;
        const ts = new TransformStream(
          {
            [method](...args) {
              argCount = args.length;
            },
          },
          undefined,
          { highWaterMark: Infinity }
        );
        return Promise.resolve(trigger(ts)).then(() => {
          assert_equals(
            argCount,
            length,
            `${method} should be called with ${length} arguments`
          );
        });
      }, `transformer method ${method} should be called with the right number of arguments`);

      promise_test(() => {
        let methodWasCalled = false;
        function Transformer() {}
        Transformer.prototype = {
          [method]() {
            methodWasCalled = true;
          },
        };
        const ts = new TransformStream(new Transformer(), undefined, {
          highWaterMark: Infinity,
        });
        return Promise.resolve(trigger(ts)).then(() => {
          assert_true(methodWasCalled, `${method} should be called`);
        });
      }, `transformer method ${method} should be called even when it's located on the prototype chain`);
    }

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let controller;
    //   let calls = 0;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         ++calls;
    //         if (calls < 2) {
    //           controller.enqueue("b");
    //         }
    //         return 1;
    //       },
    //       highWaterMark: Infinity,
    //     }
    //   );
    //   const writer = ts.writable.getWriter();
    //   return Promise.all([writer.write("a"), writer.close()])
    //     .then(() => readableStreamToArray(ts.readable))
    //     .then((array) =>
    //       assert_array_equals(
    //         array,
    //         ["b", "a"],
    //         "array should contain two chunks"
    //       )
    //     );
    // }, "enqueue() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let controller;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         // The readable queue is empty.
    //         controller.terminate();
    //         // The readable state has gone from "readable" to "closed".
    //         return 1;
    //         // This chunk will be enqueued, but will be impossible to read because the state is already "closed".
    //       },
    //       highWaterMark: Infinity,
    //     }
    //   );
    //   const writer = ts.writable.getWriter();
    //   return writer
    //     .write("a")
    //     .then(() => readableStreamToArray(ts.readable))
    //     .then((array) =>
    //       assert_array_equals(array, [], "array should contain no chunks")
    //     );
    //   // The chunk 'a' is still in readable's queue. readable is closed so 'a' cannot be read. writable's queue is empty and
    //   // it is still writable.
    // }, "terminate() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   let controller;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         controller.error(error1);
    //         return 1;
    //       },
    //       highWaterMark: Infinity,
    //     }
    //   );
    //   const writer = ts.writable.getWriter();
    //   return writer
    //     .write("a")
    //     .then(() =>
    //       promise_rejects_exactly(
    //         error1,
    //         ts.readable.getReader().read(),
    //         "read() should reject"
    //       )
    //     );
    // }, "error() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let controller;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         assert_equals(controller.desiredSize, 1, "desiredSize should be 1");
    //         return 1;
    //       },
    //       highWaterMark: 1,
    //     }
    //   );
    //   const writer = ts.writable.getWriter();
    //   return Promise.all([writer.write("a"), writer.close()])
    //     .then(() => readableStreamToArray(ts.readable))
    //     .then((array) =>
    //       assert_array_equals(array, ["a"], "array should contain one chunk")
    //     );
    // }, "desiredSize inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   let cancelPromise;
    //   const ts = new TransformStream({}, undefined, {
    //     size() {
    //       cancelPromise = ts.readable.cancel(error1);
    //       return 1;
    //     },
    //     highWaterMark: Infinity,
    //   });
    //   const writer = ts.writable.getWriter();
    //   return writer.write("a").then(() => {
    //     promise_rejects_exactly(
    //       error1,
    //       writer.closed,
    //       "writer.closed should reject"
    //     );
    //     return cancelPromise;
    //   });
    // }, "readable cancel() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let controller;
    //   let pipeToPromise;
    //   const ws = recordingWritableStream();
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         if (!pipeToPromise) {
    //           pipeToPromise = ts.readable.pipeTo(ws);
    //         }
    //         return 1;
    //       },
    //       highWaterMark: 1,
    //     }
    //   );
    //   // Allow promise returned by start() to resolve so that enqueue() will happen synchronously.
    //   return delay(0)
    //     .then(() => {
    //       controller.enqueue("a");
    //       assert_not_equals(pipeToPromise, undefined);

    //       // Some pipeTo() implementations need an additional chunk enqueued in order for the first one to be processed. See
    //       // https://github.com/whatwg/streams/issues/794 for background.
    //       controller.enqueue("a");

    //       // Give pipeTo() a chance to process the queued chunks.
    //       return delay(0);
    //     })
    //     .then(() => {
    //       assert_array_equals(
    //         ws.events,
    //         ["write", "a", "write", "a"],
    //         "ws should contain two chunks"
    //       );
    //       controller.terminate();
    //       return pipeToPromise;
    //     })
    //     .then(() => {
    //       assert_array_equals(
    //         ws.events,
    //         ["write", "a", "write", "a", "close"],
    //         "target should have been closed"
    //       );
    //     });
    // }, "pipeTo() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let controller;
    //   let readPromise;
    //   let calls = 0;
    //   let reader;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         // This is triggered by controller.enqueue(). The queue is empty and there are no pending reads. pull() is called
    //         // synchronously, allowing transform() to proceed asynchronously. This results in a second call to enqueue(),
    //         // which resolves this pending read() without calling size() again.
    //         readPromise = reader.read();
    //         ++calls;
    //         return 1;
    //       },
    //       highWaterMark: 0,
    //     }
    //   );
    //   reader = ts.readable.getReader();
    //   const writer = ts.writable.getWriter();
    //   let writeResolved = false;
    //   const writePromise = writer.write("b").then(() => {
    //     writeResolved = true;
    //   });
    //   return flushAsyncEvents()
    //     .then(() => {
    //       assert_false(writeResolved);
    //       controller.enqueue("a");
    //       assert_equals(calls, 1, "size() should have been called once");
    //       return delay(0);
    //     })
    //     .then(() => {
    //       assert_true(writeResolved);
    //       assert_equals(calls, 1, "size() should only be called once");
    //       return readPromise;
    //     })
    //     .then(({ value, done }) => {
    //       assert_false(done, "done should be false");
    //       // See https://github.com/whatwg/streams/issues/794 for why this chunk is not 'a'.
    //       assert_equals(value, "b", "chunk should have been read");
    //       assert_equals(calls, 1, "calls should still be 1");
    //       return writePromise;
    //     });
    // }, "read() inside of size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let writer;
    //   let writePromise1;
    //   let calls = 0;
    //   const ts = new TransformStream({}, undefined, {
    //     size() {
    //       ++calls;
    //       if (calls < 2) {
    //         writePromise1 = writer.write("a");
    //       }
    //       return 1;
    //     },
    //     highWaterMark: Infinity,
    //   });
    //   writer = ts.writable.getWriter();
    //   // Give pull() a chance to be called.
    //   return delay(0)
    //     .then(() => {
    //       // This write results in a synchronous call to transform(), enqueue(), and size().
    //       const writePromise2 = writer.write("b");
    //       assert_equals(calls, 1, "size() should have been called once");
    //       return Promise.all([writePromise1, writePromise2, writer.close()]);
    //     })
    //     .then(() => {
    //       assert_equals(calls, 2, "size() should have been called twice");
    //       return readableStreamToArray(ts.readable);
    //     })
    //     .then((array) => {
    //       assert_array_equals(
    //         array,
    //         ["b", "a"],
    //         "both chunks should have been enqueued"
    //       );
    //       assert_equals(calls, 2, "calls should still be 2");
    //     });
    // }, "writer.write() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let controller;
    //   let writer;
    //   let writePromise;
    //   let calls = 0;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         ++calls;
    //         if (calls < 2) {
    //           writePromise = writer.write("a");
    //         }
    //         return 1;
    //       },
    //       highWaterMark: Infinity,
    //     }
    //   );
    //   writer = ts.writable.getWriter();
    //   // Give pull() a chance to be called.
    //   return delay(0)
    //     .then(() => {
    //       // This enqueue results in synchronous calls to size(), write(), transform() and enqueue().
    //       controller.enqueue("b");
    //       assert_equals(calls, 2, "size() should have been called twice");
    //       return Promise.all([writePromise, writer.close()]);
    //     })
    //     .then(() => {
    //       return readableStreamToArray(ts.readable);
    //     })
    //     .then((array) => {
    //       // Because one call to enqueue() is nested inside the other, they finish in the opposite order that they were
    //       // called, so the chunks end up reverse order.
    //       assert_array_equals(
    //         array,
    //         ["a", "b"],
    //         "both chunks should have been enqueued"
    //       );
    //       assert_equals(calls, 2, "calls should still be 2");
    //     });
    // }, "synchronous writer.write() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   let writer;
    //   let closePromise;
    //   let controller;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         closePromise = writer.close();
    //         return 1;
    //       },
    //       highWaterMark: 1,
    //     }
    //   );
    //   writer = ts.writable.getWriter();
    //   const reader = ts.readable.getReader();
    //   // Wait for the promise returned by start() to be resolved so that the call to close() will result in a synchronous
    //   // call to TransformStreamDefaultSink.
    //   return delay(0)
    //     .then(() => {
    //       controller.enqueue("a");
    //       return reader.read();
    //     })
    //     .then(({ value, done }) => {
    //       assert_false(done, "done should be false");
    //       assert_equals(value, "a", "value should be correct");
    //       return reader.read();
    //     })
    //     .then(({ done }) => {
    //       assert_true(done, "done should be true");
    //       return closePromise;
    //     });
    // }, "writer.close() inside size() should work");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   let abortPromise;
    //   let controller;
    //   const ts = new TransformStream(
    //     {
    //       start(c) {
    //         controller = c;
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         abortPromise = ts.writable.abort(error1);
    //         return 1;
    //       },
    //       highWaterMark: 1,
    //     }
    //   );
    //   const reader = ts.readable.getReader();
    //   // Wait for the promise returned by start() to be resolved so that the call to abort() will result in a synchronous
    //   // call to TransformStreamDefaultSink.
    //   return delay(0)
    //     .then(() => {
    //       controller.enqueue("a");
    //       return reader.read();
    //     })
    //     .then(({ value, done }) => {
    //       assert_false(done, "done should be false");
    //       assert_equals(value, "a", "value should be correct");
    //       return Promise.all([
    //         promise_rejects_exactly(
    //           error1,
    //           reader.read(),
    //           "read() should reject"
    //         ),
    //         abortPromise,
    //       ]);
    //     });
    // }, "writer.abort() inside size() should work");

    // TODO: backpressure not implemented
    // test(() => {
    //   const ts = new TransformStream({}, { highWaterMark: 17 });
    //   assert_equals(
    //     ts.writable.getWriter().desiredSize,
    //     17,
    //     "desiredSize should be 17"
    //   );
    // }, "writableStrategy highWaterMark should work");

    // TODO: backpressure not implemented
    // await promise_test(() => {
    //   const ts = recordingTransformStream({}, undefined, { highWaterMark: 9 });
    //   const writer = ts.writable.getWriter();
    //   for (let i = 0; i < 10; ++i) {
    //     writer.write(i);
    //   }
    //   return delay(0).then(() => {
    //     assert_array_equals(
    //       ts.events,
    //       [
    //         "transform",
    //         0,
    //         "transform",
    //         1,
    //         "transform",
    //         2,
    //         "transform",
    //         3,
    //         "transform",
    //         4,
    //         "transform",
    //         5,
    //         "transform",
    //         6,
    //         "transform",
    //         7,
    //         "transform",
    //         8,
    //       ],
    //       "transform() should have been called 9 times"
    //     );
    //   });
    // }, "readableStrategy highWaterMark should work");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   let writableSizeCalled = false;
    //   let readableSizeCalled = false;
    //   let transformCalled = false;
    //   const ts = new TransformStream(
    //     {
    //       transform(chunk, controller) {
    //         t.step(() => {
    //           transformCalled = true;
    //           assert_true(
    //             writableSizeCalled,
    //             "writableStrategy.size() should have been called"
    //           );
    //           assert_false(
    //             readableSizeCalled,
    //             "readableStrategy.size() should not have been called"
    //           );
    //           controller.enqueue(chunk);
    //           assert_true(
    //             readableSizeCalled,
    //             "readableStrategy.size() should have been called"
    //           );
    //         });
    //       },
    //     },
    //     {
    //       size() {
    //         writableSizeCalled = true;
    //         return 1;
    //       },
    //     },
    //     {
    //       size() {
    //         readableSizeCalled = true;
    //         return 1;
    //       },
    //       highWaterMark: Infinity,
    //     }
    //   );
    //   return ts.writable
    //     .getWriter()
    //     .write()
    //     .then(() => {
    //       assert_true(transformCalled, "transform() should be called");
    //     });
    // }, "writable should have the correct size() function");

    // TODO: backpressure not implemented
    // test(() => {
    //   const ts = new TransformStream();
    //   const writer = ts.writable.getWriter();
    //   assert_equals(writer.desiredSize, 1, "default writable HWM is 1");
    //   writer.write(undefined);
    //   assert_equals(writer.desiredSize, 0, "default chunk size is 1");
    // }, "default writable strategy should be equivalent to { highWaterMark: 1 }");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   const ts = new TransformStream({
    //     transform(chunk, controller) {
    //       return t.step(() => {
    //         assert_equals(controller.desiredSize, 0, "desiredSize should be 0");
    //         controller.enqueue(undefined);
    //         // The first chunk enqueued is consumed by the pending read().
    //         assert_equals(
    //           controller.desiredSize,
    //           0,
    //           "desiredSize should still be 0"
    //         );
    //         controller.enqueue(undefined);
    //         assert_equals(
    //           controller.desiredSize,
    //           -1,
    //           "desiredSize should be -1"
    //         );
    //       });
    //     },
    //   });
    //   const writePromise = ts.writable.getWriter().write();
    //   return ts.readable
    //     .getReader()
    //     .read()
    //     .then(() => writePromise);
    // }, "default readable strategy should be equivalent to { highWaterMark: 0 }");

    // TODO: backpressure not implemented
    // test(() => {
    //   assert_throws_js(
    //     () => new TransformStream(undefined, { highWaterMark: -1 }),
    //     "should throw RangeError for negative writableHighWaterMark"
    //   );
    //   assert_throws_js(
    //     () => new TransformStream(undefined, undefined, { highWaterMark: -1 }),
    //     "should throw RangeError for negative readableHighWaterMark"
    //   );
    //   assert_throws_js(
    //     () => new TransformStream(undefined, { highWaterMark: NaN }),
    //     "should throw RangeError for NaN writableHighWaterMark"
    //   );
    //   assert_throws_js(
    //     () => new TransformStream(undefined, undefined, { highWaterMark: NaN }),
    //     "should throw RangeError for NaN readableHighWaterMark"
    //   );
    // }, "a RangeError should be thrown for an invalid highWaterMark");

    // const objectThatConvertsTo42 = {
    //   toString() {
    //     return "42";
    //   },
    // };

    // TODO: backpressure not implemented
    // test(() => {
    //   const ts = new TransformStream(undefined, {
    //     highWaterMark: objectThatConvertsTo42,
    //   });
    //   const writer = ts.writable.getWriter();
    //   assert_equals(writer.desiredSize, 42, "writable HWM is 42");
    // }, "writableStrategy highWaterMark should be converted to a number");

    // TODO: backpressure not implemented
    // test(() => {
    //   const ts = new TransformStream(
    //     {
    //       start(controller) {
    //         assert_equals(
    //           controller.desiredSize,
    //           42,
    //           "desiredSize should be 42"
    //         );
    //       },
    //     },
    //     undefined,
    //     { highWaterMark: objectThatConvertsTo42 }
    //   );
    // }, "readableStrategy highWaterMark should be converted to a number");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   const ts = new TransformStream(undefined, undefined, {
    //     size() {
    //       return NaN;
    //     },
    //     highWaterMark: 1,
    //   });
    //   const writer = ts.writable.getWriter();
    //   return promise_rejects_js(
    //     t,
    //     RangeError,
    //     writer.write(),
    //     "write should reject"
    //   );
    // }, "a bad readableStrategy size function should cause writer.write() to reject on an identity transform");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   const ts = new TransformStream(
    //     {
    //       transform(chunk, controller) {
    //         // This assert has the important side-effect of catching the error, so transform() does not throw.
    //         assert_throws_js(
    //           () => controller.enqueue(chunk),
    //           "enqueue should throw"
    //         );
    //       },
    //     },
    //     undefined,
    //     {
    //       size() {
    //         return -1;
    //       },
    //       highWaterMark: 1,
    //     }
    //   );

    //   const writer = ts.writable.getWriter();
    //   return writer.write().then(() => {
    //     return Promise.all([
    //       promise_rejects_js(
    //         t,
    //         RangeError,
    //         writer.ready,
    //         "ready should reject"
    //       ),
    //       promise_rejects_js(
    //         t,
    //         RangeError,
    //         writer.closed,
    //         "closed should reject"
    //       ),
    //       promise_rejects_js(
    //         t,
    //         RangeError,
    //         ts.readable.getReader().closed,
    //         "readable closed should reject"
    //       ),
    //     ]);
    //   });
    // }, "a bad readableStrategy size function should error the stream on enqueue even when transformer.transform() " + "catches the exception");

    await promise_test((t) => {
      const ts = recordingTransformStream({}, undefined, { highWaterMark: 0 });
      let readableController;
      const rs = new ReadableStream({
        start(controller) {
          readableController = controller;
        },
      });
      let pipeToRejected = false;
      const pipeToPromise = promise_rejects_js(
        rs.pipeTo(ts.writable),
        "pipeTo should reject"
      ).then(() => {
        pipeToRejected = true;
      });
      return delay(1)
        .then(() => {
          assert_array_equals(
            ts.events,
            [],
            "transform() should have seen no chunks"
          );
          assert_false(pipeToRejected, "pipeTo() should not have rejected yet");
          ts.controller.terminate();
          readableController.enqueue(0);
          return pipeToPromise;
        })
        .then(() => {
          assert_array_equals(
            ts.events,
            [],
            "transform() should still have seen no chunks"
          );
          assert_true(pipeToRejected, "pipeToRejected must be true");
        });
    }, "controller.terminate() should error pipeTo()");

    // TODO: backpressure not implemented
    // await promise_test((t) => {
    //   const ts = recordingTransformStream({}, undefined, { highWaterMark: 1 });
    //   const rs = new ReadableStream({
    //     start(controller) {
    //       controller.enqueue(0);
    //       controller.enqueue(1);
    //     },
    //   });
    //   const pipeToPromise = rs.pipeTo(ts.writable);
    //   return delay(0)
    //     .then(() => {
    //       assert_array_equals(
    //         ts.events,
    //         ["transform", 0],
    //         "transform() should have seen one chunk"
    //       );
    //       ts.controller.terminate();
    //       return promise_rejects_js(pipeToPromise, "pipeTo() should reject");
    //     })
    //     .then(() => {
    //       assert_array_equals(
    //         ts.events,
    //         ["transform", 0],
    //         "transform() should still have seen only one chunk"
    //       );
    //     });
    // }, "controller.terminate() should prevent remaining chunks from being processed");

    test(() => {
      new TransformStream({
        start(controller) {
          controller.enqueue(0);
          controller.terminate();
          assert_throws_js(() => controller.enqueue(1), "enqueue should throw");
        },
      });
    }, "controller.enqueue() should throw after controller.terminate()");

    await promise_test((t) => {
      const ts = new TransformStream({
        start(controller) {
          controller.enqueue(0);
          controller.terminate();
          controller.error(error1);
        },
      });
      return Promise.all([
        promise_rejects_js(
          ts.writable.abort(),
          "abort() should reject with a TypeError"
        ),
        promise_rejects_exactly(
          error1,
          ts.readable.cancel(),
          "cancel() should reject with error1"
        ),
        promise_rejects_exactly(
          error1,
          ts.readable.getReader().closed,
          "closed should reject with error1"
        ),
      ]);
    }, "controller.error() after controller.terminate() with queued chunk should error the readable");

    await promise_test((t) => {
      const ts = new TransformStream({
        start(controller) {
          controller.terminate();
          controller.error(error1);
        },
      });
      return Promise.all([
        promise_rejects_js(
          ts.writable.abort(),
          "abort() should reject with a TypeError"
        ),
        ts.readable.cancel(),
        ts.readable.getReader().closed,
      ]);
    }, "controller.error() after controller.terminate() without queued chunk should do nothing");

    await promise_test(() => {
      const ts = new TransformStream({
        flush(controller) {
          controller.terminate();
        },
      });
      const writer = ts.writable.getWriter();
      return Promise.all([
        writer.close(),
        writer.closed,
        ts.readable.getReader().closed,
      ]);
    }, "controller.terminate() inside flush() should not prevent writer.close() from succeeding");

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
