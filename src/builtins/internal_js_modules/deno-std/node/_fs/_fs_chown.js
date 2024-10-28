// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { makeCallback } from "./_fs_common";
import { getValidatedPath, kMaxUserId } from "../internal/fs/utils.mjs";
import * as pathModule from "../../path/mod";
import { validateInteger } from "../internal/validators.mjs";
import { promisify } from "../internal/util.mjs";
/**
 * Asynchronously changes the owner and group
 * of a file.
 */
export function chown(path, uid, gid, callback) {
  callback = makeCallback(callback);
  path = getValidatedPath(path).toString();
  validateInteger(uid, "uid", -1, kMaxUserId);
  validateInteger(gid, "gid", -1, kMaxUserId);
  Deno.chown(pathModule.toNamespacedPath(path), uid, gid).then(
    () => callback(null),
    callback
  );
}
export const chownPromise = promisify(chown);
/**
 * Synchronously changes the owner and group
 * of a file.
 */
export function chownSync(path, uid, gid) {
  path = getValidatedPath(path).toString();
  validateInteger(uid, "uid", -1, kMaxUserId);
  validateInteger(gid, "gid", -1, kMaxUserId);
  Deno.chownSync(pathModule.toNamespacedPath(path), uid, gid);
}
