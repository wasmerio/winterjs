// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */
/** Compares its two arguments for ascending order using JavaScript's built in comparison operators. */
export function ascend(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/** Compares its two arguments for descending order using JavaScript's built in comparison operators. */
export function descend(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
}
