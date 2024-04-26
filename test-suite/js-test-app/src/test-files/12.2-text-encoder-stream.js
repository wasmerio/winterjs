import { assert_equals, promise_rejects_exactly, promise_test, readableStreamFromArray, readableStreamToArray, test } from "../test-utils";

async function handleRequest(request) {
  try {
    const error1 = new Error('error1');
    error1.name = 'error1';

    await promise_test(() => {
      const ts = new TextEncoderStream();
      const writer = ts.writable.getWriter();
      const reader = ts.readable.getReader();
      const writePromise = writer.write({
        toString() { throw error1; }
      });
      const readPromise = reader.read();
      return Promise.all([
        promise_rejects_exactly(error1, readPromise, 'read should reject with error1'),
        promise_rejects_exactly(error1, writePromise, 'write should reject with error1'),
        promise_rejects_exactly(error1, reader.closed, 'readable should be errored with error1'),
        promise_rejects_exactly(error1, writer.closed, 'writable should be errored with error1'),
      ]);
    }, 'a chunk that cannot be converted to a string should error the streams');

    const oddInputs = [
      {
        name: 'string',
        value: 'hello!',
        expected: 'hello!'
      },
      {
        name: 'undefined',
        value: undefined,
        expected: 'undefined'
      },
      {
        name: 'null',
        value: null,
        expected: 'null'
      },
      {
        name: 'numeric',
        value: 3.14,
        expected: '3.14'
      },
      {
        name: 'object',
        value: {},
        expected: '[object Object]'
      },
      {
        name: 'array',
        value: ['hi'],
        expected: 'hi'
      }
    ];

    for (const input of oddInputs) {
      await promise_test(async () => {
        const outputReadable = readableStreamFromArray([input.value])
          .pipeThrough(new TextEncoderStream())
          .pipeThrough(new TextDecoderStream());
        const output = await readableStreamToArray(outputReadable);
        assert_equals(output.length, 1, 'output should contain one chunk');
        assert_equals(output[0], input.expected, 'output should be correct');
      }, `input of type ${input.name} should be converted correctly to string`);
    }

    test(() => {
      const te = new TextEncoderStream();
      assert_equals(typeof ReadableStream.prototype.getReader.call(te.readable),
        'object', 'readable property must pass brand check');
      assert_equals(typeof WritableStream.prototype.getWriter.call(te.writable),
        'object', 'writable property must pass brand check');
    }, 'TextEncoderStream readable and writable properties must pass brand checks');

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };