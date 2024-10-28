// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { fromFileUrl } from "../path";
import { promisify } from "../internal/util.mjs";
export function rename(oldPath, newPath, callback) {
  oldPath = oldPath instanceof URL ? fromFileUrl(oldPath) : oldPath;
  newPath = newPath instanceof URL ? fromFileUrl(newPath) : newPath;
  if (!callback) throw new Error("No callback function supplied");
  Deno.rename(oldPath, newPath).then((_) => callback(), callback);
}
export const renamePromise = promisify(rename);
export function renameSync(oldPath, newPath) {
  oldPath = oldPath instanceof URL ? fromFileUrl(oldPath) : oldPath;
  newPath = newPath instanceof URL ? fromFileUrl(newPath) : newPath;
  Deno.renameSync(oldPath, newPath);
}
