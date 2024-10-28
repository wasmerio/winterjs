// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns the first element having the smallest value according to the provided
 * comparator or undefined if there are no elements
 *
 * @example
 * ```ts
 * import { minWith } from "https://deno.land/std@$STD_VERSION/collections/min_with";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const people = ["Kim", "Anna", "John"];
 * const smallestName = minWith(people, (a, b) => a.length - b.length);
 *
 * assertEquals(smallestName, "Kim");
 * ```
 */
export function minWith(array, comparator) {
  let min = undefined;
  let isFirst = true;
  for (const current of array) {
    if (isFirst || comparator(current, min) < 0) {
      min = current;
      isFirst = false;
    }
  }
  return min;
}
