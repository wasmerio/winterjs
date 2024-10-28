// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
const rawTypeSizes = {
    int8: 1,
    uint8: 1,
    int16: 2,
    uint16: 2,
    int32: 4,
    uint32: 4,
    int64: 8,
    uint64: 8,
    float32: 4,
    float64: 8,
};
/** Number of bytes required to store `dataType`. */
export function sizeof(dataType) {
    return rawTypeSizes[dataType];
}
/** Reads the exact number of bytes from `r` required to fill `b`.
 *
 * Throws `Deno.errors.UnexpectedEof` if `n` bytes cannot be read. */
export async function readExact(r, b) {
    let totalRead = 0;
    do {
        const tmp = new Uint8Array(b.length - totalRead);
        const nRead = await r.read(tmp);
        if (nRead === null)
            throw new Deno.errors.UnexpectedEof();
        b.set(tmp, totalRead);
        totalRead += nRead;
    } while (totalRead < b.length);
}
/** Reads exactly `n` bytes from `r`.
 *
 * Resolves it in a `Uint8Array`, or throws `Deno.errors.UnexpectedEof` if `n` bytes cannot be read. */
export async function getNBytes(r, n) {
    const scratch = new Uint8Array(n);
    await readExact(r, scratch);
    return scratch;
}
/** Decodes a number from `b`. If `o.bytes` is shorter than `sizeof(o.dataType)`, returns `null`.
 *
 * `o.dataType` defaults to `"int32"`. */
export function varnum(b, o = {}) {
    o.dataType = o.dataType ?? "int32";
    const littleEndian = (o.endian ?? "big") === "little" ? true : false;
    if (b.length < sizeof(o.dataType))
        return null;
    const view = new DataView(b.buffer);
    switch (o.dataType) {
        case "int8":
            return view.getInt8(b.byteOffset);
        case "uint8":
            return view.getUint8(b.byteOffset);
        case "int16":
            return view.getInt16(b.byteOffset, littleEndian);
        case "uint16":
            return view.getUint16(b.byteOffset, littleEndian);
        case "int32":
            return view.getInt32(b.byteOffset, littleEndian);
        case "uint32":
            return view.getUint32(b.byteOffset, littleEndian);
        case "float32":
            return view.getFloat32(b.byteOffset, littleEndian);
        case "float64":
            return view.getFloat64(b.byteOffset, littleEndian);
    }
}
/** Decodes a bigint from `b`. If `o.bytes` is shorter than `sizeof(o.dataType)`, returns `null`.
 *
 * `o.dataType` defaults to `"int64"`. */
export function varbig(b, o = {}) {
    o.dataType = o.dataType ?? "int64";
    const littleEndian = (o.endian ?? "big") === "little" ? true : false;
    if (b.length < sizeof(o.dataType))
        return null;
    const view = new DataView(b.buffer);
    switch (o.dataType) {
        case "int8":
            return BigInt(view.getInt8(b.byteOffset));
        case "uint8":
            return BigInt(view.getUint8(b.byteOffset));
        case "int16":
            return BigInt(view.getInt16(b.byteOffset, littleEndian));
        case "uint16":
            return BigInt(view.getUint16(b.byteOffset, littleEndian));
        case "int32":
            return BigInt(view.getInt32(b.byteOffset, littleEndian));
        case "uint32":
            return BigInt(view.getUint32(b.byteOffset, littleEndian));
        case "int64":
            return view.getBigInt64(b.byteOffset, littleEndian);
        case "uint64":
            return view.getBigUint64(b.byteOffset, littleEndian);
    }
}
/** Encodes number `x` into `b`. Returns the number of bytes used, or `0` if `b` is shorter than `sizeof(o.dataType)`.
 *
 * `o.dataType` defaults to `"int32"`. */
