// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function partition(array, predicate) {
    const matches = [];
    const rest = [];
    for (const element of array) {
        if (predicate(element)) {
            matches.push(element);
        }
        else {
            rest.push(element);
        }
    }
    return [matches, rest];
}
