// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../../buffer";
export const MAX_RANDOM_VALUES = 65536;
export const MAX_SIZE = 4294967295;
function generateRandomBytes(size) {
  if (size > MAX_SIZE) {
    throw new RangeError(
      `The value of "size" is out of range. It must be >= 0 && <= ${MAX_SIZE}. Received ${size}`
    );
  }
  const bytes = Buffer.allocUnsafe(size);
  //Work around for getRandomValues max generation
  if (size > MAX_RANDOM_VALUES) {
    for (let generated = 0; generated < size; generated += MAX_RANDOM_VALUES) {
      globalThis.crypto.getRandomValues(
        bytes.slice(generated, generated + MAX_RANDOM_VALUES)
      );
    }
  } else {
    globalThis.crypto.getRandomValues(bytes);
  }
  return bytes;
}
export default function randomBytes(size, cb) {
  if (typeof cb === "function") {
    let err = null,
      bytes;
    try {
      bytes = generateRandomBytes(size);
    } catch (e) {
      //NodeJS nonsense
      //If the size is out of range it will throw sync, otherwise throw async
      if (
        e instanceof RangeError &&
        e.message.includes('The value of "size" is out of range')
      ) {
        throw e;
      } else if (e instanceof Error) {
        err = e;
      } else {
        err = new Error("[non-error thrown]");
      }
    }
    setTimeout(() => {
      if (err) {
        cb(err);
      } else {
        cb(null, bytes);
      }
    }, 0);
  } else {
    return generateRandomBytes(size);
  }
}
