// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
import { Buffer } from "./buffer";
import { normalizeEncoding as castEncoding, notImplemented } from "./_utils";
var NotImplemented;
(function (NotImplemented) {
  NotImplemented[(NotImplemented["ascii"] = 0)] = "ascii";
  NotImplemented[(NotImplemented["latin1"] = 1)] = "latin1";
  NotImplemented[(NotImplemented["utf16le"] = 2)] = "utf16le";
})(NotImplemented || (NotImplemented = {}));
function normalizeEncoding(enc) {
  const encoding = castEncoding(enc ?? null);
  if (encoding && encoding in NotImplemented) notImplemented(encoding);
  if (!encoding && typeof enc === "string" && enc.toLowerCase() !== "raw") {
    throw new Error(`Unknown encoding: ${enc}`);
  }
  return String(encoding);
}
/**
 * Check is `ArrayBuffer` and not `TypedArray`. Typescript allowed `TypedArray` to be passed as `ArrayBuffer` and does not do a deep check
 */
function isBufferType(buf) {
  return buf instanceof ArrayBuffer && buf.BYTES_PER_ELEMENT;
}
/*
 * Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
 * continuation byte. If an invalid byte is detected, -2 is returned.
 */
function utf8CheckByte(byte) {
  if (byte <= 0x7f) return 0;
  else if (byte >> 5 === 0x06) return 2;
  else if (byte >> 4 === 0x0e) return 3;
  else if (byte >> 3 === 0x1e) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}
/*
 * Checks at most 3 bytes at the end of a Buffer in order to detect an
 * incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
 * needed to complete the UTF-8 character (if applicable) are returned.
 */
function utf8CheckIncomplete(self, buf, i) {
  let j = buf.length - 1;
  if (j < i) return 0;
  let nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;
      else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}
/*
 * Validates as many continuation bytes for a multi-byte UTF-8 character as
 * needed or are available. If we see a non-continuation byte where we expect
 * one, we "replace" the validated continuation bytes we've seen so far with
 * a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
 * behavior. The continuation byte check is included three times in the case
 * where all of the continuation bytes for a character exist in the same buffer.
 * It is also done this way as a slight performance increase instead of using a
 * loop.
 */
function utf8CheckExtraBytes(self, buf) {
  if ((buf[0] & 0xc0) !== 0x80) {
    self.lastNeed = 0;
    return "\ufffd";
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xc0) !== 0x80) {
      self.lastNeed = 1;
      return "\ufffd";
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xc0) !== 0x80) {
        self.lastNeed = 2;
        return "\ufffd";
      }
    }
  }
}
/*
 * Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
 */
function utf8FillLastComplete(buf) {
  const p = this.lastTotal - this.lastNeed;
  const r = utf8CheckExtraBytes(this, buf);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}
/*
 * Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
 */
function utf8FillLastIncomplete(buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
}
/*
 * Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
 * partial character, the character's bytes are buffered until the required
 * number of bytes are available.
 */
function utf8Text(buf, i) {
  const total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString("utf8", i);
  this.lastTotal = total;
  const end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString("utf8", i, end);
}
/*
 * For UTF-8, a replacement character is added when ending on a partial
 * character.
 */
function utf8End(buf) {
  const r = buf && buf.length ? this.write(buf) : "";
  if (this.lastNeed) return r + "\ufffd";
  return r;
}
function utf8Write(buf) {
  if (typeof buf === "string") {
    return buf;
  }
  if (buf.length === 0) return "";
  let r;
  let i;
  // Because `TypedArray` is recognized as `ArrayBuffer` but in the reality, there are some fundamental difference. We would need to cast it properly
  const normalizedBuffer = isBufferType(buf) ? buf : Buffer.from(buf);
  if (this.lastNeed) {
    r = this.fillLast(normalizedBuffer);
    if (r === undefined) return "";
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) {
    return r
      ? r + this.text(normalizedBuffer, i)
      : this.text(normalizedBuffer, i);
  }
  return r || "";
}
function base64Text(buf, i) {
  const n = (buf.length - i) % 3;
  if (n === 0) return buf.toString("base64", i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString("base64", i, buf.length - n);
}
function base64End(buf) {
  const r = buf && buf.length ? this.write(buf) : "";
  if (this.lastNeed) {
    return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
  }
  return r;
}
function simpleWrite(buf) {
  if (typeof buf === "string") {
    return buf;
  }
  return buf.toString(this.encoding);
}
function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : "";
}
class StringDecoderBase {
  encoding;
  lastChar;
  lastNeed = 0;
  lastTotal = 0;
  constructor(encoding, nb) {
    this.encoding = encoding;
    this.lastChar = Buffer.allocUnsafe(nb);
  }
}
class Base64Decoder extends StringDecoderBase {
  end = base64End;
  fillLast = utf8FillLastIncomplete;
  text = base64Text;
  write = utf8Write;
  constructor(encoding) {
    super(normalizeEncoding(encoding), 3);
  }
}
class GenericDecoder extends StringDecoderBase {
  end = simpleEnd;
  fillLast = undefined;
  text = utf8Text;
  write = simpleWrite;
  constructor(encoding) {
    super(normalizeEncoding(encoding), 4);
  }
}
class Utf8Decoder extends StringDecoderBase {
  end = utf8End;
  fillLast = utf8FillLastComplete;
  text = utf8Text;
  write = utf8Write;
  constructor(encoding) {
    super(normalizeEncoding(encoding), 4);
  }
}
/*
 * StringDecoder provides an interface for efficiently splitting a series of
 * buffers into a series of JS strings without breaking apart multi-byte
 * characters.
 */
export class StringDecoder {
  encoding;
  end;
  fillLast;
  lastChar;
  lastNeed;
  lastTotal;
  text;
  write;
  constructor(encoding) {
    const normalizedEncoding = normalizeEncoding(encoding);
    let decoder;
    switch (normalizedEncoding) {
      case "utf8":
        decoder = new Utf8Decoder(encoding);
        break;
      case "base64":
        decoder = new Base64Decoder(encoding);
        break;
      default:
        decoder = new GenericDecoder(encoding);
    }
    this.encoding = decoder.encoding;
    this.end = decoder.end;
    this.fillLast = decoder.fillLast;
    this.lastChar = decoder.lastChar;
    this.lastNeed = decoder.lastNeed;
    this.lastTotal = decoder.lastTotal;
    this.text = decoder.text;
    this.write = decoder.write;
  }
}
// Allow calling StringDecoder() without new
const PStringDecoder = new Proxy(StringDecoder, {
  apply(_target, thisArg, args) {
    // @ts-ignore tedious to replicate types ...
    return Object.assign(thisArg, new StringDecoder(...args));
  },
});
export default { StringDecoder: PStringDecoder };
