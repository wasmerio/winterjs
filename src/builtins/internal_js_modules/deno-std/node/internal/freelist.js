// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
export class FreeList {
    name;
    ctor;
    max;
    list;
    constructor(name, max, ctor) {
        this.name = name;
        this.ctor = ctor;
        this.max = max;
        this.list = [];
    }
    alloc() {
        return this.list.length > 0
            ? this.list.pop()
            : Reflect.apply(this.ctor, this, arguments);
    }
    free(obj) {
        if (this.list.length < this.max) {
            this.list.push(obj);
            return true;
        }
        return false;
    }
}
