// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with POSIX-formatted paths.
 *
 * This module also provides some functions that help when working with URLs.
 * See the documentation for examples.
 *
 * Codes in the examples uses POSIX path but it automatically use Windows path
 * on Windows. Use methods under `posix` or `win32` object instead to handle non
 * platform specific path like:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/posix/from-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(fromFileUrl("file:///home/foo"), "/home/foo");
 * ```
 *
 * @module
 */
export * from "./basename";
export * from "./constants";
export * from "./dirname";
export * from "./extname";
export * from "./format";
export * from "./from_file_url";
export * from "./is_absolute";
export * from "./join";
export * from "./normalize";
export * from "./parse";
export * from "./relative";
export * from "./resolve";
export * from "./to_file_url";
export * from "./to_namespaced_path";
export * from "./common";
export * from "../types";
export * from "./glob_to_regexp";
export * from "./is_glob";
export * from "./join_globs";
export * from "./normalize_glob";
