// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function minBy(array, selector) {
    let min = undefined;
    let minValue = undefined;
    for (const current of array) {
        const currentValue = selector(current);
        if (minValue === undefined || currentValue < minValue) {
            min = current;
            minValue = currentValue;
        }
    }
    return min;
}
