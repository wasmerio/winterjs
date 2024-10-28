// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { intoCallbackAPIWithIntercept, notImplemented } from "../_utils";
import { fromFileUrl } from "../path";
import { promisify } from "../internal/util.mjs";
function maybeEncode(data, encoding) {
  if (encoding === "buffer") {
    return new TextEncoder().encode(data);
  }
  return data;
}
function getEncoding(optOrCallback) {
  if (!optOrCallback || typeof optOrCallback === "function") {
    return null;
  } else {
    if (optOrCallback.encoding) {
      if (
        optOrCallback.encoding === "utf8" ||
        optOrCallback.encoding === "utf-8"
      ) {
        return "utf8";
      } else if (optOrCallback.encoding === "buffer") {
        return "buffer";
      } else {
        notImplemented(`fs.readlink encoding=${optOrCallback.encoding}`);
      }
    }
    return null;
  }
}
export function readlink(path, optOrCallback, callback) {
  path = path instanceof URL ? fromFileUrl(path) : path;
  let cb;
  if (typeof optOrCallback === "function") {
    cb = optOrCallback;
  } else {
    cb = callback;
  }
  const encoding = getEncoding(optOrCallback);
  intoCallbackAPIWithIntercept(
    Deno.readLink,
    (data) => maybeEncode(data, encoding),
    cb,
    path
  );
}
export const readlinkPromise = promisify(readlink);
export function readlinkSync(path, opt) {
  path = path instanceof URL ? fromFileUrl(path) : path;
  return maybeEncode(Deno.readLinkSync(path), getEncoding(opt));
}
