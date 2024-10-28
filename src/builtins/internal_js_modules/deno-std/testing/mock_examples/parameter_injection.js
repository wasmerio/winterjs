// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export function multiply(a, b) {
    return a * b;
}
export function square(multiplyFn, value) {
    return multiplyFn(value, value);
}
