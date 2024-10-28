// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { kHandle, kKeyObject } from "./constants";
import {
  ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
} from "../errors";
import { notImplemented } from "../../_utils";
import { Buffer } from "../../buffer";
import { isAnyArrayBuffer, isArrayBufferView } from "../util/types";
import { hideStackFrames } from "../errors";
import {
  isCryptoKey as isCryptoKey_,
  isKeyObject as isKeyObject_,
  kKeyType,
} from "./_keys";
const getArrayBufferOrView = hideStackFrames((buffer, name, encoding) => {
  if (isAnyArrayBuffer(buffer)) {
    return buffer;
  }
  if (typeof buffer === "string") {
    if (encoding === "buffer") {
      encoding = "utf8";
    }
    return Buffer.from(buffer, encoding);
  }
  if (!isArrayBufferView(buffer)) {
    throw new ERR_INVALID_ARG_TYPE(
      name,
      ["string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
      buffer
    );
  }
  return buffer;
});
export function isKeyObject(obj) {
  return isKeyObject_(obj);
}
export function isCryptoKey(obj) {
  return isCryptoKey_(obj);
}
export class KeyObject {
  [kKeyType];
  [kHandle];
  constructor(type, handle) {
    if (type !== "secret" && type !== "public" && type !== "private") {
      throw new ERR_INVALID_ARG_VALUE("type", type);
    }
    if (typeof handle !== "object") {
      throw new ERR_INVALID_ARG_TYPE("handle", "object", handle);
    }
    this[kKeyType] = type;
    Object.defineProperty(this, kHandle, {
      value: handle,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }
  get type() {
    return this[kKeyType];
  }
  get asymmetricKeyDetails() {
    notImplemented("crypto.KeyObject.prototype.asymmetricKeyDetails");
    return undefined;
  }
  get asymmetricKeyType() {
    notImplemented("crypto.KeyObject.prototype.asymmetricKeyType");
    return undefined;
  }
  get symmetricKeySize() {
    notImplemented("crypto.KeyObject.prototype.symmetricKeySize");
    return undefined;
  }
  static from(key) {
    if (!isCryptoKey(key)) {
      throw new ERR_INVALID_ARG_TYPE("key", "CryptoKey", key);
    }
    notImplemented("crypto.KeyObject.prototype.from");
  }
  equals(otherKeyObject) {
    if (!isKeyObject(otherKeyObject)) {
      throw new ERR_INVALID_ARG_TYPE(
        "otherKeyObject",
        "KeyObject",
        otherKeyObject
      );
    }
    notImplemented("crypto.KeyObject.prototype.equals");
  }
  export(_options) {
    notImplemented("crypto.KeyObject.prototype.asymmetricKeyType");
  }
}
export function createPrivateKey(_key) {
  notImplemented("crypto.createPrivateKey");
}
export function createPublicKey(_key) {
  notImplemented("crypto.createPublicKey");
}
function getKeyTypes(allowKeyObject, bufferOnly = false) {
  const types = [
    "ArrayBuffer",
    "Buffer",
    "TypedArray",
    "DataView",
    "string", // Only if bufferOnly == false
    "KeyObject", // Only if allowKeyObject == true && bufferOnly == false
    "CryptoKey", // Only if allowKeyObject == true && bufferOnly == false
  ];
  if (bufferOnly) {
    return types.slice(0, 4);
  } else if (!allowKeyObject) {
    return types.slice(0, 5);
  }
  return types;
}
export function prepareSecretKey(key, encoding, bufferOnly = false) {
  if (!bufferOnly) {
    if (isKeyObject(key)) {
      if (key.type !== "secret") {
        throw new ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE(key.type, "secret");
      }
      return key[kHandle];
    } else if (isCryptoKey(key)) {
      if (key.type !== "secret") {
        throw new ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE(key.type, "secret");
      }
      return key[kKeyObject][kHandle];
    }
  }
  if (
    typeof key !== "string" &&
    !isArrayBufferView(key) &&
    !isAnyArrayBuffer(key)
  ) {
    throw new ERR_INVALID_ARG_TYPE(
      "key",
      getKeyTypes(!bufferOnly, bufferOnly),
      key
    );
  }
  return getArrayBufferOrView(key, "key", encoding);
}
export function createSecretKey(_key, _encoding) {
  notImplemented("crypto.createSecretKey");
}
export default {
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  isKeyObject,
  isCryptoKey,
  KeyObject,
  prepareSecretKey,
};
