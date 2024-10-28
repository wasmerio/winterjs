// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Utilities for mocking time while testing.
 *
 * @module
 */
import { ascend, RedBlackTree } from "../collections/red_black_tree";
import { _internals } from "./_time";
/** An error related to faking time. */
export class TimeError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeError";
  }
}
function isFakeDate(instance) {
  return instance instanceof FakeDate;
}
function FakeDate(
  // deno-lint-ignore no-explicit-any
  ...args
) {
  if (args.length === 0) args.push(FakeDate.now());
  if (isFakeDate(this)) {
    this.date = new _internals.Date(...args);
  } else {
    return new _internals.Date(args[0]).toString();
  }
}
FakeDate.parse = Date.parse;
FakeDate.UTC = Date.UTC;
FakeDate.now = () => time?.now ?? _internals.Date.now();
Object.getOwnPropertyNames(Date.prototype).forEach((name) => {
  const propName = name;
  FakeDate.prototype[propName] = function (
    // deno-lint-ignore no-explicit-any
    ...args
  ) // deno-lint-ignore no-explicit-any
  {
    // deno-lint-ignore no-explicit-any
    return this.date[propName].apply(this.date, args);
  };
});
Object.getOwnPropertySymbols(Date.prototype).forEach((name) => {
  const propName = name;
  FakeDate.prototype[propName] = function (
    // deno-lint-ignore no-explicit-any
    ...args
  ) // deno-lint-ignore no-explicit-any
  {
    // deno-lint-ignore no-explicit-any
    return this.date[propName].apply(this.date, args);
  };
});
let time = undefined;
function fakeSetTimeout(
  // deno-lint-ignore no-explicit-any
  callback,
  delay = 0,
  // deno-lint-ignore no-explicit-any
  ...args
) {
  if (!time) throw new TimeError("no fake time");
  return setTimer(callback, delay, args, false);
}
function fakeClearTimeout(id) {
  if (!time) throw new TimeError("no fake time");
  if (typeof id === "number" && dueNodes.has(id)) {
    dueNodes.delete(id);
  }
}
function fakeSetInterval(
  // deno-lint-ignore no-explicit-any
  callback,
  delay = 0,
  // deno-lint-ignore no-explicit-any
  ...args
) {
  if (!time) throw new TimeError("no fake time");
  return setTimer(callback, delay, args, true);
}
function fakeClearInterval(id) {
  if (!time) throw new TimeError("no fake time");
  if (typeof id === "number" && dueNodes.has(id)) {
    dueNodes.delete(id);
  }
}
function setTimer(
  // deno-lint-ignore no-explicit-any
  callback,
  delay = 0,
  args,
  repeat = false
) {
  const id = timerId.next().value;
  delay = Math.max(repeat ? 1 : 0, Math.floor(delay));
  const due = now + delay;
  let dueNode = dueTree.find({ due });
  if (dueNode === null) {
    dueNode = { due, timers: [] };
    dueTree.insert(dueNode);
  }
  dueNode.timers.push({
    id,
    callback,
    args,
    delay,
    due,
    repeat,
  });
  dueNodes.set(id, dueNode);
  return id;
}
function overrideGlobals() {
  globalThis.Date = FakeDate;
  globalThis.setTimeout = fakeSetTimeout;
  globalThis.clearTimeout = fakeClearTimeout;
  globalThis.setInterval = fakeSetInterval;
  globalThis.clearInterval = fakeClearInterval;
}
function restoreGlobals() {
  globalThis.Date = _internals.Date;
  globalThis.setTimeout = _internals.setTimeout;
  globalThis.clearTimeout = _internals.clearTimeout;
  globalThis.setInterval = _internals.setInterval;
  globalThis.clearInterval = _internals.clearInterval;
}
function* timerIdGen() {
  let i = 1;
  while (true) yield i++;
}
let startedAt;
let now;
let initializedAt;
let advanceRate;
let advanceFrequency;
let advanceIntervalId;
let timerId;
let dueNodes;
let dueTree;
/**
 * Overrides the real Date object and timer functions with fake ones that can be
 * controlled through the fake time instance.
 *
 * ```ts
 * // https://deno.land/std@$STD_VERSION/testing/mock_examples/interval_test.ts
 * import {
 *   assertSpyCalls,
 *   spy,
 * } from "https://deno.land/std@$STD_VERSION/testing/mock";
 * import { FakeTime } from "https://deno.land/std@$STD_VERSION/testing/time";
 * import { secondInterval } from "https://deno.land/std@$STD_VERSION/testing/mock_examples/interval";
 *
 * Deno.test("secondInterval calls callback every second and stops after being cleared", () => {
 *   const time = new FakeTime();
 *
 *   try {
 *     const cb = spy();
 *     const intervalId = secondInterval(cb);
 *     assertSpyCalls(cb, 0);
 *     time.tick(500);
 *     assertSpyCalls(cb, 0);
 *     time.tick(500);
 *     assertSpyCalls(cb, 1);
 *     time.tick(3500);
 *     assertSpyCalls(cb, 4);
 *
 *     clearInterval(intervalId);
 *     time.tick(1000);
 *     assertSpyCalls(cb, 4);
 *   } finally {
 *     time.restore();
 *   }
 * });
 * ```
 */
