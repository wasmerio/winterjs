// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { basename } from "../path";
import { EventEmitter } from "../events";
import { notImplemented } from "../_utils";
import { promisify } from "../util";
import { getValidatedPath } from "../internal/fs/utils.mjs";
import { validateFunction } from "../internal/validators.mjs";
import { stat } from "./_fs_stat";
import { Stats as StatsClass } from "../internal/fs/utils.mjs";
import { delay } from "../../async/delay";
const statPromisified = promisify(stat);
const statAsync = async (filename) => {
  try {
    return await statPromisified(filename);
  } catch {
    return emptyStats;
  }
};
const emptyStats = new StatsClass(
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  Date.UTC(1970, 0, 1, 0, 0, 0),
  Date.UTC(1970, 0, 1, 0, 0, 0),
  Date.UTC(1970, 0, 1, 0, 0, 0),
  Date.UTC(1970, 0, 1, 0, 0, 0)
);
export function asyncIterableIteratorToCallback(iterator, callback) {
  function next() {
    iterator.next().then((obj) => {
      if (obj.done) {
        callback(obj.value, true);
        return;
      }
      callback(obj.value);
      next();
    });
  }
  next();
}
export function asyncIterableToCallback(iter, callback, errCallback) {
  const iterator = iter[Symbol.asyncIterator]();
  function next() {
    iterator.next().then((obj) => {
      if (obj.done) {
        callback(obj.value, true);
        return;
      }
      callback(obj.value);
      next();
    }, errCallback);
  }
  next();
}
export function watch(filename, optionsOrListener, optionsOrListener2) {
  const listener =
    typeof optionsOrListener === "function"
      ? optionsOrListener
      : typeof optionsOrListener2 === "function"
      ? optionsOrListener2
      : undefined;
  const options =
    typeof optionsOrListener === "object"
      ? optionsOrListener
      : typeof optionsOrListener2 === "object"
      ? optionsOrListener2
      : undefined;
  const watchPath = getValidatedPath(filename).toString();
  let iterator;
  // Start the actual watcher a few msec later to avoid race condition
  // error in test case in compat test case
  // (parallel/test-fs-watch.js, parallel/test-fs-watchfile.js)
  const timer = setTimeout(() => {
    iterator = Deno.watchFs(watchPath, {
      recursive: options?.recursive || false,
    });
    asyncIterableToCallback(
      iterator,
      (val, done) => {
        if (done) return;
        fsWatcher.emit(
          "change",
          convertDenoFsEventToNodeFsEvent(val.kind),
          basename(val.paths[0])
        );
      },
      (e) => {
        fsWatcher.emit("error", e);
      }
    );
  }, 5);
  const fsWatcher = new FSWatcher(() => {
    clearTimeout(timer);
    try {
      iterator?.close();
    } catch (e) {
      if (e instanceof Deno.errors.BadResource) {
        // already closed
        return;
      }
      throw e;
    }
  });
  if (listener) {
    fsWatcher.on("change", listener.bind({ _handle: fsWatcher }));
  }
  return fsWatcher;
}
export const watchPromise = promisify(watch);
export function watchFile(filename, listenerOrOptions, listener) {
  const watchPath = getValidatedPath(filename).toString();
  const handler =
    typeof listenerOrOptions === "function" ? listenerOrOptions : listener;
  validateFunction(handler, "listener");
  const {
    bigint = false,
    persistent = true,
    interval = 5007,
  } = typeof listenerOrOptions === "object" ? listenerOrOptions : {};
  let stat = statWatchers.get(watchPath);
  if (stat === undefined) {
    stat = new StatWatcher(bigint);
    stat[kFSStatWatcherStart](watchPath, persistent, interval);
    statWatchers.set(watchPath, stat);
  }
  stat.addListener("change", listener);
  return stat;
}
export function unwatchFile(filename, listener) {
  const watchPath = getValidatedPath(filename).toString();
  const stat = statWatchers.get(watchPath);
  if (!stat) {
    return;
  }
  if (typeof listener === "function") {
    const beforeListenerCount = stat.listenerCount("change");
    stat.removeListener("change", listener);
    if (stat.listenerCount("change") < beforeListenerCount) {
      stat[kFSStatWatcherAddOrCleanRef]("clean");
    }
  } else {
    stat.removeAllListeners("change");
    stat[kFSStatWatcherAddOrCleanRef]("cleanAll");
  }
  if (stat.listenerCount("change") === 0) {
    stat.stop();
    statWatchers.delete(watchPath);
  }
}
const statWatchers = new Map();
const kFSStatWatcherStart = Symbol("kFSStatWatcherStart");
const kFSStatWatcherAddOrCleanRef = Symbol("kFSStatWatcherAddOrCleanRef");
class StatWatcher extends EventEmitter {
  #bigint;
  #refCount = 0;
  #abortController = new AbortController();
  constructor(bigint) {
    super();
    this.#bigint = bigint;
  }
  [kFSStatWatcherStart](filename, persistent, interval) {
    if (persistent) {
      this.#refCount++;
    }
    (async () => {
      let prev = await statAsync(filename);
      if (prev === emptyStats) {
        this.emit("change", prev, prev);
      }
      try {
        while (true) {
          await delay(interval, { signal: this.#abortController.signal });
          const curr = await statAsync(filename);
          if (curr?.mtime !== prev?.mtime) {
            this.emit("change", curr, prev);
            prev = curr;
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        this.emit("error", e);
      }
    })();
  }
  [kFSStatWatcherAddOrCleanRef](addOrClean) {
    if (addOrClean === "add") {
      this.#refCount++;
    } else if (addOrClean === "clean") {
      this.#refCount--;
    } else {
      this.#refCount = 0;
    }
  }
  stop() {
    if (this.#abortController.signal.aborted) {
      return;
    }
    this.#abortController.abort();
    this.emit("stop");
  }
  ref() {
    notImplemented("FSWatcher.ref() is not implemented");
  }
  unref() {
    notImplemented("FSWatcher.unref() is not implemented");
  }
}
class FSWatcher extends EventEmitter {
  #closer;
  #closed = false;
  constructor(closer) {
    super();
    this.#closer = closer;
  }
  close() {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.emit("close");
    this.#closer();
  }
  ref() {
    notImplemented("FSWatcher.ref() is not implemented");
  }
  unref() {
    notImplemented("FSWatcher.unref() is not implemented");
  }
}
function convertDenoFsEventToNodeFsEvent(kind) {
  if (kind === "create" || kind === "remove") {
    return "rename";
  } else {
    return "change";
  }
}
