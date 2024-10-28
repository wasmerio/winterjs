// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { mapValues } from "./map_values";
/**
 * Applies the given reducer to each group in the given Grouping, returning the
 * results together with the respective group keys.
 *
 * @example
 * ```ts
 * import { reduceGroups } from "https://deno.land/std@$STD_VERSION/collections/reduce_groups";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const votes = {
 *   "Woody": [2, 3, 1, 4],
 *   "Buzz": [5, 9],
 * };
 *
 * const totalVotes = reduceGroups(votes, (sum, it) => sum + it, 0);
 *
 * assertEquals(totalVotes, {
 *   "Woody": 10,
 *   "Buzz": 14,
 * });
 * ```
 */
export function reduceGroups(record, reducer, initialValue) {
  return mapValues(record, (it) => it.reduce(reducer, initialValue));
}
