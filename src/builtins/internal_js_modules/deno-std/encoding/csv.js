// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Port of the Go
 * [encoding/csv](https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/)
 * library.
 *
 * @module
 */
import { assert } from "../_util/asserts";
import { Parser } from "./csv/_parser";
export {
  ERR_BARE_QUOTE,
  ERR_FIELD_COUNT,
  ERR_INVALID_DELIM,
  ERR_QUOTE,
  ParseError,
} from "./csv/_io";
const QUOTE = '"';
const LF = "\n";
const CRLF = "\r\n";
const BYTE_ORDER_MARK = "\ufeff";
export class StringifyError extends Error {
  name = "StringifyError";
}
function getEscapedString(value, sep) {
  if (value === undefined || value === null) return "";
  let str = "";
  if (typeof value === "object") str = JSON.stringify(value);
  else str = String(value);
  // Is regex.test more performant here? If so, how to dynamically create?
  // https://stackoverflow.com/questions/3561493/
  if (str.includes(sep) || str.includes(LF) || str.includes(QUOTE)) {
    return `${QUOTE}${str.replaceAll(QUOTE, `${QUOTE}${QUOTE}`)}${QUOTE}`;
  }
  return str;
}
function normalizeColumn(column) {
  let header, prop;
  if (typeof column === "object") {
    if (Array.isArray(column)) {
      header = String(column[column.length - 1]);
      prop = column;
    } else {
      prop = Array.isArray(column.prop) ? column.prop : [column.prop];
      header =
        typeof column.header === "string"
          ? column.header
          : String(prop[prop.length - 1]);
    }
  } else {
    header = String(column);
    prop = [column];
  }
  return { header, prop };
}
/**
 * Returns an array of values from an object using the property accessors
 * (and optional transform function) in each column
 */
function getValuesFromItem(item, normalizedColumns) {
  const values = [];
  if (normalizedColumns.length) {
    for (const column of normalizedColumns) {
      let value = item;
      for (const prop of column.prop) {
        if (typeof value !== "object" || value === null) continue;
        if (Array.isArray(value)) {
          if (typeof prop === "number") value = value[prop];
          else {
            throw new StringifyError(
              'Property accessor is not of type "number"'
            );
          }
        } // I think this assertion is safe. Confirm?
        else value = value[prop];
      }
      values.push(value);
    }
  } else {
    if (Array.isArray(item)) {
      values.push(...item);
    } else if (typeof item === "object") {
      throw new StringifyError(
        "No property accessor function was provided for object"
      );
    } else {
      values.push(item);
    }
  }
  return values;
}
/**
 * @param data The source data to stringify. It's an array of items which are
 * plain objects or arrays.
 *
 * `DataItem: Record<string, unknown> | unknown[]`
 *
 * ```ts
 * const data = [
 *   {
 *     name: "Deno",
 *     repo: { org: "denoland", name: "deno" },
 *     runsOn: ["Rust", "TypeScript"],
 *   },
 * ];
 * ```
 *
 * @example
 * ```ts
 * import {
 *   Column,
 *   stringify,
 * } from "https://deno.land/std@$STD_VERSION/encoding/csv";
 *
 * type Character = {
 *   age: number;
 *   name: {
 *     first: string;
 *     last: string;
 *   };
 * };
 *
 * const data: Character[] = [
 *   {
 *     age: 70,
 *     name: {
 *       first: "Rick",
 *       last: "Sanchez",
 *     },
 *   },
 *   {
 *     age: 14,
 *     name: {
 *       first: "Morty",
 *       last: "Smith",
 *     },
 *   },
 * ];
 *
 * let columns: Column[] = [
 *   ["name", "first"],
 *   "age",
 * ];
 *
 * console.log(stringify(data, { columns }));
 * // first,age
 * // Rick,70
 * // Morty,14
 * ```
 *
 * @param options Output formatting options
 */
export function stringify(
  data,
  { headers = true, separator: sep = ",", columns = [], bom = false } = {}
) {
  if (sep.includes(QUOTE) || sep.includes(CRLF)) {
    const message = [
      "Separator cannot include the following strings:",
      '  - U+0022: Quotation mark (")',
      "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
    ].join("\n");
    throw new StringifyError(message);
  }
  const normalizedColumns = columns.map(normalizeColumn);
  let output = "";
  if (bom) {
    output += BYTE_ORDER_MARK;
  }
  if (headers) {
    output += normalizedColumns
      .map((column) => getEscapedString(column.header, sep))
      .join(sep);
    output += CRLF;
  }
  for (const item of data) {
    const values = getValuesFromItem(item, normalizedColumns);
    output += values.map((value) => getEscapedString(value, sep)).join(sep);
    output += CRLF;
  }
  return output;
}
export function parse(
  input,
  opt = {
    skipFirstRow: false,
  }
) {
  const parser = new Parser(opt);
  const r = parser.parse(input);
  if (opt.skipFirstRow || opt.columns) {
    let headers = [];
    let i = 0;
    if (opt.skipFirstRow) {
      const head = r.shift();
      assert(head != null);
      headers = head;
      i++;
    }
    if (opt.columns) {
      headers = opt.columns;
    }
    return r.map((e) => {
      if (e.length !== headers.length) {
        throw new Error(
          `Error number of fields line: ${i}\nNumber of fields found: ${headers.length}\nExpected number of fields: ${e.length}`
        );
      }
      i++;
      const out = {};
      for (let j = 0; j < e.length; j++) {
        out[headers[j]] = e[j];
      }
      return out;
    });
  }
  return r;
}
