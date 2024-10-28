// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import {
  validateFunction,
  validateInteger,
  validateString,
} from "../validators.mjs";
import {
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
  hideStackFrames,
} from "../errors";
import { toBuf, validateByteSource } from "./util";
import { createSecretKey, isKeyObject } from "./keys";
import { kMaxLength } from "../buffer.mjs";
import { isAnyArrayBuffer, isArrayBufferView } from "../util/types";
import { notImplemented } from "../../_utils";
const validateParameters = hideStackFrames((hash, key, salt, info, length) => {
  key = prepareKey(key);
  salt = toBuf(salt);
  info = toBuf(info);
  validateString(hash, "digest");
  validateByteSource(salt, "salt");
  validateByteSource(info, "info");
  validateInteger(length, "length", 0, kMaxLength);
  if (info.byteLength > 1024) {
    throw new ERR_OUT_OF_RANGE(
      "info",
      "must not contain more than 1024 bytes",
      info.byteLength
    );
  }
  return {
    hash,
    key,
    salt,
    info,
    length,
  };
});
function prepareKey(key) {
  if (isKeyObject(key)) {
    return key;
  }
  if (isAnyArrayBuffer(key)) {
    return createSecretKey(new Uint8Array(key));
  }
  key = toBuf(key);
  if (!isArrayBufferView(key)) {
    throw new ERR_INVALID_ARG_TYPE(
      "ikm",
      [
        "string",
        "SecretKeyObject",
        "ArrayBuffer",
        "TypedArray",
        "DataView",
        "Buffer",
      ],
      key
    );
  }
  return createSecretKey(key);
}
export function hkdf(hash, key, salt, info, length, callback) {
  ({ hash, key, salt, info, length } = validateParameters(
    hash,
    key,
    salt,
    info,
    length
  ));
  validateFunction(callback, "callback");
  notImplemented("crypto.hkdf");
}
export function hkdfSync(hash, key, salt, info, length) {
  ({ hash, key, salt, info, length } = validateParameters(
    hash,
    key,
    salt,
    info,
    length
  ));
  notImplemented("crypto.hkdfSync");
}
export default {
  hkdf,
  hkdfSync,
};
