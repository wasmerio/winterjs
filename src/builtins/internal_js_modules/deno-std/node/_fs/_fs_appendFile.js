// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { isFd, maybeCallback } from "./_fs_common";
import { copyObject, getOptions } from "../internal/fs/utils.mjs";
import { writeFile, writeFileSync } from "./_fs_writeFile";
import { promisify } from "../internal/util.mjs";
/**
 * TODO: Also accept 'data' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
export function appendFile(path, data, options, callback) {
  callback = maybeCallback(callback || options);
  options = getOptions(options, { encoding: "utf8", mode: 0o666, flag: "a" });
  // Don't make changes directly on options object
  options = copyObject(options);
  // Force append behavior when using a supplied file descriptor
  if (!options.flag || isFd(path)) {
    options.flag = "a";
  }
  writeFile(path, data, options, callback);
}
/**
 * TODO: Also accept 'data' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
export const appendFilePromise = promisify(appendFile);
/**
 * TODO: Also accept 'data' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
export function appendFileSync(path, data, options) {
  options = getOptions(options, { encoding: "utf8", mode: 0o666, flag: "a" });
  // Don't make changes directly on options object
  options = copyObject(options);
  // Force append behavior when using a supplied file descriptor
  if (!options.flag || isFd(path)) {
    options.flag = "a";
  }
  writeFileSync(path, data, options);
}
