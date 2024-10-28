// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function sortBy(array, selector) {
    const len = array.length;
    const indexes = new Array(len);
    const selectors = new Array(len);
    for (let i = 0; i < len; i++) {
        indexes[i] = i;
        const s = selector(array[i]);
        selectors[i] = Number.isNaN(s) ? null : s;
    }
    indexes.sort((ai, bi) => {
        const a = selectors[ai];
        const b = selectors[bi];
        if (a === null)
            return 1;
        if (b === null)
            return -1;
        return a > b ? 1 : a < b ? -1 : 0;
    });
    for (let i = 0; i < len; i++) {
        indexes[i] = array[indexes[i]];
    }
    return indexes;
}
