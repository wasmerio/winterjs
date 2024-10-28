// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-var
import processModule from "./process";
import { Buffer as bufferModule } from "./buffer";
import { clearInterval, clearTimeout, setInterval, setTimeout } from "./timers";
import timers from "./timers";
Object.defineProperty(globalThis, "global", {
  value: new Proxy(globalThis, {
    get(target, prop, receiver) {
      switch (prop) {
        case "setInterval":
          return setInterval;
        case "setTimeout":
          return setTimeout;
        case "clearInterval":
          return clearInterval;
        case "clearTimeout":
          return clearTimeout;
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
  }),
  writable: false,
  enumerable: false,
  configurable: true,
});
Object.defineProperty(globalThis, "process", {
  value: processModule,
  enumerable: false,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "Buffer", {
  value: bufferModule,
  enumerable: false,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "setImmediate", {
  value: timers.setImmediate,
  enumerable: true,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "clearImmediate", {
  value: timers.clearImmediate,
  enumerable: true,
  writable: true,
  configurable: true,
});
