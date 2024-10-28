import { fromFileUrl } from "../path";
import { promisify } from "../internal/util.mjs";
export function truncate(path, lenOrCallback, maybeCallback) {
  path = path instanceof URL ? fromFileUrl(path) : path;
  const len = typeof lenOrCallback === "number" ? lenOrCallback : undefined;
  const callback =
    typeof lenOrCallback === "function" ? lenOrCallback : maybeCallback;
  if (!callback) throw new Error("No callback function supplied");
  Deno.truncate(path, len).then(() => callback(null), callback);
}
export const truncatePromise = promisify(truncate);
export function truncateSync(path, len) {
  path = path instanceof URL ? fromFileUrl(path) : path;
  Deno.truncateSync(path, len);
}
