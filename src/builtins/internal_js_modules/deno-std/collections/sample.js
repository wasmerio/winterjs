// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { randomInteger } from "./_utils";
/**
 * Returns a random element from the given array
 *
 * @example
 * ```ts
 * import { sample } from "https://deno.land/std@$STD_VERSION/collections/sample";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const numbers = [1, 2, 3, 4];
 * const random = sample(numbers);
 *
 * assert(numbers.includes(random as number));
 * ```
 */
export function sample(array) {
  const length = array.length;
  return length ? array[randomInteger(0, length - 1)] : undefined;
}
