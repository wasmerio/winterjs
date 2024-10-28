// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "../../_utils";
import randomBytes from "./_randomBytes";
import randomFill, { randomFillSync } from "./_randomFill";
import randomInt from "./_randomInt";
export { default as randomBytes } from "./_randomBytes";
export { default as randomFill, randomFillSync } from "./_randomFill";
export { default as randomInt } from "./_randomInt";
export function checkPrime(_candidate, _options, _callback) {
  notImplemented("crypto.checkPrime");
}
export function checkPrimeSync(_candidate, _options) {
  notImplemented("crypto.checkPrimeSync");
}
export function generatePrime(_size, _options, _callback) {
  notImplemented("crypto.generatePrime");
}
export function generatePrimeSync(_size, _options) {
  notImplemented("crypto.generatePrimeSync");
}
export const randomUUID = () => globalThis.crypto.randomUUID();
export default {
  checkPrime,
  checkPrimeSync,
  generatePrime,
  generatePrimeSync,
  randomUUID,
  randomInt,
  randomBytes,
  randomFill,
  randomFillSync,
};
