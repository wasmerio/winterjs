// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { asyncIterableToCallback } from "./_fs_watch";
import Dirent from "./_fs_dirent";
import { denoErrorToNodeError } from "../internal/errors";
import { getValidatedPath } from "../internal/fs/utils.mjs";
import { promisify } from "../internal/util.mjs";
function toDirent(val) {
  return new Dirent(val);
}
export function readdir(path, optionsOrCallback, maybeCallback) {
  const callback =
    typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  const options =
    typeof optionsOrCallback === "object" ? optionsOrCallback : null;
  const result = [];
  path = getValidatedPath(path);
  if (!callback) throw new Error("No callback function supplied");
  if (options?.encoding) {
    try {
      new TextDecoder(options.encoding);
    } catch {
      throw new Error(
        `TypeError [ERR_INVALID_OPT_VALUE_ENCODING]: The value "${options.encoding}" is invalid for option "encoding"`
      );
    }
  }
  try {
    asyncIterableToCallback(
      Deno.readDir(path.toString()),
      (val, done) => {
        if (typeof path !== "string") return;
        if (done) {
          callback(null, result);
          return;
        }
        if (options?.withFileTypes) {
          result.push(toDirent(val));
        } else result.push(decode(val.name));
      },
      (e) => {
        callback(denoErrorToNodeError(e, { syscall: "readdir" }));
      }
    );
  } catch (e) {
    callback(denoErrorToNodeError(e, { syscall: "readdir" }));
  }
}
function decode(str, encoding) {
  if (!encoding) return str;
  else {
    const decoder = new TextDecoder(encoding);
    const encoder = new TextEncoder();
    return decoder.decode(encoder.encode(str));
  }
}
export const readdirPromise = promisify(readdir);
export function readdirSync(path, options) {
  const result = [];
  path = getValidatedPath(path);
  if (options?.encoding) {
    try {
      new TextDecoder(options.encoding);
    } catch {
      throw new Error(
        `TypeError [ERR_INVALID_OPT_VALUE_ENCODING]: The value "${options.encoding}" is invalid for option "encoding"`
      );
    }
  }
  try {
    for (const file of Deno.readDirSync(path.toString())) {
      if (options?.withFileTypes) {
        result.push(toDirent(file));
      } else result.push(decode(file.name));
    }
  } catch (e) {
    throw denoErrorToNodeError(e, { syscall: "readdir" });
  }
  return result;
}
