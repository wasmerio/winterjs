// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "../../_utils";
import { validateString } from "../validators.mjs";
import Writable from "../streams/writable.mjs";
export class Sign extends Writable {
  constructor(algorithm, _options) {
    validateString(algorithm, "algorithm");
    super();
    notImplemented("crypto.Sign");
  }
  sign(_privateKey, _outputEncoding) {
    notImplemented("crypto.Sign.prototype.sign");
  }
  update(_data, _inputEncoding) {
    notImplemented("crypto.Sign.prototype.update");
  }
}
export class Verify extends Writable {
  constructor(algorithm, _options) {
    validateString(algorithm, "algorithm");
    super();
    notImplemented("crypto.Verify");
  }
  update(_data, _inputEncoding) {
    notImplemented("crypto.Sign.prototype.update");
  }
  verify(_object, _signature, _signatureEncoding) {
    notImplemented("crypto.Sign.prototype.sign");
  }
}
export function signOneShot(_algorithm, _data, _key, _callback) {
  notImplemented("crypto.sign");
}
export function verifyOneShot(_algorithm, _data, _key, _signature, _callback) {
  notImplemented("crypto.verify");
}
export default {
  signOneShot,
  verifyOneShot,
  Sign,
  Verify,
};
