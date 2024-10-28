// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { writeAll } from "./write_all";
function isCloser(value) {
  return (
    typeof value === "object" &&
    value != null &&
    "close" in value &&
    // deno-lint-ignore no-explicit-any
    typeof value["close"] === "function"
  );
}
/** Create a `WritableStream` from a `Writer`. */
export function writableStreamFromWriter(writer, options = {}) {
  const { autoClose = true } = options;
  return new WritableStream({
    async write(chunk, controller) {
      try {
        await writeAll(writer, chunk);
      } catch (e) {
        controller.error(e);
        if (isCloser(writer) && autoClose) {
          writer.close();
        }
      }
    },
    close() {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
    abort() {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
  });
}
