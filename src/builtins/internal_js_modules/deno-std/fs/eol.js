// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Platform-specific conventions for the line ending format (i.e., the "end-of-line"). */
export var EOL;
(function (EOL) {
  /** Line Feed. Typically used in Unix (and Unix-like) systems. */
  EOL["LF"] = "\n";
  /** Carriage Return + Line Feed. Historically used in Windows and early DOS systems. */
  EOL["CRLF"] = "\r\n";
})(EOL || (EOL = {}));
const regDetect = /(?:\r?\n)/g;
/**
 * Detect the EOL character for string input.
 * returns null if no newline.
 *
 * @example
 * ```ts
 * import { detect, EOL } from "https://deno.land/std@$STD_VERSION/fs/mod";
 *
 * const CRLFinput = "deno\r\nis not\r\nnode";
 * const Mixedinput = "deno\nis not\r\nnode";
 * const LFinput = "deno\nis not\nnode";
 * const NoNLinput = "deno is not node";
 *
 * detect(LFinput); // output EOL.LF
 * detect(CRLFinput); // output EOL.CRLF
 * detect(Mixedinput); // output EOL.CRLF
 * detect(NoNLinput); // output null
 * ```
 */
export function detect(content) {
  const d = content.match(regDetect);
  if (!d || d.length === 0) {
    return null;
  }
  const hasCRLF = d.some((x) => x === EOL.CRLF);
  return hasCRLF ? EOL.CRLF : EOL.LF;
}
/**
 * Format the file to the targeted EOL.
 *
 * @example
 * ```ts
 * import { EOL, format } from "https://deno.land/std@$STD_VERSION/fs/mod";
 *
 * const CRLFinput = "deno\r\nis not\r\nnode";
 *
 * format(CRLFinput, EOL.LF); // output "deno\nis not\nnode"
 * ```
 */
export function format(content, eol) {
  return content.replace(regDetect, eol);
}
