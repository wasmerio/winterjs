// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { getCiphers } from "../../_crypto/crypto_browserify/browserify_aes/mod.js";
import { notImplemented } from "../../_utils";
import { Buffer } from "../../buffer";
import { ERR_INVALID_ARG_TYPE, hideStackFrames } from "../errors";
import { isAnyArrayBuffer, isArrayBufferView } from "../util/types";
import { kHandle, kKeyObject } from "./constants";
// TODO(kt3k): Generate this list from `digestAlgorithms`
// of std/crypto/_wasm/mod.ts
const digestAlgorithms = [
  "blake2b256",
  "blake2b384",
  "blake2b",
  "blake2s",
  "blake3",
  "keccak-224",
  "keccak-256",
  "keccak-384",
  "keccak-512",
  "sha384",
  "sha3-224",
  "sha3-256",
  "sha3-384",
  "sha3-512",
  "shake128",
  "shake256",
  "tiger",
  "rmd160",
  "sha224",
  "sha256",
  "sha512",
  "md4",
  "md5",
  "sha1",
];
let defaultEncoding = "buffer";
export function setDefaultEncoding(val) {
  defaultEncoding = val;
}
export function getDefaultEncoding() {
  return defaultEncoding;
}
// This is here because many functions accepted binary strings without
// any explicit encoding in older versions of node, and we don't want
// to break them unnecessarily.
export function toBuf(val, encoding) {
  if (typeof val === "string") {
    if (encoding === "buffer") {
      encoding = "utf8";
    }
    return Buffer.from(val, encoding);
  }
  return val;
}
export const validateByteSource = hideStackFrames((val, name) => {
  val = toBuf(val);
  if (isAnyArrayBuffer(val) || isArrayBufferView(val)) {
    return;
  }
  throw new ERR_INVALID_ARG_TYPE(
    name,
    ["string", "ArrayBuffer", "TypedArray", "DataView", "Buffer"],
    val
  );
});
/**
 * Returns an array of the names of the supported hash algorithms, such as 'sha1'.
 */
export function getHashes() {
  return digestAlgorithms;
}
export function getCurves() {
  notImplemented("crypto.getCurves");
}
export function secureHeapUsed() {
  notImplemented("crypto.secureHeapUsed");
}
export function setEngine(_engine, _flags) {
  notImplemented("crypto.setEngine");
}
export { getCiphers, kHandle, kKeyObject };
export default {
  getDefaultEncoding,
  getHashes,
  setDefaultEncoding,
  getCiphers,
  getCurves,
  secureHeapUsed,
  setEngine,
  validateByteSource,
  toBuf,
  kHandle,
  kKeyObject,
};
