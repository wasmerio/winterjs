// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import randomBytes, { MAX_SIZE as kMaxUint32 } from "./_randomBytes";
const kBufferMaxLength = 0x7fffffff;
function assertOffset(offset, length) {
  if (offset > kMaxUint32 || offset < 0) {
    throw new TypeError("offset must be a uint32");
  }
  if (offset > kBufferMaxLength || offset > length) {
    throw new RangeError("offset out of range");
  }
}
function assertSize(size, offset, length) {
  if (size > kMaxUint32 || size < 0) {
    throw new TypeError("size must be a uint32");
  }
  if (size + offset > length || size > kBufferMaxLength) {
    throw new RangeError("buffer too small");
  }
}
export default function randomFill(buf, offset, size, cb) {
  if (typeof offset === "function") {
    cb = offset;
    offset = 0;
    size = buf.length;
  } else if (typeof size === "function") {
    cb = size;
    size = buf.length - Number(offset);
  }
  assertOffset(offset, buf.length);
  assertSize(size, offset, buf.length);
  randomBytes(size, (err, bytes) => {
    if (err) return cb(err, buf);
    bytes?.copy(buf, offset);
    cb(null, buf);
  });
}
export function randomFillSync(buf, offset = 0, size) {
  assertOffset(offset, buf.length);
  if (size === undefined) size = buf.length - offset;
  assertSize(size, offset, buf.length);
  const bytes = randomBytes(size);
  bytes.copy(buf, offset);
  return buf;
}
