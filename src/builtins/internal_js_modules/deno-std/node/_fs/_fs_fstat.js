// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { CFISBIS } from "./_fs_stat";
export function fstat(fd, optionsOrCallback, maybeCallback) {
  const callback =
    typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  const options =
    typeof optionsOrCallback === "object"
      ? optionsOrCallback
      : { bigint: false };
  if (!callback) throw new Error("No callback function supplied");
  Deno.fstat(fd).then(
    (stat) => callback(null, CFISBIS(stat, options.bigint)),
    (err) => callback(err)
  );
}
export function fstatSync(fd, options) {
  const origin = Deno.fstatSync(fd);
  return CFISBIS(origin, options?.bigint || false);
}
