// deno-lint-ignore-file no-explicit-any
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// Check Deno, then the remaining runtimes (e.g. Node, Bun and the browser)
export const isWindows = globalThis.Deno?.build.os === "windows" ||
    globalThis.navigator?.platform?.startsWith("Win") ||
    globalThis.process?.platform?.startsWith("win") ||
    false;
