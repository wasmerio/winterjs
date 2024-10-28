#!/usr/bin/env -S deno run
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../../testing/asserts";
import { crypto as stdCrypto } from "../mod";
const webCrypto = globalThis.crypto;
// Wasm is limited to 32-bit operations, which SHA-256 is optimized for, while
// SHA-512 is optimized for 64-bit operations and may be slower.
for (const algorithm of ["SHA-256", "SHA-512"]) {
  for (const length of [64, 262144, 4194304, 67108864, 524291328]) {
    // Create a test input buffer and do some operations to hopefully ensure
    // it's fully initialized and not optimized away.
    const buffer = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      buffer[i] = (i + (i % 13) + (i % 31)) % 255;
    }
    let sum = 0;
    for (const byte of buffer) {
      sum += byte;
    }
    assert(sum > 0);
    for (const implementation of [
      "runtime WebCrypto (target)",
      "std/crypto Wasm   (you are here)",
    ]) {
      let lastDigest;
      Deno.bench({
        name: `${algorithm.padEnd(12)} ${length
          .toString()
          .padStart(12)}B ${implementation}`,
        async fn() {
          let digest;
          if (implementation === "std/crypto Wasm   (you are here)") {
            digest = stdCrypto.subtle.digestSync(algorithm, buffer);
          } else if (implementation === "runtime WebCrypto (target)") {
            digest = await webCrypto.subtle.digest(algorithm, buffer);
          } else {
            throw new Error(`Unknown implementation ${implementation}`);
          }
          assert(digest.byteLength > 0);
          if (lastDigest) {
            assertEquals(lastDigest, digest);
          }
          lastDigest = digest;
        },
      });
    }
  }
}
