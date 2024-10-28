// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "./_utils";
const {
  PerformanceObserver,
  PerformanceEntry,
  performance: shimPerformance,
} = globalThis;
const constants = {};
const performance = {
  clearMarks: (markName) => shimPerformance.clearMarks(markName),
  eventLoopUtilization: () =>
    notImplemented("eventLoopUtilization from performance"),
  mark: (markName) => shimPerformance.mark(markName),
  measure: (measureName, startMark, endMark) => {
    if (endMark) {
      return shimPerformance.measure(measureName, startMark, endMark);
    } else {
      return shimPerformance.measure(measureName, startMark);
    }
  },
  nodeTiming: {},
  now: () => shimPerformance.now(),
  timerify: () => notImplemented("timerify from performance"),
  // deno-lint-ignore no-explicit-any
  timeOrigin: shimPerformance.timeOrigin,
  // @ts-ignore waiting on update in `deno`, but currently this is
  // a circular dependency
  toJSON: () => shimPerformance.toJSON(),
  addEventListener: (...args) => shimPerformance.addEventListener(...args),
  removeEventListener: (...args) =>
    shimPerformance.removeEventListener(...args),
  dispatchEvent: (...args) => shimPerformance.dispatchEvent(...args),
};
const monitorEventLoopDelay = () =>
  notImplemented("monitorEventLoopDelay from performance");
export default {
  performance,
  PerformanceObserver,
  PerformanceEntry,
  monitorEventLoopDelay,
  constants,
};
export {
  constants,
  monitorEventLoopDelay,
  performance,
  PerformanceEntry,
  PerformanceObserver,
};
