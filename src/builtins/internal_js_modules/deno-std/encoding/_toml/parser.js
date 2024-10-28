// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { deepMerge } from "../../collections/deep_merge";
export class TOMLParseError extends Error {}
export class Scanner {
  source;
  #whitespace = /[ \t]/;
  #position = 0;
  constructor(source) {
    this.source = source;
  }
  /**
   * Get current character
   * @param index - relative index from current position
   */
  char(index = 0) {
    return this.source[this.#position + index] ?? "";
  }
  /**
   * Get sliced string
   * @param start - start position relative from current position
   * @param end - end position relative from current position
   */
  slice(start, end) {
    return this.source.slice(this.#position + start, this.#position + end);
  }
  /**
   * Move position to next
   */
  next(count) {
    if (typeof count === "number") {
      for (let i = 0; i < count; i++) {
        this.#position++;
      }
    } else {
      this.#position++;
    }
  }
  /**
   * Move position until current char is not a whitespace, EOL, or comment.
   * @param options.inline - skip only whitespaces
   */
  nextUntilChar(options = { comment: true }) {
    if (options.inline) {
      while (this.#whitespace.test(this.char()) && !this.eof()) {
        this.next();
      }
    } else {
      while (!this.eof()) {
        const char = this.char();
        if (this.#whitespace.test(char) || this.isCurrentCharEOL()) {
          this.next();
        } else if (options.comment && this.char() === "#") {
          // entering comment
          while (!this.isCurrentCharEOL() && !this.eof()) {
            this.next();
          }
        } else {
          break;
        }
      }
    }
    // Invalid if current char is other kinds of whitespace
    if (!this.isCurrentCharEOL() && /\s/.test(this.char())) {
      const escaped = "\\u" + this.char().charCodeAt(0).toString(16);
      throw new TOMLParseError(`Contains invalid whitespaces: \`${escaped}\``);
    }
  }
  /**
   * Position reached EOF or not
   */
  eof() {
    return this.position() >= this.source.length;
  }
  /**
   * Get current position
   */
  position() {
    return this.#position;
  }
  isCurrentCharEOL() {
    return this.char() === "\n" || this.slice(0, 2) === "\r\n";
  }
}
// -----------------------
// Utilities
// -----------------------
function success(body) {
  return {
    ok: true,
    body,
  };
}
function failure() {
  return {
    ok: false,
  };
}
export const Utils = {
  unflat(keys, values = {}, cObj) {
    const out = {};
    if (keys.length === 0) {
      return cObj;
    } else {
      if (!cObj) {
        cObj = values;
      }
      const key = keys[keys.length - 1];
      if (typeof key === "string") {
        out[key] = cObj;
      }
      return this.unflat(keys.slice(0, -1), values, out);
    }
  },
  deepAssignWithTable(target, table) {
    if (table.key.length === 0) {
      throw new Error("Unexpected key length");
    }
    const value = target[table.key[0]];
    if (typeof value === "undefined") {
      Object.assign(
        target,
        this.unflat(
          table.key,
          table.type === "Table" ? table.value : [table.value]
        )
      );
    } else if (Array.isArray(value)) {
      if (table.type === "TableArray" && table.key.length === 1) {
        value.push(table.value);
      } else {
        const last = value[value.length - 1];
        Utils.deepAssignWithTable(last, {
          type: table.type,
          key: table.key.slice(1),
          value: table.value,
        });
      }
    } else if (typeof value === "object" && value !== null) {
      Utils.deepAssignWithTable(value, {
        type: table.type,
        key: table.key.slice(1),
        value: table.value,
      });
    } else {
      throw new Error("Unexpected assign");
    }
  },
};
// ---------------------------------
// Parser combinators and generators
// ---------------------------------
function or(parsers) {
  return function Or(scanner) {
    for (const parse of parsers) {
      const result = parse(scanner);
      if (result.ok) {
        return result;
      }
    }
    return failure();
  };
}
function join(parser, separator) {
  const Separator = character(separator);
  return function Join(scanner) {
    const first = parser(scanner);
    if (!first.ok) {
      return failure();
    }
    const out = [first.body];
    while (!scanner.eof()) {
      if (!Separator(scanner).ok) {
        break;
      }
      const result = parser(scanner);
      if (result.ok) {
        out.push(result.body);
      } else {
        throw new TOMLParseError(`Invalid token after "${separator}"`);
      }
    }
    return success(out);
  };
}
function kv(keyParser, separator, valueParser) {
  const Separator = character(separator);
  return function Kv(scanner) {
    const key = keyParser(scanner);
    if (!key.ok) {
      return failure();
    }
    const sep = Separator(scanner);
    if (!sep.ok) {
      throw new TOMLParseError(`key/value pair doesn't have "${separator}"`);
    }
    const value = valueParser(scanner);
    if (!value.ok) {
      throw new TOMLParseError(
        `Value of key/value pair is invalid data format`
      );
    }
    return success(Utils.unflat(key.body, value.body));
  };
}
function merge(parser) {
  return function Merge(scanner) {
    const result = parser(scanner);
    if (!result.ok) {
      return failure();
    }
    let body = {};
    for (const record of result.body) {
      if (typeof body === "object" && body !== null) {
        // deno-lint-ignore no-explicit-any
        body = deepMerge(body, record);
      }
    }
    return success(body);
  };
}
function repeat(parser) {
  return function Repeat(scanner) {
    const body = [];
    while (!scanner.eof()) {
      const result = parser(scanner);
      if (result.ok) {
        body.push(result.body);
      } else {
        break;
      }
      scanner.nextUntilChar();
    }
    if (body.length === 0) {
      return failure();
    }
    return success(body);
  };
}
function surround(left, parser, right) {
  const Left = character(left);
  const Right = character(right);
  return function Surround(scanner) {
    if (!Left(scanner).ok) {
      return failure();
    }
    const result = parser(scanner);
    if (!result.ok) {
      throw new TOMLParseError(`Invalid token after "${left}"`);
    }
    if (!Right(scanner).ok) {
      throw new TOMLParseError(
        `Not closed by "${right}" after started with "${left}"`
      );
    }
    return success(result.body);
  };
}
function character(str) {
  return function character(scanner) {
    scanner.nextUntilChar({ inline: true });
    if (scanner.slice(0, str.length) === str) {
      scanner.next(str.length);
    } else {
      return failure();
    }
    scanner.nextUntilChar({ inline: true });
    return success(undefined);
  };
}
// -----------------------
// Parser components
// -----------------------
const Patterns = {
  BARE_KEY: /[A-Za-z0-9_-]/,
  FLOAT: /[0-9_\.e+\-]/i,
  END_OF_VALUE: /[ \t\r\n#,}]/,
};
export function BareKey(scanner) {
  scanner.nextUntilChar({ inline: true });
  if (!scanner.char() || !Patterns.BARE_KEY.test(scanner.char())) {
    return failure();
  }
  const acc = [];
  while (scanner.char() && Patterns.BARE_KEY.test(scanner.char())) {
    acc.push(scanner.char());
    scanner.next();
  }
  const key = acc.join("");
  return success(key);
}
function EscapeSequence(scanner) {
  if (scanner.char() === "\\") {
    scanner.next();
    // See https://toml.io/en/v1.0.0-rc.3#string
    switch (scanner.char()) {
      case "b":
        scanner.next();
        return success("\b");
      case "t":
        scanner.next();
        return success("\t");
      case "n":
        scanner.next();
        return success("\n");
      case "f":
        scanner.next();
        return success("\f");
      case "r":
        scanner.next();
        return success("\r");
      case "u":
      case "U": {
        // Unicode character
        const codePointLen = scanner.char() === "u" ? 4 : 6;
        const codePoint = parseInt(
          "0x" + scanner.slice(1, 1 + codePointLen),
          16
        );
        const str = String.fromCodePoint(codePoint);
        scanner.next(codePointLen + 1);
        return success(str);
      }
      case '"':
        scanner.next();
        return success('"');
      case "\\":
        scanner.next();
        return success("\\");
      default:
        scanner.next();
        return success(scanner.char());
    }
  } else {
    return failure();
  }
}
export function BasicString(scanner) {
  scanner.nextUntilChar({ inline: true });
  if (scanner.char() === '"') {
    scanner.next();
  } else {
    return failure();
  }
  const acc = [];
  while (scanner.char() !== '"' && !scanner.eof()) {
    if (scanner.char() === "\n") {
      throw new TOMLParseError("Single-line string cannot contain EOL");
    }
    const escapedChar = EscapeSequence(scanner);
    if (escapedChar.ok) {
      acc.push(escapedChar.body);
    } else {
      acc.push(scanner.char());
      scanner.next();
    }
  }
  if (scanner.eof()) {
    throw new TOMLParseError(
      `Single-line string is not closed:\n${acc.join("")}`
    );
  }
  scanner.next(); // skip last '""
  return success(acc.join(""));
}
export function LiteralString(scanner) {
  scanner.nextUntilChar({ inline: true });
  if (scanner.char() === "'") {
    scanner.next();
  } else {
    return failure();
  }
  const acc = [];
  while (scanner.char() !== "'" && !scanner.eof()) {
    if (scanner.char() === "\n") {
      throw new TOMLParseError("Single-line string cannot contain EOL");
    }
    acc.push(scanner.char());
    scanner.next();
  }
  if (scanner.eof()) {
    throw new TOMLParseError(
      `Single-line string is not closed:\n${acc.join("")}`
    );
  }
  scanner.next(); // skip last "'"
  return success(acc.join(""));
}
export function MultilineBasicString(scanner) {
  scanner.nextUntilChar({ inline: true });
  if (scanner.slice(0, 3) === '"""') {
    scanner.next(3);
  } else {
    return failure();
  }
  if (scanner.char() === "\n") {
    // The first newline is trimmed
    scanner.next();
  }
  const acc = [];
  while (scanner.slice(0, 3) !== '"""' && !scanner.eof()) {
    // line ending backslash
    if (scanner.slice(0, 2) === "\\\n") {
      scanner.next();
      scanner.nextUntilChar({ comment: false });
      continue;
    }
    const escapedChar = EscapeSequence(scanner);
    if (escapedChar.ok) {
      acc.push(escapedChar.body);
    } else {
      acc.push(scanner.char());
      scanner.next();
    }
  }
  if (scanner.eof()) {
    throw new TOMLParseError(
      `Multi-line string is not closed:\n${acc.join("")}`
    );
  }
  // if ends with 4 `"`, push the fist `"` to string
  if (scanner.char(3) === '"') {
    acc.push('"');
    scanner.next();
  }
  scanner.next(3); // skip last '""""
  return success(acc.join(""));
}
export function MultilineLiteralString(scanner) {
  scanner.nextUntilChar({ inline: true });
  if (scanner.slice(0, 3) === "'''") {
    scanner.next(3);
  } else {
    return failure();
  }
  if (scanner.char() === "\n") {
    // The first newline is trimmed
    scanner.next();
  }
  const acc = [];
  while (scanner.slice(0, 3) !== "'''" && !scanner.eof()) {
    acc.push(scanner.char());
    scanner.next();
  }
  if (scanner.eof()) {
    throw new TOMLParseError(
      `Multi-line string is not closed:\n${acc.join("")}`
    );
  }
  // if ends with 4 `'`, push the fist `'` to string
  if (scanner.char(3) === "'") {
    acc.push("'");
    scanner.next();
  }
  scanner.next(3); // skip last "'''"
  return success(acc.join(""));
}
const symbolPairs = [
  ["true", true],
  ["false", false],
  ["inf", Infinity],
  ["+inf", Infinity],
  ["-inf", -Infinity],
  ["nan", NaN],
  ["+nan", NaN],
  ["-nan", NaN],
];
export function Symbols(scanner) {
  scanner.nextUntilChar({ inline: true });
  const found = symbolPairs.find(
    ([str]) => scanner.slice(0, str.length) === str
  );
  if (!found) {
    return failure();
  }
  const [str, value] = found;
  scanner.next(str.length);
  return success(value);
}
export const DottedKey = join(or([BareKey, BasicString, LiteralString]), ".");
export function Integer(scanner) {
  scanner.nextUntilChar({ inline: true });
  // If binary / octal / hex
  const first2 = scanner.slice(0, 2);
  if (first2.length === 2 && /0(?:x|o|b)/i.test(first2)) {
    scanner.next(2);
    const acc = [first2];
    while (/[0-9a-f_]/i.test(scanner.char()) && !scanner.eof()) {
      acc.push(scanner.char());
      scanner.next();
    }
    if (acc.length === 1) {
      return failure();
    }
    return success(acc.join(""));
  }
  const acc = [];
  if (/[+-]/.test(scanner.char())) {
    acc.push(scanner.char());
    scanner.next();
  }
  while (/[0-9_]/.test(scanner.char()) && !scanner.eof()) {
    acc.push(scanner.char());
    scanner.next();
  }
  if (acc.length === 0 || (acc.length === 1 && /[+-]/.test(acc[0]))) {
    return failure();
  }
  const int = parseInt(acc.filter((char) => char !== "_").join(""));
  return success(int);
}
export function Float(scanner) {
  scanner.nextUntilChar({ inline: true });
  // lookahead validation is needed for integer value is similar to float
  let position = 0;
  while (
    scanner.char(position) &&
    !Patterns.END_OF_VALUE.test(scanner.char(position))
  ) {
    if (!Patterns.FLOAT.test(scanner.char(position))) {
      return failure();
    }
    position++;
  }
  const acc = [];
  if (/[+-]/.test(scanner.char())) {
    acc.push(scanner.char());
    scanner.next();
  }
  while (Patterns.FLOAT.test(scanner.char()) && !scanner.eof()) {
    acc.push(scanner.char());
    scanner.next();
  }
  if (acc.length === 0) {
    return failure();
  }
  const float = parseFloat(acc.filter((char) => char !== "_").join(""));
  if (isNaN(float)) {
    return failure();
  }
  return success(float);
}
export function DateTime(scanner) {
  scanner.nextUntilChar({ inline: true });
  let dateStr = scanner.slice(0, 10);
  // example: 1979-05-27
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    scanner.next(10);
  } else {
    return failure();
  }
  const acc = [];
  // example: 1979-05-27T00:32:00Z
  while (/[ 0-9TZ.:-]/.test(scanner.char()) && !scanner.eof()) {
    acc.push(scanner.char());
    scanner.next();
  }
  dateStr += acc.join("");
  const date = new Date(dateStr.trim());
  // invalid date
  if (isNaN(date.getTime())) {
    throw new TOMLParseError(`Invalid date string "${dateStr}"`);
  }
  return success(date);
}
export function LocalTime(scanner) {
  scanner.nextUntilChar({ inline: true });
  let timeStr = scanner.slice(0, 8);
  if (/^(\d{2}):(\d{2}):(\d{2})/.test(timeStr)) {
    scanner.next(8);
  } else {
    return failure();
  }
  const acc = [];
  if (scanner.char() === ".") {
    acc.push(scanner.char());
    scanner.next();
  } else {
    return success(timeStr);
  }
  while (/[0-9]/.test(scanner.char()) && !scanner.eof()) {
    acc.push(scanner.char());
    scanner.next();
  }
  timeStr += acc.join("");
  return success(timeStr);
}
export function ArrayValue(scanner) {
  scanner.nextUntilChar({ inline: true });
  if (scanner.char() === "[") {
    scanner.next();
  } else {
    return failure();
  }
  const array = [];
  while (!scanner.eof()) {
    scanner.nextUntilChar();
    const result = Value(scanner);
    if (result.ok) {
      array.push(result.body);
    } else {
      break;
    }
    scanner.nextUntilChar({ inline: true });
    // may have a next item, but trailing comma is allowed at array
    if (scanner.char() === ",") {
      scanner.next();
    } else {
      break;
    }
  }
  scanner.nextUntilChar();
  if (scanner.char() === "]") {
    scanner.next();
  } else {
    throw new TOMLParseError("Array is not closed");
  }
  return success(array);
}
export function InlineTable(scanner) {
  scanner.nextUntilChar();
  const pairs = surround("{", join(Pair, ","), "}")(scanner);
  if (!pairs.ok) {
    return failure();
  }
  let table = {};
  for (const pair of pairs.body) {
    table = deepMerge(table, pair);
  }
  return success(table);
}
export const Value = or([
  MultilineBasicString,
  MultilineLiteralString,
  BasicString,
  LiteralString,
  Symbols,
  DateTime,
  LocalTime,
  Float,
  Integer,
  ArrayValue,
  InlineTable,
]);
export const Pair = kv(DottedKey, "=", Value);
export function Block(scanner) {
  scanner.nextUntilChar();
  const result = merge(repeat(Pair))(scanner);
  if (result.ok) {
    return success({
      type: "Block",
      value: result.body,
    });
  } else {
    return failure();
  }
}
export const TableHeader = surround("[", DottedKey, "]");
export function Table(scanner) {
  scanner.nextUntilChar();
  const header = TableHeader(scanner);
  if (!header.ok) {
    return failure();
  }
  scanner.nextUntilChar();
  const block = Block(scanner);
  return success({
    type: "Table",
    key: header.body,
    value: block.ok ? block.body.value : {},
  });
}
export const TableArrayHeader = surround("[[", DottedKey, "]]");
export function TableArray(scanner) {
  scanner.nextUntilChar();
  const header = TableArrayHeader(scanner);
  if (!header.ok) {
    return failure();
  }
  scanner.nextUntilChar();
  const block = Block(scanner);
  return success({
    type: "TableArray",
    key: header.body,
    value: block.ok ? block.body.value : {},
  });
}
export function Toml(scanner) {
  const blocks = repeat(or([Block, TableArray, Table]))(scanner);
  if (!blocks.ok) {
    return failure();
  }
  let body = {};
  for (const block of blocks.body) {
    switch (block.type) {
      case "Block": {
        body = deepMerge(body, block.value);
        break;
      }
      case "Table": {
        Utils.deepAssignWithTable(body, block);
        break;
      }
      case "TableArray": {
        Utils.deepAssignWithTable(body, block);
        break;
      }
    }
  }
  return success(body);
}
export function ParserFactory(parser) {
  return function parse(tomlString) {
    const scanner = new Scanner(tomlString);
    let parsed = null;
    let err = null;
    try {
      parsed = parser(scanner);
    } catch (e) {
      err = e instanceof Error ? e : new Error("[non-error thrown]");
    }
    if (err || !parsed || !parsed.ok || !scanner.eof()) {
      const position = scanner.position();
      const subStr = tomlString.slice(0, position);
      const lines = subStr.split("\n");
      const row = lines.length;
      const column = (() => {
        let count = subStr.length;
        for (const line of lines) {
          if (count > line.length) {
            count -= line.length + 1;
          } else {
            return count;
          }
        }
        return count;
      })();
      const message = `Parse error on line ${row}, column ${column}: ${
        err ? err.message : `Unexpected character: "${scanner.char()}"`
      }`;
      throw new TOMLParseError(message);
    }
    return parsed.body;
  };
}
/**
 * Parse parses TOML string into an object.
 * @param tomlString
 */
export const parse = ParserFactory(Toml);
