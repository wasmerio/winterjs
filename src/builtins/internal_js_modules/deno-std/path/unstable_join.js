// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os";
import { join as posixUnstableJoin } from "./posix/unstable_join";
import { join as windowsUnstableJoin } from "./windows/unstable_join";
/**
 * Join all given a sequence of `paths`, then normalizes the resulting path.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { join } from "@std/path/unstable-join";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   const path = join(new URL("file:///C:/foo"), "bar", "baz/asdf", "quux", "..");
 *   assertEquals(path, "C:\\foo\\bar\\baz\\asdf");
 * } else {
 *   const path = join(new URL("file:///foo"), "bar", "baz/asdf", "quux", "..");
 *   assertEquals(path, "/foo/bar/baz/asdf");
 * }
 * ```
 *
 * @param path The path to join. This can be string or file URL.
 * @param paths The paths to join.
 * @returns The joined path.
 */
export function join(path, ...paths) {
  return isWindows
    ? windowsUnstableJoin(path, ...paths)
    : posixUnstableJoin(path, ...paths);
}
