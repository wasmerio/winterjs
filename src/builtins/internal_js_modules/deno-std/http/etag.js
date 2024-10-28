// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Provides functions for dealing with and matching ETags, including
 * {@linkcode eTag} to calculate an etag for a given entity,
 * {@linkcode ifMatch} for validating if an ETag matches against a `If-Match`
 * header and {@linkcode ifNoneMatch} for validating an Etag against an
 * `If-None-Match` header.
 *
 * See further information on the `ETag` header on
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag | MDN}.
 *
 * @module
 */
import { encodeBase64 as base64Encode } from "@std/encoding/base64";
const encoder = new TextEncoder();
const DEFAULT_ALGORITHM = "SHA-256";
function isFileInfo(value) {
    return Boolean(value && typeof value === "object" && "mtime" in value && "size" in value);
}
async function calcEntity(entity, { algorithm = DEFAULT_ALGORITHM }) {
    // a short circuit for zero length entities
    if (entity.length === 0) {
        return `0-47DEQpj8HBSa+/TImW+5JCeuQeR`;
    }
    if (typeof entity === "string") {
        entity = encoder.encode(entity);
    }
    const hash = base64Encode(await crypto.subtle.digest(algorithm, entity))
        .substring(0, 27);
    return `${entity.length.toString(16)}-${hash}`;
}
async function calcFileInfo(fileInfo, { algorithm = DEFAULT_ALGORITHM }) {
    if (fileInfo.mtime) {
        const hash = base64Encode(await crypto.subtle.digest(algorithm, encoder.encode(fileInfo.mtime.toJSON()))).substring(0, 27);
        return `${fileInfo.size.toString(16)}-${hash}`;
    }
}
export async function eTag(entity, options = {}) {
    const weak = options.weak ?? isFileInfo(entity);
    const tag = await (isFileInfo(entity)
        ? calcFileInfo(entity, options)
        : calcEntity(entity, options));
    return tag ? weak ? `W/"${tag}"` : `"${tag}"` : undefined;
}
const STAR_REGEXP = /^\s*\*\s*$/;
const COMMA_REGEXP = /\s*,\s*/;
/** A helper function that takes the value from the `If-Match` header and a
 * calculated etag for the target. By using strong comparison, return `true` if
 * the values match, otherwise `false`.
 *
 * See MDN's [`If-Match`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)
 * article for more information on how to use this function.
 *
 * @example Usage
 * ```ts ignore
 * import {
 *   eTag,
 *   ifMatch,
 * } from "@std/http/etag";
 * import { assert } from "@std/assert";
 *
 * const body = "hello deno!";
 *
 * Deno.serve(async (req) => {
 *   const ifMatchValue = req.headers.get("if-match");
 *   const etag = await eTag(body);
 *   assert(etag);
 *   if (!ifMatchValue || ifMatch(ifMatchValue, etag)) {
 *     return new Response(body, { status: 200, headers: { etag } });
 *   } else {
 *     return new Response(null, { status: 412, statusText: "Precondition Failed"});
 *   }
 * });
 * ```
 *
 * @param value the If-Match header value.
 * @param etag the ETag to check against.
 * @returns whether or not the parameters match.
 */
export function ifMatch(value, etag) {
    // Weak tags cannot be matched and return false.
    if (!value || !etag || etag.startsWith("W/")) {
        return false;
    }
    if (STAR_REGEXP.test(value)) {
        return true;
    }
    const tags = value.split(COMMA_REGEXP);
    return tags.includes(etag);
}
/** A helper function that takes the value from the `If-None-Match` header and
 * a calculated etag for the target entity and returns `false` if the etag for
 * the entity matches the supplied value, otherwise `true`.
 *
 * See MDN's [`If-None-Match`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
 * article for more information on how to use this function.
 *
 * @example Usage
 * ```ts ignore
 * import {
 *   eTag,
 *   ifNoneMatch,
 * } from "@std/http/etag";
 * import { assert } from "@std/assert";
 *
 * const body = "hello deno!";
 *
 * Deno.serve(async (req) => {
 *   const ifNoneMatchValue = req.headers.get("if-none-match");
 *   const etag = await eTag(body);
 *   assert(etag);
 *   if (!ifNoneMatch(ifNoneMatchValue, etag)) {
 *     return new Response(null, { status: 304, headers: { etag } });
 *   } else {
 *     return new Response(body, { status: 200, headers: { etag } });
 *   }
 * });
 * ```
 *
 * @param value the If-None-Match header value.
 * @param etag the ETag to check against.
 * @returns whether or not the parameters do not match.
 */
export function ifNoneMatch(value, etag) {
    if (!value || !etag) {
        return true;
    }
    if (STAR_REGEXP.test(value)) {
        return false;
    }
    etag = etag.startsWith("W/") ? etag.slice(2) : etag;
    const tags = value.split(COMMA_REGEXP).map((tag) => tag.startsWith("W/") ? tag.slice(2) : tag);
    return !tags.includes(etag);
}
