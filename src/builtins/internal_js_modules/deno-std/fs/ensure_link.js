// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import * as path from "../path/mod";
import { ensureDir, ensureDirSync } from "./ensure_dir";
import { toPathString } from "./_util";
/**
 * Ensures that the hard link exists.
 * If the directory structure does not exist, it is created.
 *
 * @example
 * ```ts
 * import { ensureSymlink } from "https://deno.land/std@$STD_VERSION/fs/mod";
 *
 * ensureSymlink("./folder/targetFile.dat", "./folder/targetFile.link.dat"); // returns promise
 * ```
 *
 * @param src the source file path. Directory hard links are not allowed.
 * @param dest the destination link path
 */
export async function ensureLink(src, dest) {
  dest = toPathString(dest);
  await ensureDir(path.dirname(dest));
  await Deno.link(toPathString(src), dest);
}
/**
 * Ensures that the hard link exists.
 * If the directory structure does not exist, it is created.
 *
 * @example
 * ```ts
 * import { ensureSymlinkSync } from "https://deno.land/std@$STD_VERSION/fs/mod";
 *
 * ensureSymlinkSync("./folder/targetFile.dat", "./folder/targetFile.link.dat"); // void
 * ```
 *
 * @param src the source file path. Directory hard links are not allowed.
 * @param dest the destination link path
 */
export function ensureLinkSync(src, dest) {
  dest = toPathString(dest);
  ensureDirSync(path.dirname(dest));
  Deno.linkSync(toPathString(src), dest);
}
