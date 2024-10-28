// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
import { resolve, toFileUrl } from "../path/mod";
import { notImplemented } from "./_utils";
import { EventEmitter } from "./events";
const environmentData = new Map();
let threads = 0;
const kHandle = Symbol("kHandle");
const PRIVATE_WORKER_THREAD_NAME = "$DENO_STD_NODE_WORKER_THREAD";
class _Worker extends EventEmitter {
  threadId;
  resourceLimits = {
    maxYoungGenerationSizeMb: -1,
    maxOldGenerationSizeMb: -1,
    codeRangeSizeMb: -1,
    stackSizeMb: 4,
  };
  [kHandle];
  postMessage;
  constructor(specifier, options) {
    notImplemented("Worker");
    super();
    if (options?.eval === true) {
      specifier = `data:text/javascript,${specifier}`;
    } else if (typeof specifier === "string") {
      // @ts-ignore This API is temporarily disabled
      specifier = toFileUrl(resolve(specifier));
    }
    const handle = (this[kHandle] = new Worker(specifier, {
      name: PRIVATE_WORKER_THREAD_NAME,
      type: "module",
    }));
    handle.addEventListener("error", (event) =>
      this.emit("error", event.error || event.message)
    );
    handle.addEventListener("messageerror", (event) =>
      this.emit("messageerror", event.data)
    );
    handle.addEventListener("message", (event) =>
      this.emit("message", event.data)
    );
    handle.postMessage(
      {
        environmentData,
        threadId: (this.threadId = ++threads),
        workerData: options?.workerData,
      },
      options?.transferList || []
    );
    this.postMessage = handle.postMessage.bind(handle);
    this.emit("online");
  }
  terminate() {
    this[kHandle].terminate();
    this.emit("exit", 0);
  }
  getHeapSnapshot = () => notImplemented("Worker.prototype.getHeapSnapshot");
  // fake performance
  performance = globalThis.performance;
}
export const isMainThread =
  // deno-lint-ignore no-explicit-any
  globalThis.name !== PRIVATE_WORKER_THREAD_NAME;
// fake resourceLimits
export const resourceLimits = isMainThread
  ? {}
  : {
      maxYoungGenerationSizeMb: 48,
      maxOldGenerationSizeMb: 2048,
      codeRangeSizeMb: 0,
      stackSizeMb: 4,
    };
const threadId = 0;
const workerData = null;
// deno-lint-ignore no-explicit-any
const parentPort = null;
/*
if (!isMainThread) {
  // deno-lint-ignore no-explicit-any
  delete (globalThis as any).name;
  // deno-lint-ignore no-explicit-any
  const listeners = new WeakMap<(...args: any[]) => void, (ev: any) => any>();

  parentPort = self as ParentPort;
  parentPort.off = parentPort.removeListener = function (
    this: ParentPort,
    name,
    listener,
  ) {
    this.removeEventListener(name, listeners.get(listener)!);
    listeners.delete(listener);
    return this;
  };
  parentPort.on = parentPort.addListener = function (
    this: ParentPort,
    name,
    listener,
  ) {
    // deno-lint-ignore no-explicit-any
    const _listener = (ev: any) => listener(ev.data);
    listeners.set(listener, _listener);
    this.addEventListener(name, _listener);
    return this;
  };
  parentPort.once = function (this: ParentPort, name, listener) {
    // deno-lint-ignore no-explicit-any
    const _listener = (ev: any) => listener(ev.data);
    listeners.set(listener, _listener);
    this.addEventListener(name, _listener);
    return this;
  };

  // mocks
  parentPort.setMaxListeners = () => {};
  parentPort.getMaxListeners = () => Infinity;
  parentPort.eventNames = () => [""];
  parentPort.listenerCount = () => 0;

  parentPort.emit = () => notImplemented("parentPort.emit");
  parentPort.removeAllListeners = () =>
    notImplemented("parentPort.removeAllListeners");

  // Receive startup message
  [{ threadId, workerData, environmentData }] = await once(
    parentPort,
    "message",
  );

  // alias
  parentPort.addEventListener("offline", () => {
    parentPort.emit("close");
  });
}
*/
export function getEnvironmentData(key) {
  notImplemented("getEnvironmentData");
  return environmentData.get(key);
}
export function setEnvironmentData(key, value) {
  notImplemented("setEnvironmentData");
  if (value === undefined) {
    environmentData.delete(key);
  } else {
    environmentData.set(key, value);
  }
}
// deno-lint-ignore no-explicit-any
const _MessagePort = globalThis.MessagePort;
const _MessageChannel =
  // deno-lint-ignore no-explicit-any
  globalThis.MessageChannel;
export const BroadcastChannel = globalThis.BroadcastChannel;
export const SHARE_ENV = Symbol.for("nodejs.worker_threads.SHARE_ENV");
export function markAsUntransferable() {
  notImplemented("markAsUntransferable");
}
export function moveMessagePortToContext() {
  notImplemented("moveMessagePortToContext");
}
export function receiveMessageOnPort() {
  notImplemented("receiveMessageOnPort");
}
export {
  _MessageChannel as MessageChannel,
  _MessagePort as MessagePort,
  _Worker as Worker,
  parentPort,
  threadId,
  workerData,
};
export default {
  markAsUntransferable,
  moveMessagePortToContext,
  receiveMessageOnPort,
  MessagePort: _MessagePort,
  MessageChannel: _MessageChannel,
  BroadcastChannel,
  Worker: _Worker,
  getEnvironmentData,
  setEnvironmentData,
  SHARE_ENV,
  threadId,
  workerData,
  resourceLimits,
  parentPort,
  isMainThread,
};
