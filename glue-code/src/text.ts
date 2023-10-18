// Taken from.
//
//  TODO: this should be implemented in Rust
//
// https://gist.githubusercontent.com/Yaffle/5458286/raw/1aa5caa5cdd9938fe0fe202357db6c6b33af24f4/TextEncoderTextDecoder.js
// TextEncoder/TextDecoder polyfills for utf-8 - an implementation of TextEncoder/TextDecoder APIs
// Written in 2013 by Viktor Mukhachev <vic99999@yandex.ru>
// To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
// You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

// Some important notes about the polyfill below:
// Native TextEncoder/TextDecoder implementation is overwritten
// String.prototype.codePointAt polyfill not included, as well as String.fromCodePoint
// TextEncoder.prototype.encode returns a regular array instead of Uint8Array
// No options (fatal of the TextDecoder constructor and stream of the TextDecoder.prototype.decode method) are supported.
// TextDecoder.prototype.decode does not valid byte sequences
// This is a demonstrative implementation not intended to have the best performance

// http://encoding.spec.whatwg.org/#textencoder

export class TextEncoder {
    encode(string: string): Uint8Array {
        const octets = [];
        const length = string.length;
        let i = 0;
        while (i < length) {
            const codePoint = string.codePointAt(i)!;
            let c = 0;
            let bits = 0;
            if (codePoint <= 0x0000007f) {
                c = 0;
                bits = 0x00;
            } else if (codePoint <= 0x000007ff) {
                c = 6;
                bits = 0xc0;
            } else if (codePoint <= 0x0000ffff) {
                c = 12;
                bits = 0xe0;
            } else if (codePoint <= 0x001fffff) {
                c = 18;
                bits = 0xf0;
            }
            octets.push(bits | (codePoint >> c));
            c -= 6;
            while (c >= 0) {
                octets.push(0x80 | ((codePoint >> c) & 0x3f));
                c -= 6;
            }
            i += codePoint >= 0x10000 ? 2 : 1;
        }
        return Uint8Array.from(octets);
    }
}

export class TextDecoder {
    decode(octets: Uint8Array): string {
        let string = "";
        let i = 0;
        while (i < octets.length) {
            let octet = octets[i];
            let bytesNeeded = 0;
            let codePoint = 0;
            if (octet <= 0x7f) {
                bytesNeeded = 0;
                codePoint = octet & 0xff;
            } else if (octet <= 0xdf) {
                bytesNeeded = 1;
                codePoint = octet & 0x1f;
            } else if (octet <= 0xef) {
                bytesNeeded = 2;
                codePoint = octet & 0x0f;
            } else if (octet <= 0xf4) {
                bytesNeeded = 3;
                codePoint = octet & 0x07;
            }
            if (octets.length - i - bytesNeeded > 0) {
                var k = 0;
                while (k < bytesNeeded) {
                    octet = octets[i + k + 1];
                    codePoint = (codePoint << 6) | (octet & 0x3f);
                    k += 1;
                }
            } else {
                codePoint = 0xfffd;
                bytesNeeded = octets.length - i;
            }
            string += String.fromCodePoint(codePoint);
            i += bytesNeeded + 1;
        }
        return string;
    }
}
