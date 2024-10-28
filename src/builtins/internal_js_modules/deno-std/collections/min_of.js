// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function minOf(array, selector) {
    let minimumValue = undefined;
    for (const i of array) {
        const currentValue = selector(i);
        if (minimumValue === undefined || currentValue < minimumValue) {
            minimumValue = currentValue;
            continue;
        }
        if (Number.isNaN(currentValue)) {
            return currentValue;
        }
    }
    return minimumValue;
}
