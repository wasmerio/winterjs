// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export function randomInt(lowerBound, upperBound) {
    return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound));
}
export function randomMultiple(value) {
    return value * _internals.randomInt(-10, 10);
}
export const _internals = { randomInt };
