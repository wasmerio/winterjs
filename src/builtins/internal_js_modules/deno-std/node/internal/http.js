// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
import { setUnrefTimeout } from "../timers";
import { notImplemented } from "../_utils";
let utcCache;
export function utcDate() {
  if (!utcCache) cache();
  return utcCache;
}
function cache() {
  const d = new Date();
  utcCache = d.toUTCString();
  setUnrefTimeout(resetCache, 1000 - d.getMilliseconds());
}
function resetCache() {
  utcCache = undefined;
}
export function emitStatistics(_statistics) {
  notImplemented("internal/http.emitStatistics");
}
export const kOutHeaders = Symbol("kOutHeaders");
export const kNeedDrain = Symbol("kNeedDrain");
export default {
  utcDate,
  emitStatistics,
  kOutHeaders,
  kNeedDrain,
};
