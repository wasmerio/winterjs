// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
import { notImplemented } from "./_utils";
export class Script {
  code;
  constructor(code, _options = {}) {
    this.code = `${code}`;
  }
  runInThisContext(_options) {
    return eval.call(globalThis, this.code);
  }
  runInContext(_contextifiedObject, _options) {
    notImplemented("Script.prototype.runInContext");
  }
  runInNewContext(_contextObject, _options) {
    notImplemented("Script.prototype.runInNewContext");
  }
  createCachedData() {
    notImplemented("Script.prototyp.createCachedData");
  }
}
export function createContext(_contextObject, _options) {
  notImplemented("createContext");
}
export function createScript(code, options) {
  return new Script(code, options);
}
export function runInContext(_code, _contextifiedObject, _options) {
  notImplemented("runInContext");
}
export function runInNewContext(_code, _contextObject, _options) {
  notImplemented("runInNewContext");
}
export function runInThisContext(code, options) {
  return createScript(code, options).runInThisContext(options);
}
export function isContext(_maybeContext) {
  notImplemented("isContext");
}
export function compileFunction(_code, _params, _options) {
  notImplemented("compileFunction");
}
export function measureMemory(_options) {
  notImplemented("measureMemory");
}
export default {
  Script,
  createContext,
  createScript,
  runInContext,
  runInNewContext,
  runInThisContext,
  isContext,
  compileFunction,
  measureMemory,
};
