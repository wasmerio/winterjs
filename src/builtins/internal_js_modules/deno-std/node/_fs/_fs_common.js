// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  O_APPEND,
  O_CREAT,
  O_EXCL,
  O_RDONLY,
  O_RDWR,
  O_TRUNC,
  O_WRONLY,
} from "./_fs_constants";
import { validateFunction } from "../internal/validators.mjs";
import { notImplemented } from "../_utils";
export function isFileOptions(fileOptions) {
  if (!fileOptions) return false;
  return (
    fileOptions.encoding != undefined ||
    fileOptions.flag != undefined ||
    fileOptions.signal != undefined ||
    fileOptions.mode != undefined
  );
}
export function getEncoding(optOrCallback) {
  if (!optOrCallback || typeof optOrCallback === "function") {
    return null;
  }
  const encoding =
    typeof optOrCallback === "string" ? optOrCallback : optOrCallback.encoding;
  if (!encoding) return null;
  return encoding;
}
export function checkEncoding(encoding) {
  if (!encoding) return null;
  encoding = encoding.toLowerCase();
  if (["utf8", "hex", "base64"].includes(encoding)) return encoding;
  if (encoding === "utf-8") {
    return "utf8";
  }
  if (encoding === "binary") {
    return "binary";
    // before this was buffer, however buffer is not used in Node
    // node -e "require('fs').readFile('../world.txt', 'buffer', console.log)"
  }
  const notImplementedEncodings = ["utf16le", "latin1", "ascii", "ucs2"];
  if (notImplementedEncodings.includes(encoding)) {
    notImplemented(`"${encoding}" encoding`);
  }
  throw new Error(`The value "${encoding}" is invalid for option "encoding"`);
}
export function getOpenOptions(flag) {
  if (!flag) {
    return { create: true, append: true };
  }
  let openOptions = {};
  if (typeof flag === "string") {
    switch (flag) {
      case "a": {
        // 'a': Open file for appending. The file is created if it does not exist.
        openOptions = { create: true, append: true };
        break;
      }
      case "ax":
      case "xa": {
        // 'ax', 'xa': Like 'a' but fails if the path exists.
        openOptions = { createNew: true, write: true, append: true };
        break;
      }
      case "a+": {
        // 'a+': Open file for reading and appending. The file is created if it does not exist.
        openOptions = { read: true, create: true, append: true };
        break;
      }
      case "ax+":
      case "xa+": {
        // 'ax+', 'xa+': Like 'a+' but fails if the path exists.
        openOptions = { read: true, createNew: true, append: true };
        break;
      }
      case "r": {
        // 'r': Open file for reading. An exception occurs if the file does not exist.
        openOptions = { read: true };
        break;
      }
      case "r+": {
        // 'r+': Open file for reading and writing. An exception occurs if the file does not exist.
        openOptions = { read: true, write: true };
        break;
      }
      case "w": {
        // 'w': Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
        openOptions = { create: true, write: true, truncate: true };
        break;
      }
      case "wx":
      case "xw": {
        // 'wx', 'xw': Like 'w' but fails if the path exists.
        openOptions = { createNew: true, write: true };
        break;
      }
      case "w+": {
        // 'w+': Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
        openOptions = { create: true, write: true, truncate: true, read: true };
        break;
      }
      case "wx+":
      case "xw+": {
        // 'wx+', 'xw+': Like 'w+' but fails if the path exists.
        openOptions = { createNew: true, write: true, read: true };
        break;
      }
      case "as":
      case "sa": {
        // 'as', 'sa': Open file for appending in synchronous mode. The file is created if it does not exist.
        openOptions = { create: true, append: true };
        break;
      }
      case "as+":
      case "sa+": {
        // 'as+', 'sa+': Open file for reading and appending in synchronous mode. The file is created if it does not exist.
        openOptions = { create: true, read: true, append: true };
        break;
      }
      case "rs+":
      case "sr+": {
        // 'rs+', 'sr+': Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache.
        openOptions = { create: true, read: true, write: true };
        break;
      }
      default: {
        throw new Error(`Unrecognized file system flag: ${flag}`);
      }
    }
  } else if (typeof flag === "number") {
    if ((flag & O_APPEND) === O_APPEND) {
      openOptions.append = true;
    }
    if ((flag & O_CREAT) === O_CREAT) {
      openOptions.create = true;
      openOptions.write = true;
    }
    if ((flag & O_EXCL) === O_EXCL) {
      openOptions.createNew = true;
      openOptions.read = true;
      openOptions.write = true;
    }
    if ((flag & O_TRUNC) === O_TRUNC) {
      openOptions.truncate = true;
    }
    if ((flag & O_RDONLY) === O_RDONLY) {
      openOptions.read = true;
    }
    if ((flag & O_WRONLY) === O_WRONLY) {
      openOptions.write = true;
    }
    if ((flag & O_RDWR) === O_RDWR) {
      openOptions.read = true;
      openOptions.write = true;
    }
  }
  return openOptions;
}
export { isUint32 as isFd } from "../internal/validators.mjs";
export function maybeCallback(cb) {
  validateFunction(cb, "cb");
  return cb;
}
// Ensure that callbacks run in the global context. Only use this function
// for callbacks that are passed to the binding layer, callbacks that are
// invoked from JS already run in the proper scope.
export function makeCallback(cb) {
  validateFunction(cb, "cb");
  return (...args) => Reflect.apply(cb, this, args);
}
