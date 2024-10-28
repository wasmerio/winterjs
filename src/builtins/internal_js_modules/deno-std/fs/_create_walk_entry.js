// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
import { basename } from "@std/path/basename";
import { normalize } from "@std/path/normalize";
import { toPathString } from "./_to_path_string";
/** Create {@linkcode WalkEntry} for the `path` synchronously. */
export function createWalkEntrySync(path) {
  path = toPathString(path);
  path = normalize(path);
  const name = basename(path);
  const info = Deno.statSync(path);
  return {
    path,
    name,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink,
  };
}
/** Create {@linkcode WalkEntry} for the `path` asynchronously. */
export async function createWalkEntry(path) {
  path = toPathString(path);
  path = normalize(path);
  const name = basename(path);
  const info = await Deno.stat(path);
  return {
    path,
    name,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink,
  };
}
