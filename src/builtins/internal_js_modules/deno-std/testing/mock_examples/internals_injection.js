// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export function multiply(a, b) {
    return a * b;
}
export function square(value) {
    return _internals.multiply(value, value);
}
export const _internals = { multiply };
