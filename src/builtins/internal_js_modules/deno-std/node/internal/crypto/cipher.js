// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { ERR_INVALID_ARG_TYPE } from "../errors";
import { validateInt32, validateObject } from "../validators.mjs";
import { notImplemented } from "../../_utils";
import { Transform } from "../../_stream.mjs";
import {
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
} from "../../_crypto/crypto_browserify/public_encrypt/mod.js";
export {
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
} from "../../_crypto/crypto_browserify/public_encrypt/mod.js";
export class Cipheriv extends Transform {
  constructor(_cipher, _key, _iv, _options) {
    super();
    notImplemented("crypto.Cipheriv");
  }
  final(_outputEncoding) {
    notImplemented("crypto.Cipheriv.prototype.final");
  }
  getAuthTag() {
    notImplemented("crypto.Cipheriv.prototype.getAuthTag");
  }
  setAAD(_buffer, _options) {
    notImplemented("crypto.Cipheriv.prototype.setAAD");
  }
  setAutoPadding(_autoPadding) {
    notImplemented("crypto.Cipheriv.prototype.setAutoPadding");
  }
  update(_data, _inputEncoding, _outputEncoding) {
    notImplemented("crypto.Cipheriv.prototype.update");
  }
}
export class Decipheriv extends Transform {
  constructor(_cipher, _key, _iv, _options) {
    super();
    notImplemented("crypto.Decipheriv");
  }
  final(_outputEncoding) {
    notImplemented("crypto.Decipheriv.prototype.final");
  }
  setAAD(_buffer, _options) {
    notImplemented("crypto.Decipheriv.prototype.setAAD");
  }
  setAuthTag(_buffer, _encoding) {
    notImplemented("crypto.Decipheriv.prototype.setAuthTag");
  }
  setAutoPadding(_autoPadding) {
    notImplemented("crypto.Decipheriv.prototype.setAutoPadding");
  }
  update(_data, _inputEncoding, _outputEncoding) {
    notImplemented("crypto.Decipheriv.prototype.update");
  }
}
export function getCipherInfo(nameOrNid, options) {
  if (typeof nameOrNid !== "string" && typeof nameOrNid !== "number") {
    throw new ERR_INVALID_ARG_TYPE(
      "nameOrNid",
      ["string", "number"],
      nameOrNid
    );
  }
  if (typeof nameOrNid === "number") {
    validateInt32(nameOrNid, "nameOrNid");
  }
  let keyLength, ivLength;
  if (options !== undefined) {
    validateObject(options, "options");
    ({ keyLength, ivLength } = options);
    if (keyLength !== undefined) {
      validateInt32(keyLength, "options.keyLength");
    }
    if (ivLength !== undefined) {
      validateInt32(ivLength, "options.ivLength");
    }
  }
  notImplemented("crypto.getCipherInfo");
}
export default {
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
  Cipheriv,
  Decipheriv,
  getCipherInfo,
};
