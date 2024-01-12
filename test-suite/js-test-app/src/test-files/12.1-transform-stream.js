class LipFuzzTransformer {
  constructor(substitutions) {
    this.substitutions = substitutions;
    this.partialChunk = '';
    this.lastIndex = undefined;
  }

  transform(chunk, controller) {
    chunk = this.partialChunk + chunk;
    this.partialChunk = '';
    // lastIndex is the index of the first character after the last substitution.
    this.lastIndex = 0;
    chunk = chunk.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, this.replaceTag.bind(this));
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
      replacement = '';
    }
    this.lastIndex = offset + replacement.length;
    return replacement;
  }
}

const substitutions = {
  in1: 'out1',
  in2: 'out2',
  quine: '{{quine}}',
  bogusPartial: '{{incompleteResult}'
};

const lipFuzzTestCases = [
  {
    input: [''],
    output: ['']
  },
  {
    input: [],
    output: []
  },
  {
    input: ['{{in1}}'],
    output: ['out1']
  },
  {
    input: ['z{{in1}}'],
    output: ['zout1']
  },
  {
    input: ['{{in1}}q'],
    output: ['out1q']
  },
  {
    input: ['{{in1}}{{in1}'],
    output: ['out1', '{{in1}']
  },
  {
    input: ['{{in1}}{{in1}', '}'],
    output: ['out1', 'out1']
  },
  {
    input: ['{{in1', '}}'],
    output: ['', 'out1']
  },
  {
    input: ['{{', 'in1}}'],
    output: ['', 'out1']
  },
  {
    input: ['{', '{in1}}'],
    output: ['', 'out1']
  },
  {
    input: ['{{', 'in1}'],
    output: ['', '', '{{in1}']
  },
  {
    input: ['{'],
    output: ['', '{']
  },
  {
    input: ['{', ''],
    output: ['', '', '{']
  },
  {
    input: ['{', '{', 'i', 'n', '1', '}', '}'],
    output: ['', '', '', '', '', '', 'out1']
  },
  {
    input: ['{{in1}}{{in2}}{{in1}}'],
    output: ['out1out2out1']
  },
  {
    input: ['{{wrong}}'],
    output: ['']
  },
  {
    input: ['{{wron', 'g}}'],
    output: ['', '']
  },
  {
    input: ['{{quine}}'],
    output: ['{{quine}}']
  },
  {
    input: ['{{bogusPartial}}'],
    output: ['{{incompleteResult}']
  },
  {
    input: ['{{bogusPartial}}}'],
    output: ['{{incompleteResult}}']
  }
];


