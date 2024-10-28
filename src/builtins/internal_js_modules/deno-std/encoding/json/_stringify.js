// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Convert each chunk to JSON string.
 *
 * This can be used to stringify [JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/), [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464), and [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).
 * You can optionally specify a prefix and suffix for each chunk. The default prefix is "" and the default suffix is "\n".
 *
 * @example
 * ```ts
 * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_iterable";
 * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream";
 *
 * const file = await Deno.open("./tmp.jsonl", { create: true, write: true });
 *
 * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new JsonStringifyStream()) // convert to JSON lines (ndjson)
 *   .pipeThrough(new TextEncoderStream()) // convert a string to a Uint8Array
 *   .pipeTo(file.writable)
 *   .then(() => console.log("write success"));
 * ```
 *
 * @example
 * To convert to [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464), set the
 * prefix to the delimiter "\x1E" as options.
 * ```ts
 * import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_iterable";
 * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream";
 *
 * const file = await Deno.open("./tmp.jsonl", { create: true, write: true });
 *
 * readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
 *   .pipeThrough(new JsonStringifyStream({ prefix: "\x1E", suffix: "\n" })) // convert to JSON Text Sequences
 *   .pipeThrough(new TextEncoderStream())
 *   .pipeTo(file.writable)
 *   .then(() => console.log("write success"));
 * ```
 *
 * @example
 * If you want to stream [JSON lines](https://jsonlines.org/) from the server:
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server";
 * import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream";
 *
 * // A server that streams one line of JSON every second
 * serve(() => {
 *   let intervalId: number | undefined;
 *   const readable = new ReadableStream({
 *     start(controller) {
 *       // enqueue data once per second
 *       intervalId = setInterval(() => {
 *         controller.enqueue({ now: new Date() });
 *       }, 1000);
 *     },
 *     cancel() {
 *       clearInterval(intervalId);
 *     },
 *   });
 *
 *   const body = readable
 *     .pipeThrough(new JsonStringifyStream()) // convert data to JSON lines
 *     .pipeThrough(new TextEncoderStream()); // convert a string to a Uint8Array
 *
 *   return new Response(body);
 * });
 * ```
 */
export class JsonStringifyStream extends TransformStream {
  constructor({
    prefix = "",
    suffix = "\n",
    writableStrategy,
    readableStrategy,
  } = {}) {
    super(
      {
        transform(chunk, controller) {
          controller.enqueue(`${prefix}${JSON.stringify(chunk)}${suffix}`);
        },
      },
      writableStrategy,
      readableStrategy
    );
  }
}
