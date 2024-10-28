// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function maxOf(array, selector) {
    let maximumValue = undefined;
    for (const i of array) {
        const currentValue = selector(i);
        if (maximumValue === undefined || currentValue > maximumValue) {
            maximumValue = currentValue;
            continue;
        }
        if (Number.isNaN(currentValue)) {
            return currentValue;
        }
    }
    return maximumValue;
}
