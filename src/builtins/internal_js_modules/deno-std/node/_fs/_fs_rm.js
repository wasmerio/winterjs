// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  validateRmOptions,
  validateRmOptionsSync,
} from "../internal/fs/utils.mjs";
import { denoErrorToNodeError } from "../internal/errors";
import { promisify } from "../internal/util.mjs";
export function rm(path, optionsOrCallback, maybeCallback) {
  const callback =
    typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  const options =
    typeof optionsOrCallback === "object" ? optionsOrCallback : undefined;
  if (!callback) throw new Error("No callback function supplied");
  validateRmOptions(path, options, false, (err, options) => {
    if (err) {
      return callback(err);
    }
    Deno.remove(path, { recursive: options?.recursive }).then(
      (_) => callback(null),
      (err) => {
        if (options?.force && err instanceof Deno.errors.NotFound) {
          callback(null);
        } else {
          callback(
            err instanceof Error
              ? denoErrorToNodeError(err, { syscall: "rm" })
              : err
          );
        }
      }
    );
  });
}
export const rmPromise = promisify(rm);
export function rmSync(path, options) {
  options = validateRmOptionsSync(path, options, false);
  try {
    Deno.removeSync(path, { recursive: options?.recursive });
  } catch (err) {
    if (options?.force && err instanceof Deno.errors.NotFound) {
      return;
    }
    if (err instanceof Error) {
      throw denoErrorToNodeError(err, { syscall: "stat" });
    } else {
      throw err;
    }
  }
}
