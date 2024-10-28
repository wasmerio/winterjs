// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import Dirent from "./_fs_dirent";
import { assert } from "../../_util/asserts";
import { ERR_MISSING_ARGS } from "../internal/errors";
export default class Dir {
  #dirPath;
  #syncIterator;
  #asyncIterator;
  constructor(path) {
    if (!path) {
      throw new ERR_MISSING_ARGS("path");
    }
    this.#dirPath = path;
  }
  get path() {
    if (this.#dirPath instanceof Uint8Array) {
      return new TextDecoder().decode(this.#dirPath);
    }
    return this.#dirPath;
  }
  // deno-lint-ignore no-explicit-any
  read(callback) {
    return new Promise((resolve, reject) => {
      if (!this.#asyncIterator) {
        this.#asyncIterator = Deno.readDir(this.path)[Symbol.asyncIterator]();
      }
      assert(this.#asyncIterator);
      this.#asyncIterator.next().then(
        (iteratorResult) => {
          resolve(
            iteratorResult.done ? null : new Dirent(iteratorResult.value)
          );
          if (callback) {
            callback(
              null,
              iteratorResult.done ? null : new Dirent(iteratorResult.value)
            );
          }
        },
        (err) => {
          if (callback) {
            callback(err);
          }
          reject(err);
        }
      );
    });
  }
  readSync() {
    if (!this.#syncIterator) {
      this.#syncIterator = Deno.readDirSync(this.path)[Symbol.iterator]();
    }
    const iteratorResult = this.#syncIterator.next();
    if (iteratorResult.done) {
      return null;
    } else {
      return new Dirent(iteratorResult.value);
    }
  }
  /**
   * Unlike Node, Deno does not require managing resource ids for reading
   * directories, and therefore does not need to close directories when
   * finished reading.
   */
  // deno-lint-ignore no-explicit-any
  close(callback) {
    return new Promise((resolve) => {
      if (callback) {
        callback(null);
      }
      resolve();
    });
  }
  /**
   * Unlike Node, Deno does not require managing resource ids for reading
   * directories, and therefore does not need to close directories when
   * finished reading
   */
  closeSync() {
    //No op
  }
  async *[Symbol.asyncIterator]() {
    try {
      while (true) {
        const dirent = await this.read();
        if (dirent === null) {
          break;
        }
        yield dirent;
      }
    } finally {
      await this.close();
    }
  }
}
