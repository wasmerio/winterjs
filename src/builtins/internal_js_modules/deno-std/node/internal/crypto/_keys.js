// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { kKeyObject } from "./constants";
export const kKeyType = Symbol("kKeyType");
export function isKeyObject(obj) {
  return obj != null && obj[kKeyType] !== undefined;
}
export function isCryptoKey(obj) {
  return obj != null && obj[kKeyObject] !== undefined;
}
