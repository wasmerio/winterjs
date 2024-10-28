// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { defaultReadOptions, parseRecord } from "./_io";
import { TextDelimiterStream } from "../../streams/text_delimiter_stream";
class StreamLineReader {
  #reader;
  #done = false;
  constructor(reader) {
    this.#reader = reader;
  }
  async readLine() {
    const { value, done } = await this.#reader.read();
    if (done) {
      this.#done = true;
      return null;
    } else {
      // NOTE: Remove trailing CR for compatibility with golang's `encoding/csv`
      return stripLastCR(value);
    }
  }
  isEOF() {
    return Promise.resolve(this.#done);
  }
  cancel() {
    this.#reader.cancel();
  }
}
function stripLastCR(s) {
  return s.endsWith("\r") ? s.slice(0, -1) : s;
}
export class CsvStream {
  #readable;
  #options;
  #lineReader;
  #lines;
  #lineIndex = 0;
  constructor(options = defaultReadOptions) {
    this.#options = {
      ...defaultReadOptions,
      ...options,
    };
    this.#lines = new TextDelimiterStream("\n");
    this.#lineReader = new StreamLineReader(this.#lines.readable.getReader());
    this.#readable = new ReadableStream({
      pull: (controller) => this.#pull(controller),
      cancel: () => this.#lineReader.cancel(),
    });
  }
  async #pull(controller) {
    const line = await this.#lineReader.readLine();
    if (line === "") {
      // Found an empty line
      this.#lineIndex++;
      return this.#pull(controller);
    }
    if (line === null) {
      // Reached to EOF
      controller.close();
      this.#lineReader.cancel();
      return;
    }
    const record = await parseRecord(
      line,
      this.#lineReader,
      this.#options,
      this.#lineIndex
    );
    if (record === null) {
      controller.close();
      this.#lineReader.cancel();
      return;
    }
    this.#lineIndex++;
    if (record.length > 0) {
      controller.enqueue(record);
    } else {
      return this.#pull(controller);
    }
  }
  get readable() {
    return this.#readable;
  }
  get writable() {
    return this.#lines.writable;
  }
}
