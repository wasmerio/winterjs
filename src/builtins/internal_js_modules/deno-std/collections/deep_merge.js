// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// deno-lint-ignore-file ban-types
import { filterInPlace } from "./_utils";
const { hasOwn } = Object;
export function deepMerge(record, other, options) {
  return deepMergeInternal(record, other, new Set(), options);
}
function deepMergeInternal(record, other, seen, options) {
  const result = {};
  const keys = new Set([...getKeys(record), ...getKeys(other)]);
  // Iterate through each key of other object and use correct merging strategy
  for (const key of keys) {
    // Skip to prevent Object.prototype.__proto__ accessor property calls on non-Deno platforms
    if (key === "__proto__") {
      continue;
    }
    const a = record[key];
    if (!hasOwn(other, key)) {
      result[key] = a;
      continue;
    }
    const b = other[key];
    if (
      isNonNullObject(a) &&
      isNonNullObject(b) &&
      !seen.has(a) &&
      !seen.has(b)
    ) {
      seen.add(a);
      seen.add(b);
      result[key] = mergeObjects(a, b, seen, options);
      continue;
    }
    // Override value
    result[key] = b;
  }
  return result;
}
function mergeObjects(
  left,
  right,
  seen,
  options = {
    arrays: "merge",
    sets: "merge",
    maps: "merge",
  }
) {
  // Recursively merge mergeable objects
  if (isMergeable(left) && isMergeable(right)) {
    return deepMergeInternal(left, right, seen, options);
  }
  if (isIterable(left) && isIterable(right)) {
    // Handle arrays
    if (Array.isArray(left) && Array.isArray(right)) {
      if (options.arrays === "merge") {
        return left.concat(right);
      }
      return right;
    }
    // Handle maps
    if (left instanceof Map && right instanceof Map) {
      if (options.maps === "merge") {
        return new Map([...left, ...right]);
      }
      return right;
    }
    // Handle sets
    if (left instanceof Set && right instanceof Set) {
      if (options.sets === "merge") {
        return new Set([...left, ...right]);
      }
      return right;
    }
  }
  return right;
}
/**
 * Test whether a value is mergeable or not
 * Builtins that look like objects, null and user defined classes
 * are not considered mergeable (it means that reference will be copied)
 */
function isMergeable(value) {
  return Object.getPrototypeOf(value) === Object.prototype;
}
function isIterable(value) {
  return typeof value[Symbol.iterator] === "function";
}
function isNonNullObject(value) {
  return value !== null && typeof value === "object";
}
function getKeys(record) {
  const ret = Object.getOwnPropertySymbols(record);
  filterInPlace(ret, (key) =>
    Object.prototype.propertyIsEnumerable.call(record, key)
  );
  ret.push(...Object.keys(record));
  return ret;
}
