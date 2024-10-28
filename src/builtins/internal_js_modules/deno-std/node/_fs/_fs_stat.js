// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { denoErrorToNodeError } from "../internal/errors";
import { promisify } from "../internal/util.mjs";
export function convertFileInfoToStats(origin) {
  return {
    dev: origin.dev,
    ino: origin.ino,
    mode: origin.mode,
    nlink: origin.nlink,
    uid: origin.uid,
    gid: origin.gid,
    rdev: origin.rdev,
    size: origin.size,
    blksize: origin.blksize,
    blocks: origin.blocks,
    mtime: origin.mtime,
    atime: origin.atime,
    birthtime: origin.birthtime,
    mtimeMs: origin.mtime?.getTime() || null,
    atimeMs: origin.atime?.getTime() || null,
    birthtimeMs: origin.birthtime?.getTime() || null,
    isFile: () => origin.isFile,
    isDirectory: () => origin.isDirectory,
    isSymbolicLink: () => origin.isSymlink,
    // not sure about those
    isBlockDevice: () => false,
    isFIFO: () => false,
    isCharacterDevice: () => false,
    isSocket: () => false,
    ctime: origin.mtime,
    ctimeMs: origin.mtime?.getTime() || null,
  };
}
function toBigInt(number) {
  if (number === null || number === undefined) return null;
  return BigInt(number);
}
export function convertFileInfoToBigIntStats(origin) {
  return {
    dev: toBigInt(origin.dev),
    ino: toBigInt(origin.ino),
    mode: toBigInt(origin.mode),
    nlink: toBigInt(origin.nlink),
    uid: toBigInt(origin.uid),
    gid: toBigInt(origin.gid),
    rdev: toBigInt(origin.rdev),
    size: toBigInt(origin.size) || 0n,
    blksize: toBigInt(origin.blksize),
    blocks: toBigInt(origin.blocks),
    mtime: origin.mtime,
    atime: origin.atime,
    birthtime: origin.birthtime,
    mtimeMs: origin.mtime ? BigInt(origin.mtime.getTime()) : null,
    atimeMs: origin.atime ? BigInt(origin.atime.getTime()) : null,
    birthtimeMs: origin.birthtime ? BigInt(origin.birthtime.getTime()) : null,
    mtimeNs: origin.mtime ? BigInt(origin.mtime.getTime()) * 1000000n : null,
    atimeNs: origin.atime ? BigInt(origin.atime.getTime()) * 1000000n : null,
    birthtimeNs: origin.birthtime
      ? BigInt(origin.birthtime.getTime()) * 1000000n
      : null,
    isFile: () => origin.isFile,
    isDirectory: () => origin.isDirectory,
    isSymbolicLink: () => origin.isSymlink,
    // not sure about those
    isBlockDevice: () => false,
    isFIFO: () => false,
    isCharacterDevice: () => false,
    isSocket: () => false,
    ctime: origin.mtime,
    ctimeMs: origin.mtime ? BigInt(origin.mtime.getTime()) : null,
    ctimeNs: origin.mtime ? BigInt(origin.mtime.getTime()) * 1000000n : null,
  };
}
// shortcut for Convert File Info to Stats or BigIntStats
export function CFISBIS(fileInfo, bigInt) {
  if (bigInt) return convertFileInfoToBigIntStats(fileInfo);
  return convertFileInfoToStats(fileInfo);
}
export function stat(path, optionsOrCallback, maybeCallback) {
  const callback =
    typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  const options =
    typeof optionsOrCallback === "object"
      ? optionsOrCallback
      : { bigint: false };
  if (!callback) throw new Error("No callback function supplied");
  Deno.stat(path).then(
    (stat) => callback(null, CFISBIS(stat, options.bigint)),
    (err) => callback(denoErrorToNodeError(err, { syscall: "stat" }))
  );
}
export const statPromise = promisify(stat);
export function statSync(
  path,
  options = { bigint: false, throwIfNoEntry: true }
) {
  try {
    const origin = Deno.statSync(path);
    return CFISBIS(origin, options.bigint);
  } catch (err) {
    if (
      options?.throwIfNoEntry === false &&
      err instanceof Deno.errors.NotFound
    ) {
      return;
    }
    if (err instanceof Error) {
      throw denoErrorToNodeError(err, { syscall: "stat" });
    } else {
      throw err;
    }
  }
}
