// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { DEFAULT_CHUNK_SIZE } from "./_common";
function isCloser(value) {
  return (
    typeof value === "object" &&
    value != null &&
    "close" in value &&
    // deno-lint-ignore no-explicit-any
    typeof value["close"] === "function"
  );
}
/**
 * Create a `ReadableStream<Uint8Array>` from a `Reader`.
 *
 * When the pull algorithm is called on the stream, a chunk from the reader
 * will be read.  When `null` is returned from the reader, the stream will be
 * closed along with the reader (if it is also a `Closer`).
 *
 * An example converting a `Deno.FsFile` into a readable stream:
 *
 * ```ts
 * import { readableStreamFromReader } from "https://deno.land/std@$STD_VERSION/streams/readable_stream_from_reader";
 *
 * const file = await Deno.open("./file.txt", { read: true });
 * const fileStream = readableStreamFromReader(file);
 * ```
 */
export function readableStreamFromReader(reader, options = {}) {
  const {
    autoClose = true,
    chunkSize = DEFAULT_CHUNK_SIZE,
    strategy,
  } = options;
  return new ReadableStream(
    {
      async pull(controller) {
        const chunk = new Uint8Array(chunkSize);
        try {
          const read = await reader.read(chunk);
          if (read === null) {
            if (isCloser(reader) && autoClose) {
              reader.close();
            }
            controller.close();
            return;
          }
          controller.enqueue(chunk.subarray(0, read));
        } catch (e) {
          controller.error(e);
          if (isCloser(reader)) {
            reader.close();
          }
        }
      },
      cancel() {
        if (isCloser(reader) && autoClose) {
          reader.close();
        }
      },
    },
    strategy
  );
}
