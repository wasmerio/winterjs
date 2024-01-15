import { assert, assert_equals, readStream } from "../test-utils";

async function handleRequest(request) {
  try {
    let file = new File(['abc', 'def'], 'file.txt', { type: 'text/plain', lastModified: 123 });
    assert_equals(await file.text(), 'abcdef');
    assert_equals(file.lastModified, 123);
    assert_equals(file.name, 'file.txt');
    assert_equals(file.type, 'text/plain');

    let stream = file.stream();
    assert(stream instanceof ReadableStream, 'File.stream() should return an instance of ReadableStream');

    let sliced = file.slice(2, 4, 'application/json');
    assert_equals(await sliced.text(), 'cd');
    assert_equals(sliced.type, 'application/json');

    stream = sliced.stream();
    let read = await readStream(stream);
    assert_equals(read, 'cd');

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };

