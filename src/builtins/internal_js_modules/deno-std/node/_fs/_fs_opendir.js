// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import Dir from "./_fs_dir";
import { getOptions, getValidatedPath } from "../internal/fs/utils.mjs";
import { denoErrorToNodeError } from "../internal/errors";
import { validateFunction, validateInteger } from "../internal/validators.mjs";
import { promisify } from "../internal/util.mjs";
function _validateFunction(callback) {
  validateFunction(callback, "callback");
}
/** @link https://nodejs.org/api/fs.html#fsopendirsyncpath-options */
export function opendir(path, options, callback) {
  callback = typeof options === "function" ? options : callback;
  _validateFunction(callback);
  path = getValidatedPath(path).toString();
  let err, dir;
  try {
    const { bufferSize } = getOptions(options, {
      encoding: "utf8",
      bufferSize: 32,
    });
    validateInteger(bufferSize, "options.bufferSize", 1, 4294967295);
    /** Throws if path is invalid */
    Deno.readDirSync(path);
    dir = new Dir(path);
  } catch (error) {
    err = denoErrorToNodeError(error, { syscall: "opendir" });
  }
  if (err) {
    callback(err);
  } else {
    callback(null, dir);
  }
}
/** @link https://nodejs.org/api/fs.html#fspromisesopendirpath-options */
export const opendirPromise = promisify(opendir);
export function opendirSync(path, options) {
  path = getValidatedPath(path).toString();
  const { bufferSize } = getOptions(options, {
    encoding: "utf8",
    bufferSize: 32,
  });
  validateInteger(bufferSize, "options.bufferSize", 1, 4294967295);
  try {
    /** Throws if path is invalid */
    Deno.readDirSync(path);
    return new Dir(path);
  } catch (err) {
    throw denoErrorToNodeError(err, { syscall: "opendir" });
  }
}