export class FakeTime {
  constructor(start, options) {
    if (time) time.restore();
    initializedAt = _internals.Date.now();
    startedAt =
      start instanceof Date
        ? start.valueOf()
        : typeof start === "number"
        ? Math.floor(start)
        : typeof start === "string"
        ? new Date(start).valueOf()
        : initializedAt;
    if (Number.isNaN(startedAt)) throw new TimeError("invalid start");
    now = startedAt;
    timerId = timerIdGen();
    dueNodes = new Map();
    dueTree = new RedBlackTree((a, b) => ascend(a.due, b.due));
    overrideGlobals();
    time = this;
    advanceRate = Math.max(0, options?.advanceRate ? options.advanceRate : 0);
    advanceFrequency = Math.max(
      0,
      options?.advanceFrequency ? options.advanceFrequency : 10
    );
    advanceIntervalId =
      advanceRate > 0
        ? _internals.setInterval.call(
            null,
            () => {
              this.tick(advanceRate * advanceFrequency);
            },
            advanceFrequency
          )
        : undefined;
  }
  /** Restores real time. */
  static restore() {
    if (!time) throw new TimeError("time already restored");
    time.restore();
  }
  /**
   * Restores real time temporarily until callback returns and resolves.
   */
  static async restoreFor(
    // deno-lint-ignore no-explicit-any
    callback,
    // deno-lint-ignore no-explicit-any
    ...args
  ) {
    if (!time) throw new TimeError("no fake time");
    let result;
    restoreGlobals();
    try {
      result = await callback.apply(null, args);
    } finally {
      overrideGlobals();
    }
    return result;
  }
  /**
   * The amount of milliseconds elapsed since January 1, 1970 00:00:00 UTC for the fake time.
   * When set, it will call any functions waiting to be called between the current and new fake time.
   * If the timer callback throws, time will stop advancing forward beyond that timer.
   */
  get now() {
    return now;
  }
  set now(value) {
    if (value < now) throw new Error("time cannot go backwards");
    let dueNode = dueTree.min();
    while (dueNode && dueNode.due <= value) {
      const timer = dueNode.timers.shift();
      if (timer && dueNodes.has(timer.id)) {
        now = timer.due;
        if (timer.repeat) {
          const due = timer.due + timer.delay;
          let dueNode = dueTree.find({ due });
          if (dueNode === null) {
            dueNode = { due, timers: [] };
            dueTree.insert(dueNode);
          }
          dueNode.timers.push({ ...timer, due });
          dueNodes.set(timer.id, dueNode);
        } else {
          dueNodes.delete(timer.id);
        }
        timer.callback.apply(null, timer.args);
      } else if (!timer) {
        dueTree.remove(dueNode);
        dueNode = dueTree.min();
      }
    }
    now = value;
  }
  /** The initial amount of milliseconds elapsed since January 1, 1970 00:00:00 UTC for the fake time. */
  get start() {
    return startedAt;
  }
  set start(value) {
    throw new Error("cannot change start time after initialization");
  }
  /** Resolves after the given number of milliseconds using real time. */
  async delay(ms, options = {}) {
    const { signal } = options;
    if (signal?.aborted) {
      return Promise.reject(
        new DOMException("Delay was aborted.", "AbortError")
      );
    }
    return await new Promise((resolve, reject) => {
      let timer = null;
      const abort = () =>
        FakeTime.restoreFor(() => {
          if (timer) clearTimeout(timer);
        }).then(() =>
          reject(new DOMException("Delay was aborted.", "AbortError"))
        );
      const done = () => {
        signal?.removeEventListener("abort", abort);
        resolve();
      };
      FakeTime.restoreFor(() => setTimeout(done, ms)).then(
        (id) => (timer = id)
      );
      signal?.addEventListener("abort", abort, { once: true });
    });
  }
  /** Runs all pending microtasks. */
  async runMicrotasks() {
    await this.delay(0);
  }
  /**
   * Adds the specified number of milliseconds to the fake time.
   * This will call any functions waiting to be called between the current and new fake time.
   */
  tick(ms = 0) {
    this.now += ms;
  }
  /**
   * Runs all pending microtasks then adds the specified number of milliseconds to the fake time.
   * This will call any functions waiting to be called between the current and new fake time.
   */
  async tickAsync(ms = 0) {
    await this.runMicrotasks();
    this.now += ms;
  }
  /**
   * Advances time to when the next scheduled timer is due.
   * If there are no pending timers, time will not be changed.
   * Returns true when there is a scheduled timer and false when there is not.
   */
  next() {
    const next = dueTree.min();
    if (next) this.now = next.due;
    return !!next;
  }
  /**
   * Runs all pending microtasks then advances time to when the next scheduled timer is due.
   * If there are no pending timers, time will not be changed.
   */
  async nextAsync() {
    await this.runMicrotasks();
    return this.next();
  }
  /**
   * Advances time forward to the next due timer until there are no pending timers remaining.
   * If the timers create additional timers, they will be run too. If there is an interval,
   * time will keep advancing forward until the interval is cleared.
   */
  runAll() {
    while (!dueTree.isEmpty()) {
      this.next();
    }
  }
  /**
   * Advances time forward to the next due timer until there are no pending timers remaining.
   * If the timers create additional timers, they will be run too. If there is an interval,
   * time will keep advancing forward until the interval is cleared.
   * Runs all pending microtasks before each timer.
   */
  async runAllAsync() {
    while (!dueTree.isEmpty()) {
      await this.nextAsync();
    }
  }
  /** Restores time related global functions to their original state. */
  restore() {
    if (!time) throw new TimeError("time already restored");
    time = undefined;
    restoreGlobals();
    if (advanceIntervalId) clearInterval(advanceIntervalId);
  }
}
