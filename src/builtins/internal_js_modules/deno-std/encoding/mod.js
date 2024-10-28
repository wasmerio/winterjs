// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Utilities for encoding and decoding common formats like hex, base64, and varint.
 *
 * ```ts
 * import { encodeBase64, decodeBase64 } from "@std/encoding";
 * import { assertEquals } from "@std/assert";
 *
 * const foobar = new TextEncoder().encode("foobar");
 * assertEquals(encodeBase64(foobar), "Zm9vYmFy");
 * assertEquals(decodeBase64("Zm9vYmFy"), foobar);
 * ```
 *
 * @module
 */
export * from "./ascii85";
export * from "./base32";
export * from "./base58";
export * from "./base64";
export * from "./base64url";
export * from "./hex";
export * from "./varint";
