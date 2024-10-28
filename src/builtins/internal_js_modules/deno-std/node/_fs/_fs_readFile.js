// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { getEncoding } from "./_fs_common";
import { Buffer } from "../buffer";
import { fromFileUrl } from "../path";
import { promisify } from "../internal/util.mjs";
function maybeDecode(data, encoding) {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (encoding && encoding !== "binary") return buffer.toString(encoding);
  return buffer;
}
export function readFile(path, optOrCallback, callback) {
  path = path instanceof URL ? fromFileUrl(path) : path;
  let cb;
  if (typeof optOrCallback === "function") {
    cb = optOrCallback;
  } else {
    cb = callback;
  }
  const encoding = getEncoding(optOrCallback);
  const p = Deno.readFile(path);
  if (cb) {
    p.then(
      (data) => {
        if (encoding && encoding !== "binary") {
          const text = maybeDecode(data, encoding);
          return cb(null, text);
        }
        const buffer = maybeDecode(data, encoding);
        cb(null, buffer);
      },
      (err) => cb && cb(err)
    );
  }
}
export const readFilePromise = promisify(readFile);
export function readFileSync(path, opt) {
  path = path instanceof URL ? fromFileUrl(path) : path;
  const data = Deno.readFileSync(path);
  const encoding = getEncoding(opt);
  if (encoding && encoding !== "binary") {
    const text = maybeDecode(data, encoding);
    return text;
  }
  const buffer = maybeDecode(data, encoding);
  return buffer;
}
