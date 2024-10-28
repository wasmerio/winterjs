// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Composes a new record with all keys and values inverted.
 *
 * If the record contains duplicate values, subsequent values overwrite property
 * assignments of previous values. If the record contains values which aren't
 * {@linkcode PropertyKey}s their string representation is used as the key.
 *
 * @typeParam T The type of the input record.
 *
 * @param record The record to invert.
 *
 * @returns A new record with all keys and values inverted.
 *
 * @example Basic usage
 * ```ts
 * import { invert } from "@std/collections/invert";
 * import { assertEquals } from "@std/assert";
 *
 * const record = { a: "x", b: "y", c: "z" };
 *
 * assertEquals(invert(record), { x: "a", y: "b", z: "c" });
 * ```
 */
export function invert(record) {
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [value, key]));
}
