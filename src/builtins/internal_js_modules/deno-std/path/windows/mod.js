// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with Windows-specific paths.
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/windows/from-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(fromFileUrl("file:///home/foo"), "\\home\\foo");
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
