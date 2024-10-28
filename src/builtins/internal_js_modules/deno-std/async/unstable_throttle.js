// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Creates a throttled function that prevents the given `func`
 * from being called more than once within a given `timeframe` in milliseconds.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { throttle } from "./unstable_throttle.ts"
 * import { retry } from "@std/async/retry"
 * import { assert } from "@std/assert"
 *
 * let called = 0;
 * await using server = Deno.serve({ port: 0, onListen:() => null }, () => new Response(`${called++}`));
 *
 * // A throttled function will be executed at most once during a specified ms timeframe
 * const timeframe = 100
 * const func = throttle<[string]>((url) => fetch(url).then(r => r.body?.cancel()), timeframe);
 * for (let i = 0; i < 10; i++) {
 *   func(`http://localhost:${server.addr.port}/api`);
 * }
 *
 * await retry(() => assert(!func.throttling))
 * assert(called === 1)
 * assert(!Number.isNaN(func.lastExecution))
 * ```
 *
 * @typeParam T The arguments of the provided function.
 * @param fn The function to throttle.
 * @param timeframe The timeframe in milliseconds in which the function should be called at most once.
 * @returns The throttled function.
 */
// deno-lint-ignore no-explicit-any
export function throttle(fn, timeframe) {
    let lastExecution = NaN;
    let flush = null;
    const throttled = ((...args) => {
        flush = () => {
            try {
                fn.call(throttled, ...args);
            }
            finally {
                lastExecution = Date.now();
                flush = null;
            }
        };
        if (throttled.throttling) {
            return;
        }
        flush?.();
    });
    throttled.clear = () => {
        lastExecution = NaN;
    };
    throttled.flush = () => {
        lastExecution = NaN;
        flush?.();
        throttled.clear();
    };
    Object.defineProperties(throttled, {
        throttling: { get: () => Date.now() - lastExecution <= timeframe },
        lastExecution: { get: () => lastExecution },
    });
    return throttled;
}
