// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "../../_utils";
export function generateKey(_type, _options, _callback) {
  notImplemented("crypto.generateKey");
}
export function generateKeyPair(_type, _options, _callback) {
  notImplemented("crypto.generateKeyPair");
}
export function generateKeyPairSync(_type, _options) {
  notImplemented("crypto.generateKeyPairSync");
}
export function generateKeySync(_type, _options) {
  notImplemented("crypto.generateKeySync");
}
export default {
  generateKey,
  generateKeySync,
  generateKeyPair,
  generateKeyPairSync,
};
