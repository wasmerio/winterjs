// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given selector to each element in the given array, returning a
 * Record containing the results as keys and all values that produced that key
 * as values.
 *
 * @example
 * ```ts
 * import { groupBy } from "https://deno.land/std@$STD_VERSION/collections/group_by";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Arnold" },
 *   { name: "Kim" },
 * ];
 * const peopleByFirstLetter = groupBy(people, (it) => it.name.charAt(0));
 *
 * assertEquals(
 *   peopleByFirstLetter,
 *   {
 *     "A": [{ name: "Anna" }, { name: "Arnold" }],
 *     "K": [{ name: "Kim" }],
 *   },
 * );
 * ```
 */
export function groupBy(array, selector) {
  const ret = {};
  for (const element of array) {
    const key = selector(element);
    const arr = (ret[key] ??= []);
    arr.push(element);
  }
  return ret;
}