async function handleRequest(request) {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  };

  const assertTrue = (condition, message) => {
    if (condition !== true) {
      throw new Error(message || "Assertion failed");
    }
  }

  const assertFalse = (condition, message) => {
    if (condition !== false) {
      throw new Error(message || "Assertion failed");
    }
  }

  const assertArrayEquals = (array1, array2, message) => {
    if (array1.length != array2.length || array1.length === undefined) {
      throw new Error(message || "Assertion failed");
    }

    for (let i in array1) {
      if (array1[i] != array2[i]) {
        throw new Error(message || "Assertion failed");
      }
    }

    // Make sure array2 has no keys that array1 doesn't
    for (let i in array2) {
      if (array1[i] != array2[i]) {
        throw new Error(message || "Assertion failed");
      }
    }
  }

  const assertUnreached = (message) => {
    throw new Error(message || "Assertion failed: should not be reached");
  }

  const assertThrowsJs = (f, message) => {
    try {
      f();
      throw undefined;
    }
    catch (e) {
      if (e === undefined) {
        throw new Error(`Should have thrown error: ${message}`);
      }
    }
  }

  const assertEquals = (actual, expected, message) => {
    assert(
      actual === expected,
      message || `Expected ${expected} but got ${actual}`
    );
  };

  const test = (f, desc) => {
    try {
      f();
    }
    catch (e) {
      throw new Error(`Test ${desc} failed with ${e}`);
    }
  }

  const promiseTest = async (f, desc) => {
    try {
      await f();
    }
    catch (e) {
      throw new Error(`Test ${desc} failed with ${e}`);
    }
  }

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const flushAsyncEvents = () => delay(0).then(() => delay(0)).then(() => delay(0)).then(() => delay(0));

  function readableStreamToArray(stream) {
    var array = [];
    var writable = new WritableStream({
      write(chunk) {
        array.push(chunk);
      }
    });
    return stream.pipeTo(writable).then(() => array);
  }

  try {
    test(() => {
      new TransformStream({ transform() { } });
    }, 'TransformStream can be constructed with a transform function');

    test(() => {
      new TransformStream();
      new TransformStream({});
    }, 'TransformStream can be constructed with no transform function');

    test(() => {
      const ts = new TransformStream({ transform() { } });

      const writer = ts.writable.getWriter();
      assertEquals(writer.desiredSize, 1, 'writer.desiredSize should be 1');
    }, 'TransformStream writable starts in the writable state');

    await promiseTest(() => {
      const ts = new TransformStream();

      const writer = ts.writable.getWriter();
      writer.write('a');
      assertEquals(writer.desiredSize, 0, 'writer.desiredSize should be 0 after write()');

      return ts.readable.getReader().read().then(result => {
        assertEquals(result.value, 'a',
          'result from reading the readable is the same as was written to writable');
        assertFalse(result.done, 'stream should not be done');

        return delay(0).then(() => assertEquals(writer.desiredSize, 1, 'desiredSize should be 1 again'));
      });
    }, 'Identity TransformStream: can read from readable what is put into writable');

    await promiseTest(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform(chunk) {
          c.enqueue(chunk.toUpperCase());
        }
      });

      const writer = ts.writable.getWriter();
      writer.write('a');

      return ts.readable.getReader().read().then(result => {
        assertEquals(result.value, 'A',
          'result from reading the readable is the transformation of what was written to writable');
        assertFalse(result.done, 'stream should not be done');
      });
    }, 'Uppercaser sync TransformStream: can read from readable transformed version of what is put into writable');

    await promiseTest(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform(chunk) {
          c.enqueue(chunk.toUpperCase());
          c.enqueue(chunk.toUpperCase());
        }
      });

      const writer = ts.writable.getWriter();
      writer.write('a');

      const reader = ts.readable.getReader();

      return reader.read().then(result1 => {
        assertEquals(result1.value, 'A',
          'the first chunk read is the transformation of the single chunk written');
        assertFalse(result1.done, 'stream should not be done');

        return reader.read().then(result2 => {
          assertEquals(result2.value, 'A',
            'the second chunk read is also the transformation of the single chunk written');
          assertFalse(result2.done, 'stream should not be done');
        });
      });
    }, 'Uppercaser-doubler sync TransformStream: can read both chunks put into the readable');

    await promiseTest(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform(chunk) {
          return delay(0).then(() => c.enqueue(chunk.toUpperCase()));
        }
      });

      const writer = ts.writable.getWriter();
      writer.write('a');

      return ts.readable.getReader().read().then(result => {
        assertEquals(result.value, 'A',
          'result from reading the readable is the transformation of what was written to writable');
        assertFalse(result.done, 'stream should not be done');
      });
    }, 'Uppercaser async TransformStream: can read from readable transformed version of what is put into writable');

    await promiseTest(() => {
      let doSecondEnqueue;
      let returnFromTransform;
      const ts = new TransformStream({
        transform(chunk, controller) {
          delay(0).then(() => controller.enqueue(chunk.toUpperCase()));
          doSecondEnqueue = () => controller.enqueue(chunk.toUpperCase());
          return new Promise(resolve => {
            returnFromTransform = resolve;
          });
        }
      });

      const reader = ts.readable.getReader();

      const writer = ts.writable.getWriter();
      writer.write('a');

      return reader.read().then(result1 => {
        assertEquals(result1.value, 'A',
          'the first chunk read is the transformation of the single chunk written');
        assertFalse(result1.done, 'stream should not be done');
        doSecondEnqueue();

        return reader.read().then(result2 => {
          assertEquals(result2.value, 'A',
            'the second chunk read is also the transformation of the single chunk written');
          assertFalse(result2.done, 'stream should not be done');
          returnFromTransform();
        });
      });
    }, 'Uppercaser-doubler async TransformStream: can read both chunks put into the readable');

    await promiseTest(() => {
      const ts = new TransformStream({ transform() { } });

      const writer = ts.writable.getWriter();
      writer.close();

      return Promise.all([writer.closed, ts.readable.getReader().closed]);
    }, 'TransformStream: by default, closing the writable closes the readable (when there are no queued writes)');

    await promiseTest(() => {
      let transformResolve;
      const transformPromise = new Promise(resolve => {
        transformResolve = resolve;
      });
      const ts = new TransformStream({
        transform() {
          return transformPromise;
        }
      }, undefined, { highWaterMark: 1 });

      const writer = ts.writable.getWriter();
      writer.write('a');
      writer.close();

      let rsClosed = false;
      ts.readable.getReader().closed.then(() => {
        rsClosed = true;
      });

      return delay(0).then(() => {
        assertEquals(rsClosed, false, 'readable is not closed after a tick');
        transformResolve();

        return writer.closed.then(() => {
          // TODO: Is this expectation correct?
          assertEquals(rsClosed, true, 'readable is closed at that point');
        });
      });
    }, 'TransformStream: by default, closing the writable waits for transforms to finish before closing both');

    await promiseTest(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform() {
          c.enqueue('x');
          c.enqueue('y');
          return delay(0);
        }
      });

      const writer = ts.writable.getWriter();
      writer.write('a');
      writer.close();

      const readableChunks = readableStreamToArray(ts.readable);

      return writer.closed.then(() => {
        return readableChunks.then(chunks => {
          assertArrayEquals(chunks, ['x', 'y'], 'both enqueued chunks can be read from the readable');
        });
      });
    }, 'TransformStream: by default, closing the writable closes the readable after sync enqueues and async done');

    await promiseTest(() => {
      let c;
      const ts = new TransformStream({
        start(controller) {
          c = controller;
        },
        transform() {
          return delay(0)
            .then(() => c.enqueue('x'))
            .then(() => c.enqueue('y'))
            .then(() => delay(0));
        }
      });

      const writer = ts.writable.getWriter();
      writer.write('a');
      writer.close();

      const readableChunks = readableStreamToArray(ts.readable);

      return writer.closed.then(() => {
        return readableChunks.then(chunks => {
          assertArrayEquals(chunks, ['x', 'y'], 'both enqueued chunks can be read from the readable');
        });
      });
    }, 'TransformStream: by default, closing the writable closes the readable after async enqueues and async done');

    await promiseTest(() => {
      let c;
      const ts = new TransformStream({
        suffix: '-suffix',

        start(controller) {
          c = controller;
          c.enqueue('start' + this.suffix);
        },

        transform(chunk) {
          c.enqueue(chunk + this.suffix);
        },

        flush() {
          c.enqueue('flushed' + this.suffix);
        }
      });

      const writer = ts.writable.getWriter();
      writer.write('a');
      writer.close();

      const readableChunks = readableStreamToArray(ts.readable);

      return writer.closed.then(() => {
        return readableChunks.then(chunks => {
          assertArrayEquals(chunks, ['start-suffix', 'a-suffix', 'flushed-suffix'], 'all enqueued chunks have suffixes');
        });
      });
    }, 'Transform stream should call transformer methods as methods');

    await promiseTest(() => {
      function functionWithOverloads() { }
      functionWithOverloads.apply = () => assertUnreached('apply() should not be called');
      functionWithOverloads.call = () => assertUnreached('call() should not be called');
      const ts = new TransformStream({
        start: functionWithOverloads,
        transform: functionWithOverloads,
        flush: functionWithOverloads
      });
      const writer = ts.writable.getWriter();
      writer.write('a');
      writer.close();

      return readableStreamToArray(ts.readable);
    }, 'methods should not not have .apply() or .call() called');

    await promiseTest(() => {
      let transformCalled = false;
      const ts = new TransformStream({
        transform() {
          transformCalled = true;
        }
      }, undefined, { highWaterMark: Infinity });
      // transform() is only called synchronously when there is no backpressure and all microtasks have run.
      return delay(0).then(() => {
        const writePromise = ts.writable.getWriter().write();
        assertTrue(transformCalled, 'transform() should have been called');
        return writePromise;
      });
    }, 'it should be possible to call transform() synchronously');

    await promiseTest(() => {
      const ts = new TransformStream({}, undefined, { highWaterMark: 0 });

      const writer = ts.writable.getWriter();
      writer.close();

      return Promise.all([writer.closed, ts.readable.getReader().closed]);
    }, 'closing the writable should close the readable when there are no queued chunks, even with backpressure');

    test(() => {
      new TransformStream({
        start(controller) {
          controller.terminate();
          assertThrowsJs(() => controller.enqueue(), 'enqueue should throw');
        }
      });
    }, 'enqueue() should throw after controller.terminate()');

    await promiseTest(() => {
      let controller;
      const ts = new TransformStream({
        start(c) {
          controller = c;
        }
      });
      const cancelPromise = ts.readable.cancel();
      assertThrowsJs(() => controller.enqueue(), 'enqueue should throw');
      return cancelPromise;
    }, 'enqueue() should throw after readable.cancel()');

    test(() => {
      new TransformStream({
        start(controller) {
          controller.terminate();
          controller.terminate();
        }
      });
    }, 'controller.terminate() should do nothing the second time it is called');

    await promiseTest(() => {
      let calls = 0;
      new TransformStream({
        start() {
          ++calls;
        }
      });
      return flushAsyncEvents().then(() => {
        assertEquals(calls, 1, 'start() should have been called exactly once');
      });
    }, 'start() should not be called twice');

    test(() => {
      class Subclass extends TransformStream {
        extraFunction() {
          return true;
        }
      }
      assertEquals(
        Object.getPrototypeOf(Subclass.prototype), TransformStream.prototype,
        'Subclass.prototype\'s prototype should be TransformStream.prototype');
      assertEquals(Object.getPrototypeOf(Subclass), TransformStream,
        'Subclass\'s prototype should be TransformStream');
      const sub = new Subclass();
      assertTrue(sub instanceof TransformStream,
        'Subclass object should be an instance of TransformStream');
      assertTrue(sub instanceof Subclass,
        'Subclass object should be an instance of Subclass');
      const readableGetter = Object.getOwnPropertyDescriptor(
        TransformStream.prototype, 'readable').get;
      assertEquals(readableGetter.call(sub), sub.readable,
        'Subclass object should pass brand check');
      assertTrue(sub.extraFunction(),
        'extraFunction() should be present on Subclass object');
    }, 'Subclassing TransformStream should work');

    for (const testCase of lipFuzzTestCases) {
      const inputChunks = testCase.input;
      const outputChunks = testCase.output;
      promiseTest(() => {
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
              assertFalse(done, `done should be false when reading ${outputChunk}`);
              assertEquals(value, outputChunk, `value should match outputChunk`);
            });
          });
        }
        readerChain = readerChain.then(() => {
          return reader.read().then(({ done }) => assertTrue(done, `done should be true`));
        });
        promises.push(readerChain);
        return Promise.all(promises);
      }, `testing "${inputChunks}" (length ${inputChunks.length})`);
    }


    // Create a response with the Blob's text
    return new Response("All Tests Passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
