// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer";
import { ERR_INVALID_ARG_TYPE } from "../internal/errors";
import {
  validateOffsetLengthRead,
  validatePosition,
} from "../internal/fs/utils.mjs";
import { validateBuffer, validateInteger } from "../internal/validators.mjs";
export function read(
  fd,
  optOrBufferOrCb,
  offsetOrCallback,
  length,
  position,
  callback
) {
  let cb;
  let offset = 0,
    buffer;
  if (typeof fd !== "number") {
    throw new ERR_INVALID_ARG_TYPE("fd", "number", fd);
  }
  if (length == null) {
    length = 0;
  }
  if (typeof offsetOrCallback === "function") {
    cb = offsetOrCallback;
  } else if (typeof optOrBufferOrCb === "function") {
    cb = optOrBufferOrCb;
  } else {
    offset = offsetOrCallback;
    validateInteger(offset, "offset", 0);
    cb = callback;
  }
  if (
    optOrBufferOrCb instanceof Buffer ||
    optOrBufferOrCb instanceof Uint8Array
  ) {
    buffer = optOrBufferOrCb;
  } else if (typeof optOrBufferOrCb === "function") {
    offset = 0;
    buffer = Buffer.alloc(16384);
    length = buffer.byteLength;
    position = null;
  } else {
    const opt = optOrBufferOrCb;
    if (
      !(opt.buffer instanceof Buffer) &&
      !(opt.buffer instanceof Uint8Array)
    ) {
      if (opt.buffer === null) {
        // @ts-ignore: Intentionally create TypeError for passing test-fs-read.js#L87
        length = opt.buffer.byteLength;
      }
      throw new ERR_INVALID_ARG_TYPE(
        "buffer",
        ["Buffer", "TypedArray", "DataView"],
        optOrBufferOrCb
      );
    }
    offset = opt.offset ?? 0;
    buffer = opt.buffer ?? Buffer.alloc(16384);
    length = opt.length ?? buffer.byteLength;
    position = opt.position ?? null;
  }
  if (position == null) {
    position = -1;
  }
  validatePosition(position);
  validateOffsetLengthRead(offset, length, buffer.byteLength);
  if (!cb) throw new ERR_INVALID_ARG_TYPE("cb", "Callback", cb);
  (async () => {
    try {
      let nread;
      if (typeof position === "number" && position >= 0) {
        const currentPosition = await Deno.seek(fd, 0, Deno.SeekMode.Current);
        // We use sync calls below to avoid being affected by others during
        // these calls.
        Deno.seekSync(fd, position, Deno.SeekMode.Start);
        nread = Deno.readSync(fd, buffer);
        Deno.seekSync(fd, currentPosition, Deno.SeekMode.Start);
      } else {
        nread = await Deno.read(fd, buffer);
      }
      cb(null, nread ?? 0, Buffer.from(buffer.buffer, offset, length));
    } catch (error) {
      cb(error, null);
    }
  })();
}
export function readSync(fd, buffer, offsetOrOpt, length, position) {
  let offset = 0;
  if (typeof fd !== "number") {
    throw new ERR_INVALID_ARG_TYPE("fd", "number", fd);
  }
  validateBuffer(buffer);
  if (length == null) {
    length = 0;
  }
  if (typeof offsetOrOpt === "number") {
    offset = offsetOrOpt;
    validateInteger(offset, "offset", 0);
  } else {
    const opt = offsetOrOpt;
    offset = opt.offset ?? 0;
    length = opt.length ?? buffer.byteLength;
    position = opt.position ?? null;
  }
  if (position == null) {
    position = -1;
  }
  validatePosition(position);
  validateOffsetLengthRead(offset, length, buffer.byteLength);
  let currentPosition = 0;
  if (typeof position === "number" && position >= 0) {
    currentPosition = Deno.seekSync(fd, 0, Deno.SeekMode.Current);
    Deno.seekSync(fd, position, Deno.SeekMode.Start);
  }
  const numberOfBytesRead = Deno.readSync(fd, buffer);
  if (typeof position === "number" && position >= 0) {
    Deno.seekSync(fd, currentPosition, Deno.SeekMode.Start);
  }
  return numberOfBytesRead ?? 0;
}
