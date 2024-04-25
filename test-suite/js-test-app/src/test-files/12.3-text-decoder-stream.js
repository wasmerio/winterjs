import {
  assert_array_equals,
  assert_equals,
  assert_false,
  assert_throws_js,
  assert_true,
  promise_rejects_js,
  promise_test,
  readableStreamFromArray,
  readableStreamToArray,
  test
} from "../test-utils";

async function handleRequest(request) {
  try {
    const labelToName = {
      'unicode-1-1-utf-8': 'utf-8',
      'iso-8859-2': 'iso-8859-2',
      'ascii': 'windows-1252',
      'utf-16': 'utf-16le'
    };

    for (const label of Object.keys(labelToName)) {
      test(() => {
        const stream = new TextDecoderStream(label);
        assert_equals(stream.encoding, labelToName[label], 'encoding should match');
      }, `encoding attribute should have correct value for '${label}'`);
    }

    for (const falseValue of [false, 0, '', undefined, null]) {
      test(() => {
        const stream = new TextDecoderStream('utf-8', { fatal: falseValue });
        assert_false(stream.fatal, 'fatal should be false');
      }, `setting fatal to '${falseValue}' should set the attribute to false`);

      test(() => {
        const stream = new TextDecoderStream('utf-8', { ignoreBOM: falseValue });
        assert_false(stream.ignoreBOM, 'ignoreBOM should be false');
      }, `setting ignoreBOM to '${falseValue}' should set the attribute to false`);
    }

    for (const trueValue of [true, 1, {}, [], 'yes']) {
      test(() => {
        const stream = new TextDecoderStream('utf-8', { fatal: trueValue });
        assert_true(stream.fatal, 'fatal should be true');
      }, `setting fatal to '${trueValue}' should set the attribute to true`);

      test(() => {
        const stream = new TextDecoderStream('utf-8', { ignoreBOM: trueValue });
        assert_true(stream.ignoreBOM, 'ignoreBOM should be true');
      }, `setting ignoreBOM to '${trueValue}' should set the attribute to true`);
    }

    test(() => {
      assert_throws_js(() => new TextDecoderStream(''),
        'the constructor should throw');
    }, 'constructing with an invalid encoding should throw');

    test(() => {
      assert_throws_js(() => new TextDecoderStream({
        toString() { return {}; }
      }), 'the constructor should throw');
    }, 'constructing with a non-stringifiable encoding should throw');

    test(() => {
      assert_throws_js(
        () => new TextDecoderStream('utf-8', {
          get fatal() { throw new Error(); }
        }), 'the constructor should throw');
    }, 'a throwing fatal member should cause the constructor to throw');

    test(() => {
      assert_throws_js(
        () => new TextDecoderStream('utf-8', {
          get ignoreBOM() { throw new Error(); }
        }), 'the constructor should throw');
    }, 'a throwing ignoreBOM member should cause the constructor to throw');

    const badChunks = [
      {
        name: 'undefined',
        value: undefined
      },
      {
        name: 'null',
        value: null
      },
      {
        name: 'numeric',
        value: 3.14
      },
      {
        name: 'object, not BufferSource',
        value: {}
      },
      {
        name: 'array',
        value: [65]
      }
    ];

    for (const chunk of badChunks) {
      await promise_test(async t => {
        const tds = new TextDecoderStream();
        const reader = tds.readable.getReader();
        const writer = tds.writable.getWriter();
        const writePromise = writer.write(chunk.value);
        const readPromise = reader.read();
        await promise_rejects_js(writePromise, 'write should reject');
        await promise_rejects_js(readPromise, 'read should reject');
      }, `chunk of type ${chunk.name} should error the stream`);
    }

    const cases = [
      { encoding: 'utf-8', bytes: [0xEF, 0xBB, 0xBF, 0x61, 0x62, 0x63] },
      { encoding: 'utf-16le', bytes: [0xFF, 0xFE, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00] },
      { encoding: 'utf-16be', bytes: [0xFE, 0xFF, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63] }
    ];
    const BOM = '\uFEFF';

    // |inputChunks| is an array of chunks, each represented by an array of
    // integers. |ignoreBOM| is true or false. The result value is the output of the
    // pipe, concatenated into a single string.
    async function pipeAndAssemble(inputChunks, encoding, ignoreBOM) {
      const chunksAsUint8 = inputChunks.map(values => new Uint8Array(values));
      const readable = readableStreamFromArray(chunksAsUint8);
      const outputArray = await readableStreamToArray(readable.pipeThrough(
        new TextDecoderStream(encoding, { ignoreBOM })));
      return outputArray.join('');
    }

    for (const testCase of cases) {
      for (let splitPoint = 0; splitPoint < 4; ++splitPoint) {
        await promise_test(async () => {
          const inputChunks = [testCase.bytes.slice(0, splitPoint),
          testCase.bytes.slice(splitPoint)];
          const withIgnoreBOM =
            await pipeAndAssemble(inputChunks, testCase.encoding, true);
          assert_equals(withIgnoreBOM, BOM + 'abc', 'BOM should be preserved');

          const withoutIgnoreBOM =
            await pipeAndAssemble(inputChunks, testCase.encoding, false);
          assert_equals(withoutIgnoreBOM, 'abc', 'BOM should be stripped')
        }, `ignoreBOM should work for encoding ${testCase.encoding}, split at ` +
        `character ${splitPoint}`);
      }
    }

    let inputBytes = [229];

    await promise_test(async () => {
      const input = readableStreamFromArray([new Uint8Array(inputBytes)]);
      const output = input.pipeThrough(new TextDecoderStream());
      const array = await readableStreamToArray(output);
      assert_array_equals(array, ['\uFFFD'], 'array should have one element');
    }, 'incomplete input with error mode "replacement" should end with a ' +
    'replacement character');

    await promise_test(async () => {
      const input = readableStreamFromArray([new Uint8Array(inputBytes)]);
      const output = input.pipeThrough(new TextDecoderStream(
        'utf-8', { fatal: true }));
      const reader = output.getReader();
      await promise_rejects_js(reader.read(),
        'read should reject');
    }, 'incomplete input with error mode "fatal" should error the stream');

    const encodings = [
      {
        name: 'UTF-16BE',
        value: [108, 52],
        expected: "\u{6c34}",
        invalid: [0xD8, 0x00]
      },
      {
        name: 'UTF-16LE',
        value: [52, 108],
        expected: "\u{6c34}",
        invalid: [0x00, 0xD8]
      },
      {
        name: 'Shift_JIS',
        value: [144, 133],
        expected: "\u{6c34}",
        invalid: [255]
      },
      {
        name: 'ISO-2022-JP',
        value: [65, 66, 67, 0x1B, 65, 66, 67],
        expected: "ABC\u{fffd}ABC",
        invalid: [0x0E]
      },
      {
        name: 'ISO-8859-14',
        value: [100, 240, 114],
        expected: "d\u{0175}r",
        invalid: undefined  // all bytes are treated as valid
      }
    ];

    for (const encoding of encodings) {
      await promise_test(async () => {
        const stream = new TextDecoderStream(encoding.name);
        const reader = stream.readable.getReader();
        const writer = stream.writable.getWriter();
        const writePromise = writer.write(new Uint8Array(encoding.value));
        const { value, done } = await reader.read();
        assert_false(done, 'readable should not be closed');
        assert_equals(value, encoding.expected, 'chunk should match expected');
        await writePromise;
      }, `TextDecoderStream should be able to decode ${encoding.name}`);

      if (!encoding.invalid)
        continue;

      await promise_test(async t => {
        const stream = new TextDecoderStream(encoding.name);
        const reader = stream.readable.getReader();
        const writer = stream.writable.getWriter();
        const writePromise = writer.write(new Uint8Array(encoding.invalid));
        const closePromise = writer.close();
        const { value, done } = await reader.read();
        assert_false(done, 'readable should not be closed');
        assert_equals(value, '\u{FFFD}', 'output should be replacement character');
        await Promise.all([writePromise, closePromise]);
      }, `TextDecoderStream should be able to decode invalid sequences in ` +
      `${encoding.name}`);

      await promise_test(async t => {
        const stream = new TextDecoderStream(encoding.name, { fatal: true });
        const reader = stream.readable.getReader();
        const writer = stream.writable.getWriter();
        const writePromise = writer.write(new Uint8Array(encoding.invalid));
        const closePromise = writer.close();
        await promise_rejects_js(reader.read(),
          'readable should be errored');
        await promise_rejects_js(
          Promise.all([writePromise, closePromise]),
          'writable should be errored');
      }, `TextDecoderStream should be able to reject invalid sequences in ` +
      `${encoding.name}`);
    }

    inputBytes = [73, 32, 240, 159, 146, 153, 32, 115, 116, 114, 101,
      97, 109, 115];
    for (const splitPoint of [2, 3, 4, 5]) {
      await promise_test(async () => {
        const input = readableStreamFromArray(
          [new Uint8Array(inputBytes.slice(0, splitPoint)),
          new Uint8Array(inputBytes.slice(splitPoint))]);
        const expectedOutput = ['I ', '\u{1F499} streams'];
        const output = input.pipeThrough(new TextDecoderStream());
        const array = await readableStreamToArray(output);
        assert_array_equals(array, expectedOutput,
          'the split code point should be in the second chunk ' +
          'of the output');
      }, 'a code point split between chunks should not be emitted until all ' +
      'bytes are available; split point = ' + splitPoint);
    }

    await promise_test(async () => {
      const splitPoint = 6;
      const input = readableStreamFromArray(
        [new Uint8Array(inputBytes.slice(0, splitPoint)),
        new Uint8Array(inputBytes.slice(splitPoint))]);
      const output = input.pipeThrough(new TextDecoderStream());
      const array = await readableStreamToArray(output);
      assert_array_equals(array, ['I \u{1F499}', ' streams'],
        'the multibyte character should be in the first chunk ' +
        'of the output');
    }, 'a code point should be emitted as soon as all bytes are available');

    for (let splitPoint = 1; splitPoint < 7; ++splitPoint) {
      await promise_test(async () => {
        const input = readableStreamFromArray(
          [new Uint8Array(inputBytes.slice(0, splitPoint)),
          new Uint8Array([]),
          new Uint8Array(inputBytes.slice(splitPoint))]);
        const concatenatedOutput = 'I \u{1F499} streams';
        const output = input.pipeThrough(new TextDecoderStream());
        const array = await readableStreamToArray(output);
        assert_equals(array.length, 2, 'two chunks should be output');
        assert_equals(array[0].concat(array[1]), concatenatedOutput,
          'output should be unchanged by the empty chunk');
      }, 'an empty chunk inside a code point split between chunks should not ' +
      'change the output; split point = ' + splitPoint);
    }

    test(() => {
      const td = new TextDecoderStream();
      assert_equals(typeof ReadableStream.prototype.getReader.call(td.readable),
        'object', 'readable property must pass brand check');
      assert_equals(typeof WritableStream.prototype.getWriter.call(td.writable),
        'object', 'writable property must pass brand check');
    }, 'TextDecoderStream readable and writable properties must pass brand checks');

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };