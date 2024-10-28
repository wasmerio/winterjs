// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns an element if and only if that element is the only one matching the
 * given condition. Returns `undefined` otherwise.
 *
 * @example
 * ```ts
 * import { findSingle } from "https://deno.land/std@$STD_VERSION/collections/find_single";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const bookings = [
 *   { month: "January", active: false },
 *   { month: "March", active: false },
 *   { month: "June", active: true },
 * ];
 * const activeBooking = findSingle(bookings, (it) => it.active);
 * const inactiveBooking = findSingle(bookings, (it) => !it.active);
 *
 * assertEquals(activeBooking, { month: "June", active: true });
 * assertEquals(inactiveBooking, undefined); // there are two applicable items
 * ```
 */
export function findSingle(array, predicate) {
  let match = undefined;
  let found = false;
  for (const element of array) {
    if (predicate(element)) {
      if (found) {
        return undefined;
      }
      found = true;
      match = element;
    }
  }
  return match;
}
