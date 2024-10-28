// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { CFISBIS } from "./_fs_stat";
import { promisify } from "../internal/util.mjs";
export function lstat(path, optionsOrCallback, maybeCallback) {
  const callback =
    typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  const options =
    typeof optionsOrCallback === "object"
      ? optionsOrCallback
      : { bigint: false };
  if (!callback) throw new Error("No callback function supplied");
  Deno.lstat(path).then(
    (stat) => callback(null, CFISBIS(stat, options.bigint)),
    (err) => callback(err)
  );
}
export const lstatPromise = promisify(lstat);
export function lstatSync(path, options) {
  const origin = Deno.lstatSync(path);
  return CFISBIS(origin, options?.bigint || false);
}
