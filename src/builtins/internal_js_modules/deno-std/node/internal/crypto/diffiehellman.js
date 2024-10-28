// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "../../_utils";
import { isAnyArrayBuffer, isArrayBufferView } from "../util/types";
import { ERR_INVALID_ARG_TYPE } from "../errors";
import { validateInt32, validateString } from "../validators.mjs";
import { Buffer } from "../../buffer";
import { getDefaultEncoding, toBuf } from "./util";
const DH_GENERATOR = 2;
export class DiffieHellman {
  verifyError;
  constructor(sizeOrKey, keyEncoding, generator, genEncoding) {
    if (
      typeof sizeOrKey !== "number" &&
      typeof sizeOrKey !== "string" &&
      !isArrayBufferView(sizeOrKey) &&
      !isAnyArrayBuffer(sizeOrKey)
    ) {
      throw new ERR_INVALID_ARG_TYPE(
        "sizeOrKey",
        ["number", "string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
        sizeOrKey
      );
    }
    if (typeof sizeOrKey === "number") {
      validateInt32(sizeOrKey, "sizeOrKey");
    }
    if (
      keyEncoding &&
      !Buffer.isEncoding(keyEncoding) &&
      keyEncoding !== "buffer"
    ) {
      genEncoding = generator;
      generator = keyEncoding;
      keyEncoding = false;
    }
    const encoding = getDefaultEncoding();
    keyEncoding = keyEncoding || encoding;
    genEncoding = genEncoding || encoding;
    if (typeof sizeOrKey !== "number") {
      sizeOrKey = toBuf(sizeOrKey, keyEncoding);
    }
    if (!generator) {
      generator = DH_GENERATOR;
    } else if (typeof generator === "number") {
      validateInt32(generator, "generator");
    } else if (typeof generator === "string") {
      generator = toBuf(generator, genEncoding);
    } else if (!isArrayBufferView(generator) && !isAnyArrayBuffer(generator)) {
      throw new ERR_INVALID_ARG_TYPE(
        "generator",
        ["number", "string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
        generator
      );
    }
    notImplemented("crypto.DiffieHellman");
  }
  computeSecret(_otherPublicKey, _inputEncoding, _outputEncoding) {
    notImplemented("crypto.DiffieHellman.prototype.computeSecret");
  }
  generateKeys(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.generateKeys");
  }
  getGenerator(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getGenerator");
  }
  getPrime(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getPrime");
  }
  getPrivateKey(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getPrivateKey");
  }
  getPublicKey(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getPublicKey");
  }
  setPrivateKey(_privateKey, _encoding) {
    notImplemented("crypto.DiffieHellman.prototype.setPrivateKey");
  }
  setPublicKey(_publicKey, _encoding) {
    notImplemented("crypto.DiffieHellman.prototype.setPublicKey");
  }
}
export class DiffieHellmanGroup {
  verifyError;
  constructor(_name) {
    notImplemented("crypto.DiffieHellmanGroup");
  }
  computeSecret(_otherPublicKey, _inputEncoding, _outputEncoding) {
    notImplemented("crypto.DiffieHellman.prototype.computeSecret");
  }
  generateKeys(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.generateKeys");
  }
  getGenerator(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getGenerator");
  }
  getPrime(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getPrime");
  }
  getPrivateKey(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getPrivateKey");
  }
  getPublicKey(_encoding) {
    notImplemented("crypto.DiffieHellman.prototype.getPublicKey");
  }
}
export class ECDH {
  constructor(curve) {
    validateString(curve, "curve");
    notImplemented("crypto.ECDH");
  }
  static convertKey(_key, _curve, _inputEncoding, _outputEncoding, _format) {
    notImplemented("crypto.ECDH.prototype.convertKey");
  }
  computeSecret(_otherPublicKey, _inputEncoding, _outputEncoding) {
    notImplemented("crypto.ECDH.prototype.computeSecret");
  }
  generateKeys(_encoding, _format) {
    notImplemented("crypto.ECDH.prototype.generateKeys");
  }
  getPrivateKey(_encoding) {
    notImplemented("crypto.ECDH.prototype.getPrivateKey");
  }
  getPublicKey(_encoding, _format) {
    notImplemented("crypto.ECDH.prototype.getPublicKey");
  }
  setPrivateKey(_privateKey, _encoding) {
    notImplemented("crypto.ECDH.prototype.setPrivateKey");
  }
}
export function diffieHellman(_options) {
  notImplemented("crypto.diffieHellman");
}
export default {
  DiffieHellman,
  DiffieHellmanGroup,
  ECDH,
  diffieHellman,
};
