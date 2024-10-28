// Originally ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../../_util/asserts";
export const defaultReadOptions = {
  separator: ",",
  trimLeadingSpace: false,
};
export async function readRecord(startLine, reader, opt = defaultReadOptions) {
  const line = await reader.readLine();
  if (line === null) return null;
  if (line.length === 0) {
    return [];
  }
  return parseRecord(line, reader, opt, startLine, startLine + 1);
}
export async function parseRecord(
  line,
  reader,
  opt = defaultReadOptions,
  startLine,
  lineIndex = startLine
) {
  // line starting with comment character is ignored
  if (opt.comment && line[0] === opt.comment) {
    return [];
  }
  assert(opt.separator != null);
  let fullLine = line;
  let quoteError = null;
  const quote = '"';
  const quoteLen = quote.length;
  const separatorLen = opt.separator.length;
  let recordBuffer = "";
  const fieldIndexes = [];
  parseField: for (;;) {
    if (opt.trimLeadingSpace) {
      line = line.trimStart();
    }
    if (line.length === 0 || !line.startsWith(quote)) {
      // Non-quoted string field
      const i = line.indexOf(opt.separator);
      let field = line;
      if (i >= 0) {
        field = field.substring(0, i);
      }
      // Check to make sure a quote does not appear in field.
      if (!opt.lazyQuotes) {
        const j = field.indexOf(quote);
        if (j >= 0) {
          const col = runeCount(
            fullLine.slice(0, fullLine.length - line.slice(j).length)
          );
          quoteError = new ParseError(
            startLine + 1,
            lineIndex,
            col,
            ERR_BARE_QUOTE
          );
          break parseField;
        }
      }
      recordBuffer += field;
      fieldIndexes.push(recordBuffer.length);
      if (i >= 0) {
        line = line.substring(i + separatorLen);
        continue parseField;
      }
      break parseField;
    } else {
      // Quoted string field
      line = line.substring(quoteLen);
      for (;;) {
        const i = line.indexOf(quote);
        if (i >= 0) {
          // Hit next quote.
          recordBuffer += line.substring(0, i);
          line = line.substring(i + quoteLen);
          if (line.startsWith(quote)) {
            // `""` sequence (append quote).
            recordBuffer += quote;
            line = line.substring(quoteLen);
          } else if (line.startsWith(opt.separator)) {
            // `","` sequence (end of field).
            line = line.substring(separatorLen);
            fieldIndexes.push(recordBuffer.length);
            continue parseField;
          } else if (0 === line.length) {
            // `"\n` sequence (end of line).
            fieldIndexes.push(recordBuffer.length);
            break parseField;
          } else if (opt.lazyQuotes) {
            // `"` sequence (bare quote).
            recordBuffer += quote;
          } else {
            // `"*` sequence (invalid non-escaped quote).
            const col = runeCount(
              fullLine.slice(0, fullLine.length - line.length - quoteLen)
            );
            quoteError = new ParseError(
              startLine + 1,
              lineIndex,
              col,
              ERR_QUOTE
            );
            break parseField;
          }
        } else if (line.length > 0 || !(await reader.isEOF())) {
          // Hit end of line (copy all data so far).
          recordBuffer += line;
          const r = await reader.readLine();
          lineIndex++;
          line = r ?? ""; // This is a workaround for making this module behave similarly to the encoding/csv/reader.go.
          fullLine = line;
          if (r === null) {
            // Abrupt end of file (EOF or error).
            if (!opt.lazyQuotes) {
              const col = runeCount(fullLine);
              quoteError = new ParseError(
                startLine + 1,
                lineIndex,
                col,
                ERR_QUOTE
              );
              break parseField;
            }
            fieldIndexes.push(recordBuffer.length);
            break parseField;
          }
          recordBuffer += "\n"; // preserve line feed (This is because TextProtoReader removes it.)
        } else {
          // Abrupt end of file (EOF on error).
          if (!opt.lazyQuotes) {
            const col = runeCount(fullLine);
            quoteError = new ParseError(
              startLine + 1,
              lineIndex,
              col,
              ERR_QUOTE
            );
            break parseField;
          }
          fieldIndexes.push(recordBuffer.length);
          break parseField;
        }
      }
    }
  }
  if (quoteError) {
    throw quoteError;
  }
  const result = [];
  let preIdx = 0;
  for (const i of fieldIndexes) {
    result.push(recordBuffer.slice(preIdx, i));
    preIdx = i;
  }
  return result;
}
function runeCount(s) {
  // Array.from considers the surrogate pair.
  return Array.from(s).length;
}
/**
 * A ParseError is returned for parsing errors.
 * Line numbers are 1-indexed and columns are 0-indexed.
 */
export class ParseError extends SyntaxError {
  /** Line where the record starts*/
  startLine;
  /** Line where the error occurred */
  line;
  /** Column (rune index) where the error occurred */
  column;
  constructor(start, line, column, message) {
    super();
    this.startLine = start;
    this.column = column;
    this.line = line;
    if (message === ERR_FIELD_COUNT) {
      this.message = `record on line ${line}: ${message}`;
    } else if (start !== line) {
      this.message = `record on line ${start}; parse error on line ${line}, column ${column}: ${message}`;
    } else {
      this.message = `parse error on line ${line}, column ${column}: ${message}`;
    }
  }
}
export const ERR_BARE_QUOTE = 'bare " in non-quoted-field';
export const ERR_QUOTE = 'extraneous or missing " in quoted-field';
export const ERR_INVALID_DELIM = "Invalid Delimiter";
export const ERR_FIELD_COUNT = "wrong number of fields";
