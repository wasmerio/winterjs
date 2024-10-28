// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This file contains C++ node globals accesed in internal binding calls
/**
 * Adapted from
 * https://github.com/nodejs/node/blob/3b72788afb7365e10ae1e97c71d1f60ee29f09f2/src/node.h#L728-L738
 */
export var Encodings;
(function (Encodings) {
    Encodings[Encodings["ASCII"] = 0] = "ASCII";
    Encodings[Encodings["UTF8"] = 1] = "UTF8";
    Encodings[Encodings["BASE64"] = 2] = "BASE64";
    Encodings[Encodings["UCS2"] = 3] = "UCS2";
    Encodings[Encodings["BINARY"] = 4] = "BINARY";
    Encodings[Encodings["HEX"] = 5] = "HEX";
    Encodings[Encodings["BUFFER"] = 6] = "BUFFER";
    Encodings[Encodings["BASE64URL"] = 7] = "BASE64URL";
    Encodings[Encodings["LATIN1"] = 4] = "LATIN1";
})(Encodings || (Encodings = {}));
