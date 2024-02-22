// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// This implementation is inspired by "workerd" AsyncLocalStorage implementation:
// https://github.com/cloudflare/workerd/blob/77fd0ed6ddba184414f0216508fc62b06e716cab/src/workerd/api/node/async-hooks.c++#L9
// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials
import * as core from "__winterjs_core_";
function assert(cond) {
    if (!cond)
        throw new Error("Assertion failed");
}
function validateFunction(fn, name) {
    if (typeof fn !== "function") {
        throw new Error(`Expected ${name} to be a function`);
    }
}
const asyncContextStack = [];
function pushAsyncFrame(frame) {
    asyncContextStack.push(frame);
}
function popAsyncFrame() {
    if (asyncContextStack.length > 0) {
        asyncContextStack.pop();
    }
}
let rootAsyncFrame = undefined;
let promiseHooksSet = false;
const asyncContext = Symbol("asyncContext");
function setPromiseHooks() {
    if (promiseHooksSet) {
        return;
    }
    promiseHooksSet = true;
    const init = (promise) => {
        const currentFrame = AsyncContextFrame.current();
        if (!currentFrame.isRoot()) {
            if (typeof promise[asyncContext] !== "undefined") {
                throw new Error("Promise already has async context");
            }
            AsyncContextFrame.attachContext(promise);
        }
    };
    const before = (promise) => {
        const maybeFrame = promise[asyncContext];
        if (maybeFrame) {
            pushAsyncFrame(maybeFrame);
        }
        else {
            pushAsyncFrame(AsyncContextFrame.getRootAsyncContext());
        }
    };
    const after = (promise) => {
        popAsyncFrame();
        if (core.getPromiseState(promise) !== 2) {
            // @ts-ignore promise async context
            promise[asyncContext] = undefined;
        }
    };
    const resolve = (promise) => {
        const currentFrame = AsyncContextFrame.current();
        if (!currentFrame.isRoot() && core.getPromiseState(promise) === 2 &&
            typeof promise[asyncContext] === "undefined") {
            AsyncContextFrame.attachContext(promise);
        }
    };
    core.setPromiseHooks(init, before, after, resolve);
}
class AsyncContextFrame {
    storage;
    constructor(maybeParent, maybeStorageEntry, isRoot = false) {
        this.storage = [];
        setPromiseHooks();
        const propagate = (parent) => {
            parent.storage = parent.storage.filter((entry) => !entry.key.isDead());
            parent.storage.forEach((entry) => this.storage.push(entry.clone()));
            if (maybeStorageEntry) {
                const existingEntry = this.storage.find((entry) => entry.key === maybeStorageEntry.key);
                if (existingEntry) {
                    existingEntry.value = maybeStorageEntry.value;
                }
                else {
                    this.storage.push(maybeStorageEntry);
                }
            }
        };
        if (!isRoot) {
            if (maybeParent) {
                propagate(maybeParent);
            }
            else {
                propagate(AsyncContextFrame.current());
            }
        }
    }
    static tryGetContext(promise) {
        // @ts-ignore promise async context
        return promise[asyncContext];
    }
    static attachContext(promise) {
        // @ts-ignore promise async context
        promise[asyncContext] = AsyncContextFrame.current();
    }
    static getRootAsyncContext() {
        if (typeof rootAsyncFrame !== "undefined") {
            return rootAsyncFrame;
        }
        rootAsyncFrame = new AsyncContextFrame(null, null, true);
        return rootAsyncFrame;
    }
    static current() {
        if (asyncContextStack.length === 0) {
            return AsyncContextFrame.getRootAsyncContext();
        }
        return asyncContextStack[asyncContextStack.length - 1];
    }
    static create(maybeParent, maybeStorageEntry) {
        return new AsyncContextFrame(maybeParent, maybeStorageEntry);
    }
    static wrap(fn, maybeFrame, 
    // deno-lint-ignore no-explicit-any
    thisArg) {
        // deno-lint-ignore no-explicit-any
        return (...args) => {
            const frame = maybeFrame || AsyncContextFrame.current();
            Scope.enter(frame);
            try {
                return fn.apply(thisArg, args);
            }
            finally {
                Scope.exit();
            }
        };
    }
    get(key) {
        assert(!key.isDead());
        this.storage = this.storage.filter((entry) => !entry.key.isDead());
        const entry = this.storage.find((entry) => entry.key === key);
        if (entry) {
            return entry.value;
        }
        return undefined;
    }
    isRoot() {
        return AsyncContextFrame.getRootAsyncContext() == this;
    }
}
export class AsyncResource {
    frame;
    type;
    constructor(type) {
        this.type = type;
        this.frame = AsyncContextFrame.current();
    }
    runInAsyncScope(fn, thisArg, ...args) {
        Scope.enter(this.frame);
        try {
            return fn.apply(thisArg, args);
        }
        finally {
            Scope.exit();
        }
    }
    bind(fn, thisArg = this) {
        validateFunction(fn, "fn");
        const frame = AsyncContextFrame.current();
        const bound = AsyncContextFrame.wrap(fn, frame, thisArg);
        Object.defineProperties(bound, {
            "length": {
                configurable: true,
                enumerable: false,
                value: fn.length,
                writable: false,
            },
            "asyncResource": {
                configurable: true,
                enumerable: true,
                value: this,
                writable: true,
            },
        });
        return bound;
    }
    static bind(fn, type, thisArg) {
        type = type || fn.name;
        return (new AsyncResource(type || "AsyncResource")).bind(fn, thisArg);
    }
}
class Scope {
    static enter(maybeFrame) {
        if (maybeFrame) {
            pushAsyncFrame(maybeFrame);
        }
        else {
            pushAsyncFrame(AsyncContextFrame.getRootAsyncContext());
        }
    }
    static exit() {
        popAsyncFrame();
    }
}
class StorageEntry {
    key;
    value;
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
    clone() {
        return new StorageEntry(this.key, this.value);
    }
}
class StorageKey {
    #dead = false;
    reset() {
        this.#dead = true;
    }
    isDead() {
        return this.#dead;
    }
}
const fnReg = new FinalizationRegistry((key) => {
    key.reset();
});
export class AsyncLocalStorage {
    #key;
    constructor() {
        this.#key = new StorageKey();
        fnReg.register(this, this.#key);
    }
    // deno-lint-ignore no-explicit-any
    run(store, callback, ...args) {
        const frame = AsyncContextFrame.create(null, new StorageEntry(this.#key, store));
        Scope.enter(frame);
        let res;
        try {
            res = callback(...args);
        }
        finally {
            Scope.exit();
        }
        return res;
    }
    // deno-lint-ignore no-explicit-any
    exit(callback, ...args) {
        return this.run(undefined, callback, args);
    }
    // deno-lint-ignore no-explicit-any
    getStore() {
        const currentFrame = AsyncContextFrame.current();
        return currentFrame.get(this.#key);
    }
}
export function executionAsyncId() {
    return 1;
}
class AsyncHook {
    enable() {
    }
    disable() {
    }
}
export function createHook() {
    return new AsyncHook();
}
const originalSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (handler, timeout, ...args) => {
    let currentFrame = AsyncContextFrame.current();
    return originalSetTimeout((...args) => {
        try {
            pushAsyncFrame(currentFrame);
            if (typeof handler === "string") {
                eval(handler);
            }
            else {
                handler(...args);
            }
        }
        finally {
            popAsyncFrame();
        }
    }, timeout, ...args);
};
const originalSetInterval = globalThis.setInterval;
globalThis.setInterval = (handler, timeout, ...args) => {
    let currentFrame = AsyncContextFrame.current();
    return originalSetInterval((...args) => {
        try {
            pushAsyncFrame(currentFrame);
            if (typeof handler === "string") {
                eval(handler);
            }
            else {
                handler(...args);
            }
        }
        finally {
            popAsyncFrame();
        }
    }, timeout, ...args);
};
const originalQueueMicrotask = globalThis.queueMicrotask;
globalThis.queueMicrotask = (callback) => {
    let currentFrame = AsyncContextFrame.current();
    originalQueueMicrotask(() => {
        try {
            pushAsyncFrame(currentFrame);
            callback();
        }
        finally {
            popAsyncFrame();
        }
    });
};
// Placing all exports down here because the exported classes won't export
// otherwise.
export default {
    // Embedder API
    AsyncResource,
    executionAsyncId,
    createHook,
    AsyncLocalStorage,
};
