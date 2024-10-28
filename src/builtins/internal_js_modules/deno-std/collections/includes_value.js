// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * If the given value is part of the given object it returns true, otherwise it
 * returns false. Doesn't work with non-primitive values: includesValue({x: {}},
 * {}) returns false.
 *
 * @example
 * ```ts
 * import { includesValue } from "https://deno.land/std@$STD_VERSION/collections/includes_value";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const input = {
 *   first: 33,
 *   second: 34,
 * };
 *
 * assertEquals(includesValue(input, 34), true);
 * ```
 */
export function includesValue(record, value) {
  for (const i in record) {
    if (
      Object.hasOwn(record, i) &&
      (record[i] === value || (Number.isNaN(value) && Number.isNaN(record[i])))
    ) {
      return true;
    }
  }
  return false;
}