export function putVarnum(b, x, o = {}) {
    o.dataType = o.dataType ?? "int32";
    const littleEndian = (o.endian ?? "big") === "little" ? true : false;
    if (b.length < sizeof(o.dataType))
        return 0;
    const view = new DataView(b.buffer);
    switch (o.dataType) {
        case "int8":
            view.setInt8(b.byteOffset, x);
            break;
        case "uint8":
            view.setUint8(b.byteOffset, x);
            break;
        case "int16":
            view.setInt16(b.byteOffset, x, littleEndian);
            break;
        case "uint16":
            view.setUint16(b.byteOffset, x, littleEndian);
            break;
        case "int32":
            view.setInt32(b.byteOffset, x, littleEndian);
            break;
        case "uint32":
            view.setUint32(b.byteOffset, x, littleEndian);
            break;
        case "float32":
            view.setFloat32(b.byteOffset, x, littleEndian);
            break;
        case "float64":
            view.setFloat64(b.byteOffset, x, littleEndian);
            break;
    }
    return sizeof(o.dataType);
}
/** Encodes bigint `x` into `b`. Returns the number of bytes used, or `0` if `b` is shorter than `sizeof(o.dataType)`.
 *
 * `o.dataType` defaults to `"int64"`. */
export function putVarbig(b, x, o = {}) {
    o.dataType = o.dataType ?? "int64";
    const littleEndian = (o.endian ?? "big") === "little" ? true : false;
    if (b.length < sizeof(o.dataType))
        return 0;
    const view = new DataView(b.buffer);
    switch (o.dataType) {
        case "int8":
            view.setInt8(b.byteOffset, Number(x));
            break;
        case "uint8":
            view.setUint8(b.byteOffset, Number(x));
            break;
        case "int16":
            view.setInt16(b.byteOffset, Number(x), littleEndian);
            break;
        case "uint16":
            view.setUint16(b.byteOffset, Number(x), littleEndian);
            break;
        case "int32":
            view.setInt32(b.byteOffset, Number(x), littleEndian);
            break;
        case "uint32":
            view.setUint32(b.byteOffset, Number(x), littleEndian);
            break;
        case "int64":
            view.setBigInt64(b.byteOffset, x, littleEndian);
            break;
        case "uint64":
            view.setBigUint64(b.byteOffset, x, littleEndian);
            break;
    }
    return sizeof(o.dataType);
}
/** Decodes a number from `r`, consuming `sizeof(o.dataType)` bytes. If less than `sizeof(o.dataType)` bytes were read, throws `Deno.errors.unexpectedEof`.
 *
 * `o.dataType` defaults to `"int32"`. */
export async function readVarnum(r, o = {}) {
    o.dataType = o.dataType ?? "int32";
    const scratch = await getNBytes(r, sizeof(o.dataType));
    return varnum(scratch, o);
}
/** Decodes a bigint from `r`, consuming `sizeof(o.dataType)` bytes. If less than `sizeof(o.dataType)` bytes were read, throws `Deno.errors.unexpectedEof`.
 *
 * `o.dataType` defaults to `"int64"`. */
export async function readVarbig(r, o = {}) {
    o.dataType = o.dataType ?? "int64";
    const scratch = await getNBytes(r, sizeof(o.dataType));
    return varbig(scratch, o);
}
/** Encodes and writes `x` to `w`. Resolves to the number of bytes written.
 *
 * `o.dataType` defaults to `"int32"`. */
export function writeVarnum(w, x, o = {}) {
    o.dataType = o.dataType ?? "int32";
    const scratch = new Uint8Array(sizeof(o.dataType));
    putVarnum(scratch, x, o);
    return w.write(scratch);
}
/** Encodes and writes `x` to `w`. Resolves to the number of bytes written.
 *
 * `o.dataType` defaults to `"int64"`. */
export function writeVarbig(w, x, o = {}) {
    o.dataType = o.dataType ?? "int64";
    const scratch = new Uint8Array(sizeof(o.dataType));
    putVarbig(scratch, x, o);
    return w.write(scratch);
}
/** Encodes `x` into a new `Uint8Array`.
 *
 * `o.dataType` defaults to `"int32"` */
export function varnumBytes(x, o = {}) {
    o.dataType = o.dataType ?? "int32";
    const b = new Uint8Array(sizeof(o.dataType));
    putVarnum(b, x, o);
    return b;
}
/** Encodes `x` into a new `Uint8Array`.
 *
 * `o.dataType` defaults to `"int64"` */
export function varbigBytes(x, o = {}) {
    o.dataType = o.dataType ?? "int64";
    const b = new Uint8Array(sizeof(o.dataType));
    putVarbig(b, x, o);
    return b;
}
