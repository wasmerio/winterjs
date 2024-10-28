// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Builds a new Record using the given array as keys and choosing a value for
 * each key using the given selector. If any of two pairs would have the same
 * value the latest on will be used (overriding the ones before it).
 *
 * @example
 * ```ts
 * import { associateWith } from "https://deno.land/std@$STD_VERSION/collections/associate_with";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const names = ["Kim", "Lara", "Jonathan"];
 * const namesToLength = associateWith(names, (it) => it.length);
 *
 * assertEquals(namesToLength, {
 *   "Kim": 3,
 *   "Lara": 4,
 *   "Jonathan": 8,
 * });
 * ```
 */
export function associateWith(array, selector) {
  const ret = {};
  for (const element of array) {
    const selectedValue = selector(element);
    ret[element] = selectedValue;
  }
  return ret;
}
