// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { promisify } from "./internal/util.mjs";
import { callbackify } from "./_util/_util_callbackify";
import { debuglog } from "./internal/util/debuglog";
import {
  format,
  formatWithOptions,
  inspect,
  stripVTControlCharacters,
} from "./internal/util/inspect.mjs";
import { codes } from "./internal/error_codes";
import types from "./util/types";
import { Buffer } from "./buffer";
import { isDeepStrictEqual } from "./internal/util/comparisons";
import process from "./process";
import { validateString } from "./internal/validators.mjs";
export {
  callbackify,
  debuglog,
  format,
  formatWithOptions,
  inspect,
  promisify,
  stripVTControlCharacters,
  types,
};
/** @deprecated - use `Array.isArray()` instead. */
export function isArray(value) {
  return Array.isArray(value);
}
/** @deprecated - use `typeof value === "boolean" || value instanceof Boolean` instead. */
export function isBoolean(value) {
  return typeof value === "boolean" || value instanceof Boolean;
}
/** @deprecated - use `value === null` instead. */
export function isNull(value) {
  return value === null;
}
/** @deprecated - use `value === null || value === undefined` instead. */
export function isNullOrUndefined(value) {
  return value === null || value === undefined;
}
/** @deprecated - use `typeof value === "number" || value instanceof Number` instead. */
export function isNumber(value) {
  return typeof value === "number" || value instanceof Number;
}
/** @deprecated - use `typeof value === "string" || value instanceof String` instead. */
export function isString(value) {
  return typeof value === "string" || value instanceof String;
}
/** @deprecated - use `typeof value === "symbol"` instead. */
export function isSymbol(value) {
  return typeof value === "symbol";
}
/** @deprecated - use `value === undefined` instead. */
export function isUndefined(value) {
  return value === undefined;
}
/** @deprecated - use `value !== null && typeof value === "object"` instead. */
export function isObject(value) {
  return value !== null && typeof value === "object";
}
/** @deprecated - use `e instanceof Error` instead. */
export function isError(e) {
  return e instanceof Error;
}
/** @deprecated - use `typeof value === "function"` instead. */
export function isFunction(value) {
  return typeof value === "function";
}
/** @deprecated Use util.types.RegExp() instead. */
export function isRegExp(value) {
  return types.isRegExp(value);
}
/** @deprecated Use util.types.isDate() instead. */
export function isDate(value) {
  return types.isDate(value);
}
/** @deprecated - use `value === null || (typeof value !== "object" && typeof value !== "function")` instead. */
export function isPrimitive(value) {
  return (
    value === null || (typeof value !== "object" && typeof value !== "function")
  );
}
/** @deprecated  Use Buffer.isBuffer() instead. */
export function isBuffer(value) {
  return Buffer.isBuffer(value);
}
/** @deprecated Use Object.assign() instead. */
export function _extend(target, source) {
  // Don't do anything if source isn't an object
  if (source === null || typeof source !== "object") return target;
  const keys = Object.keys(source);
  let i = keys.length;
  while (i--) {
    target[keys[i]] = source[keys[i]];
  }
  return target;
}
/**
 * https://nodejs.org/api/util.html#util_util_inherits_constructor_superconstructor
 * @param ctor Constructor function which needs to inherit the prototype.
 * @param superCtor Constructor function to inherit prototype from.
 */
export function inherits(ctor, superCtor) {
  if (ctor === undefined || ctor === null) {
    throw new codes.ERR_INVALID_ARG_TYPE("ctor", "Function", ctor);
  }
  if (superCtor === undefined || superCtor === null) {
    throw new codes.ERR_INVALID_ARG_TYPE("superCtor", "Function", superCtor);
  }
  if (superCtor.prototype === undefined) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "superCtor.prototype",
      "Object",
      superCtor.prototype
    );
  }
  Object.defineProperty(ctor, "super_", {
    value: superCtor,
    writable: true,
    configurable: true,
  });
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}
import { _TextDecoder, _TextEncoder, getSystemErrorName } from "./_utils";
export const TextDecoder = _TextDecoder;
export const TextEncoder = _TextEncoder;
function pad(n) {
  return n.toString().padStart(2, "0");
}
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
/**
 * @returns 26 Feb 16:19:34
 */
function timestamp() {
  const d = new Date();
  const t = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(
    ":"
  );
  return `${d.getDate()} ${months[d.getMonth()]} ${t}`;
}
/**
 * Log is just a thin wrapper to console.log that prepends a timestamp
 * @deprecated
 */
// deno-lint-ignore no-explicit-any
export function log(...args) {
  console.log("%s - %s", timestamp(), format(...args));
}
// Keep a list of deprecation codes that have been warned on so we only warn on
// each one once.
const codesWarned = new Set();
// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
// deno-lint-ignore no-explicit-any
export function deprecate(fn, msg, code) {
  if (process.noDeprecation === true) {
    return fn;
  }
  if (code !== undefined) {
    validateString(code, "code");
  }
  let warned = false;
  // deno-lint-ignore no-explicit-any
  function deprecated(...args) {
    if (!warned) {
      warned = true;
      if (code !== undefined) {
        if (!codesWarned.has(code)) {
          process.emitWarning(msg, "DeprecationWarning", code, deprecated);
          codesWarned.add(code);
        }
      } else {
        // deno-lint-ignore no-explicit-any
        process.emitWarning(msg, "DeprecationWarning", deprecated);
      }
    }
    if (new.target) {
      return Reflect.construct(fn, args, new.target);
    }
    return Reflect.apply(fn, this, args);
  }
  // The wrapper will keep the same prototype as fn to maintain prototype chain
  Object.setPrototypeOf(deprecated, fn);
  if (fn.prototype) {
    // Setting this (rather than using Object.setPrototype, as above) ensures
    // that calling the unwrapped constructor gives an instanceof the wrapped
    // constructor.
    deprecated.prototype = fn.prototype;
  }
  return deprecated;
}
export { getSystemErrorName, isDeepStrictEqual };
export default {
  format,
  formatWithOptions,
  inspect,
  isArray,
  isBoolean,
  isNull,
  isNullOrUndefined,
  isNumber,
  isString,
  isSymbol,
  isUndefined,
  isObject,
  isError,
  isFunction,
  isRegExp,
  isDate,
  isPrimitive,
  isBuffer,
  _extend,
  getSystemErrorName,
  deprecate,
  callbackify,
  promisify,
  inherits,
  types,
  stripVTControlCharacters,
  TextDecoder,
  TextEncoder,
  log,
  debuglog,
  isDeepStrictEqual,
};
