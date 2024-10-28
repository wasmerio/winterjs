// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { instantiateWasm } from "../../../crypto/_wasm/mod";
import { Buffer } from "../../buffer";
import { Transform } from "../../stream";
import { encode as encodeToHex } from "../../../encoding/hex";
import { encode as encodeToBase64 } from "../../../encoding/base64";
import { encode as encodeToBase64Url } from "../../../encoding/base64url";
import { validateString } from "../validators.mjs";
import { KeyObject, prepareSecretKey } from "./keys";
import { notImplemented } from "../../_utils";
const coerceToBytes = (data) => {
  if (data instanceof Uint8Array) {
    return data;
  } else if (typeof data === "string") {
    // This assumes UTF-8, which may not be correct.
    return new TextEncoder().encode(data);
  } else if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else {
    throw new TypeError("expected data to be string | BufferSource");
  }
};
/**
 * The Hash class is a utility for creating hash digests of data. It can be used in one of two ways:
 *
 * - As a stream that is both readable and writable, where data is written to produce a computed hash digest on the readable side, or
 * - Using the hash.update() and hash.digest() methods to produce the computed hash.
 *
 * The crypto.createHash() method is used to create Hash instances. Hash objects are not to be created directly using the new keyword.
 */
export class Hash extends Transform {
  #context;
  constructor(algorithm, _opts) {
    super({
      transform(chunk, _encoding, callback) {
        context.update(coerceToBytes(chunk));
        callback();
      },
      flush(callback) {
        this.push(context.digest(undefined));
        callback();
      },
    });
    if (typeof algorithm === "string") {
      // Node/OpenSSL and WebCrypto format some digest names differently;
      // we attempt to handle those here.
      algorithm = algorithm.toUpperCase();
      if (opensslToWebCryptoDigestNames[algorithm]) {
        algorithm = opensslToWebCryptoDigestNames[algorithm];
      }
      this.#context = new (instantiateWasm().DigestContext)(algorithm);
    } else {
      this.#context = algorithm;
    }
    const context = this.#context;
  }
  copy() {
    return new Hash(this.#context.clone());
  }
  /**
   * Updates the hash content with the given data.
   */
  update(data, _encoding) {
    let bytes;
    if (typeof data === "string") {
      data = new TextEncoder().encode(data);
      bytes = coerceToBytes(data);
    } else {
      bytes = coerceToBytes(data);
    }
    this.#context.update(bytes);
    return this;
  }
  /**
   * Calculates the digest of all of the data.
   *
   * If encoding is provided a string will be returned; otherwise a Buffer is returned.
   *
   * Supported encodings are currently 'hex', 'binary', 'base64', 'base64url'.
   */
  digest(encoding) {
    const digest = this.#context.digest(undefined);
    if (encoding === undefined) {
      return Buffer.from(digest);
    }
    switch (encoding) {
      case "hex":
        return new TextDecoder().decode(encodeToHex(new Uint8Array(digest)));
      case "binary":
        return String.fromCharCode(...digest);
      case "base64":
        return encodeToBase64(digest);
      case "base64url":
        return encodeToBase64Url(digest);
      case "buffer":
        return Buffer.from(digest);
      default:
        return Buffer.from(digest).toString(encoding);
    }
  }
}
export function Hmac(hmac, key, options) {
  return new HmacImpl(hmac, key, options);
}
class HmacImpl extends Transform {
  #ipad;
  #opad;
  #ZEROES = Buffer.alloc(128);
  #algorithm;
  #hash;
  constructor(hmac, key, options) {
    super({
      transform(chunk, encoding, callback) {
        // deno-lint-ignore no-explicit-any
        self.update(coerceToBytes(chunk), encoding);
        callback();
      },
      flush(callback) {
        this.push(self.digest());
        callback();
      },
    });
    // deno-lint-ignore no-this-alias
    const self = this;
    if (key instanceof KeyObject) {
      notImplemented("Hmac: KeyObject key is not implemented");
    }
    validateString(hmac, "hmac");
    const u8Key = prepareSecretKey(key, options?.encoding);
    const alg = hmac.toLowerCase();
    this.#hash = new Hash(alg, options);
    this.#algorithm = alg;
    const blockSize = alg === "sha512" || alg === "sha384" ? 128 : 64;
    const keySize = u8Key.length;
    let bufKey;
    if (keySize > blockSize) {
      bufKey = this.#hash.update(u8Key).digest();
    } else {
      bufKey = Buffer.concat([u8Key, this.#ZEROES], blockSize);
    }
    this.#ipad = Buffer.allocUnsafe(blockSize);
    this.#opad = Buffer.allocUnsafe(blockSize);
    for (let i = 0; i < blockSize; i++) {
      this.#ipad[i] = bufKey[i] ^ 0x36;
      this.#opad[i] = bufKey[i] ^ 0x5c;
    }
    this.#hash = new Hash(alg);
    this.#hash.update(this.#ipad);
  }
  digest(encoding) {
    const result = this.#hash.digest();
    return new Hash(this.#algorithm)
      .update(this.#opad)
      .update(result)
      .digest(encoding);
  }
  update(data, inputEncoding) {
    this.#hash.update(data, inputEncoding);
    return this;
  }
}
Hmac.prototype = HmacImpl.prototype;
/**
 * Supported digest names that OpenSSL/Node and WebCrypto identify differently.
 */
const opensslToWebCryptoDigestNames = {
  BLAKE2B256: "BLAKE2B-256",
  BLAKE2B384: "BLAKE2B-384",
  BLAKE2B512: "BLAKE2B",
  BLAKE2S256: "BLAKE2S",
  RIPEMD160: "RIPEMD-160",
  RMD160: "RIPEMD-160",
  SHA1: "SHA-1",
  SHA224: "SHA-224",
  SHA256: "SHA-256",
  SHA384: "SHA-384",
  SHA512: "SHA-512",
};
/**
 * Creates and returns a Hash object that can be used to generate hash digests
 * using the given `algorithm`. Optional `options` argument controls stream behavior.
 */
export function createHash(algorithm, opts) {
  return new Hash(algorithm, opts);
}
export default {
  Hash,
  Hmac,
  createHash,
};
