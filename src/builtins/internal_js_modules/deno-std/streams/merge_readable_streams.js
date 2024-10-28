// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { deferred } from "../async/deferred";
/**
 * Merge multiple streams into a single one, not taking order into account.
 * If a stream ends before other ones, the other will continue adding data,
 * and the finished one will not add any more data.
 */
export function mergeReadableStreams(...streams) {
  const resolvePromises = streams.map(() => deferred());
  return new ReadableStream({
    start(controller) {
      Promise.all(resolvePromises).then(() => {
        controller.close();
      });
      try {
        for (const [key, stream] of Object.entries(streams)) {
          (async () => {
            for await (const data of stream) {
              controller.enqueue(data);
            }
            resolvePromises[+key].resolve();
          })();
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
