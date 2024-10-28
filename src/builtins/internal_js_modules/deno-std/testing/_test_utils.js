// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export class Point {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    // deno-lint-ignore no-explicit-any
    action(...args) {
        return args[0];
    }
    toString() {
        return [this.x, this.y].join(", ");
    }
    explicitTypes(_x, _y) {
        return true;
    }
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }
}
export function stringifyPoint(point) {
    return point.toString();
}
