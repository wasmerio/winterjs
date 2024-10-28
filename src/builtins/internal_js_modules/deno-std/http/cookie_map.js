// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore no-control-regex
const FIELD_CONTENT_REGEXP = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
const KEY_REGEXP = /(?:^|;) *([^=]*)=[^;]*/g;
const SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;
const matchCache = {};
function getPattern(name) {
    if (name in matchCache) {
        return matchCache[name];
    }
    return matchCache[name] = new RegExp(`(?:^|;) *${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`);
}
function pushCookie(values, cookie) {
    if (cookie.overwrite) {
        for (let i = values.length - 1; i >= 0; i--) {
            if (values[i].indexOf(`${cookie.name}=`) === 0) {
                values.splice(i, 1);
            }
        }
    }
    values.push(cookie.toHeaderValue());
}
function validateCookieProperty(key, value) {
    if (value && !FIELD_CONTENT_REGEXP.test(value)) {
        throw new TypeError(`The "${key}" of the cookie (${value}) is invalid.`);
    }
}
/** An internal abstraction to manage cookies. */
class Cookie {
    domain;
    expires;
    httpOnly = true;
    maxAge;
    name;
    overwrite = false;
    path = "/";
    sameSite = false;
    secure = false;
    signed;
    value;
    constructor(name, value, attributes) {
        validateCookieProperty("name", name);
        this.name = name;
        validateCookieProperty("value", value);
        this.value = value ?? "";
        Object.assign(this, attributes);
        if (!this.value) {
            this.expires = new Date(0);
            this.maxAge = undefined;
        }
        validateCookieProperty("path", this.path);
        validateCookieProperty("domain", this.domain);
        if (this.sameSite && typeof this.sameSite === "string" &&
            !SAME_SITE_REGEXP.test(this.sameSite)) {
            throw new TypeError(`The "sameSite" of the cookie ("${this.sameSite}") is invalid.`);
        }
    }
    toHeaderValue() {
        let value = this.toString();
        if (this.maxAge) {
            this.expires = new Date(Date.now() + (this.maxAge * 1000));
        }
        if (this.path) {
            value += `; path=${this.path}`;
        }
        if (this.expires) {
            value += `; expires=${this.expires.toUTCString()}`;
        }
        if (this.domain) {
            value += `; domain=${this.domain}`;
        }
        if (this.sameSite) {
            value += `; samesite=${this.sameSite === true ? "strict" : this.sameSite.toLowerCase()}`;
        }
        if (this.secure) {
            value += "; secure";
        }
        if (this.httpOnly) {
            value += "; httponly";
        }
        return value;
    }
    toString() {
        return `${this.name}=${this.value}`;
    }
}
/** Symbol which is used in {@link mergeHeaders} to extract a
 * `[string | string][]` from an instance to generate the final set of
 * headers. */
export const cookieMapHeadersInitSymbol = Symbol.for("Deno.std.cookieMap.headersInit");
function isMergeable(value) {
    return value != null && typeof value === "object" &&
        cookieMapHeadersInitSymbol in value;
}
/** Allows merging of various sources of headers into a final set of headers
 * which can be used in a {@linkcode Response}.
 *
 * Note, that unlike when passing a `Response` or {@linkcode Headers} used in a
 * response to {@linkcode CookieMap} or {@linkcode SecureCookieMap}, merging
 * will not ensure that there are no other `Set-Cookie` headers from other
 * sources, it will simply append the various headers together. */
export function mergeHeaders(...sources) {
    const headers = new Headers();
    for (const source of sources) {
        let entries;
        if (source instanceof Headers) {
            entries = source;
        }
        else if ("headers" in source && source.headers instanceof Headers) {
            entries = source.headers;
        }
        else if (isMergeable(source)) {
            entries = source[cookieMapHeadersInitSymbol]();
        }
        else if (Array.isArray(source)) {
            entries = source;
        }
        else {
            entries = Object.entries(source);
        }
        for (const [key, value] of entries) {
            headers.append(key, value);
        }
    }
    return headers;
}
const keys = Symbol("#keys");
const requestHeaders = Symbol("#requestHeaders");
const responseHeaders = Symbol("#responseHeaders");
const isSecure = Symbol("#secure");
const requestKeys = Symbol("#requestKeys");
/** An internal abstract class which provides common functionality for
 * {@link CookieMap} and {@link SecureCookieMap}. */
class CookieMapBase {
    [keys];
    [requestHeaders];
    [responseHeaders];
    [isSecure];
    [requestKeys]() {
        if (this[keys]) {
            return this[keys];
        }
        const result = this[keys] = [];
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return result;
        }
        let matches;
        while ((matches = KEY_REGEXP.exec(header))) {
            const [, key] = matches;
            result.push(key);
        }
        return result;
    }
    constructor(request, options) {
        this[requestHeaders] = "headers" in request ? request.headers : request;
        const { secure = false, response = new Headers() } = options;
        this[responseHeaders] = "headers" in response ? response.headers : response;
        this[isSecure] = secure;
    }
    /** A method used by {@linkcode mergeHeaders} to be able to merge
     * headers from various sources when forming a {@linkcode Response}. */
    [cookieMapHeadersInitSymbol]() {
        const init = [];
        for (const [key, value] of this[responseHeaders]) {
            if (key === "set-cookie") {
                init.push([key, value]);
            }
        }
        return init;
    }
    [Symbol.for("Deno.customInspect")]() {
        return `${this.constructor.name} []`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, 
    // deno-lint-ignore no-explicit-any
    options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1,
        });
        return `${options.stylize(this.constructor.name, "special")} ${inspect([], newOptions)}`;
    }
}
/**
 * Provides a way to manage cookies in a request and response on the server
 * as a single iterable collection.
 *
 * The methods and properties align to {@linkcode Map}. When constructing a
 * {@linkcode Request} or {@linkcode Headers} from the request need to be
 * provided, as well as optionally the {@linkcode Response} or `Headers` for the
 * response can be provided. Alternatively the {@linkcode mergeHeaders}
 * function can be used to generate a final set of headers for sending in the
 * response. */
export class CookieMap extends CookieMapBase {
    /** Contains the number of valid cookies in the request headers. */
    get size() {
        return [...this].length;
    }
    constructor(request, options = {}) {
        super(request, options);
    }
    /** Deletes all the cookies from the {@linkcode Request} in the response. */
    clear(options = {}) {
        for (const key of this.keys()) {
            this.set(key, null, options);
        }
    }
    /** Set a cookie to be deleted in the response.
     *
     * This is a convenience function for `set(key, null, options?)`.
     */
    delete(key, options = {}) {
        this.set(key, null, options);
        return true;
    }
    /** Return the value of a matching key present in the {@linkcode Request}. If
     * the key is not present `undefined` is returned. */
    get(key) {
        const headerValue = this[requestHeaders].get("cookie");
        if (!headerValue) {
            return undefined;
        }
        const match = headerValue.match(getPattern(key));
        if (!match) {
            return undefined;
        }
        const [, value] = match;
        return value;
    }
    /** Returns `true` if the matching key is present in the {@linkcode Request},
     * otherwise `false`. */
    has(key) {
        const headerValue = this[requestHeaders].get("cookie");
        if (!headerValue) {
            return false;
        }
        return getPattern(key).test(headerValue);
    }
    /** Set a named cookie in the response. The optional
     * {@linkcode CookieMapSetDeleteOptions} are applied to the cookie being set.
     */
    set(key, value, options = {}) {
        const resHeaders = this[responseHeaders];
        const values = [];
        for (const [key, value] of resHeaders) {
            if (key === "set-cookie") {
                values.push(value);
            }
        }
        const secure = this[isSecure];
        if (!secure && options.secure && !options.ignoreInsecure) {
            throw new TypeError("Cannot send secure cookie over unencrypted connection.");
        }
        const cookie = new Cookie(key, value, options);
        cookie.secure = options.secure ?? secure;
        pushCookie(values, cookie);
        resHeaders.delete("set-cookie");
        for (const value of values) {
            resHeaders.append("set-cookie", value);
        }
        return this;
    }
    /** Iterate over the cookie keys and values that are present in the
     * {@linkcode Request}. This is an alias of the `[Symbol.iterator]` method
     * present on the class. */
    entries() {
        return this[Symbol.iterator]();
    }
    /** Iterate over the cookie keys that are present in the
     * {@linkcode Request}. */
    *keys() {
        for (const [key] of this) {
            yield key;
        }
    }
    /** Iterate over the cookie values that are present in the
     * {@linkcode Request}. */
    *values() {
        for (const [, value] of this) {
            yield value;
        }
    }
    /** Iterate over the cookie keys and values that are present in the
     * {@linkcode Request}. */
    *[Symbol.iterator]() {
        const keys = this[requestKeys]();
        for (const key of keys) {
            const value = this.get(key);
            if (value) {
                yield [key, value];
            }
        }
    }
}
/** Provides an way to manage cookies in a request and response on the server
 * as a single iterable collection, as well as the ability to sign and verify
 * cookies to prevent tampering.
 *
 * The methods and properties align to {@linkcode Map}, but due to the need to
 * support asynchronous cryptographic keys, all the APIs operate async. When
 * constructing a {@linkcode Request} or {@linkcode Headers} from the request
 * need to be provided, as well as optionally the {@linkcode Response} or
 * `Headers` for the response can be provided. Alternatively the
 * {@linkcode mergeHeaders} function can be used to generate a final set
 * of headers for sending in the response.
 *
 * On construction, the optional set of keys implementing the
 * {@linkcode KeyRing} interface. While it is optional, if you don't plan to use
 * keys, you might want to consider using just the {@linkcode CookieMap}.
 *
 * @example
 */
export class SecureCookieMap extends CookieMapBase {
    #keyRing;
    /** Is set to a promise which resolves with the number of cookies in the
     * {@linkcode Request}. */
    get size() {
        return (async () => {
            let size = 0;
            for await (const _ of this) {
                size++;
            }
            return size;
        })();
    }
    constructor(request, options = {}) {
        super(request, options);
        const { keys } = options;
        this.#keyRing = keys;
    }
    /** Sets all cookies in the {@linkcode Request} to be deleted in the
     * response. */
    async clear(options) {
        for await (const key of this.keys()) {
            await this.set(key, null, options);
        }
    }
    /** Set a cookie to be deleted in the response.
     *
     * This is a convenience function for `set(key, null, options?)`. */
    async delete(key, options = {}) {
        await this.set(key, null, options);
        return true;
    }
    /** Get the value of a cookie from the {@linkcode Request}.
     *
     * If the cookie is signed, and the signature is invalid, `undefined` will be
     * returned and the cookie will be set to be deleted in the response. If the
     * cookie is using an "old" key from the keyring, the cookie will be re-signed
     * with the current key and be added to the response to be updated. */
    async get(key, options = {}) {
        const signed = options.signed ?? !!this.#keyRing;
        const nameSig = `${key}.sig`;
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return;
        }
        const match = header.match(getPattern(key));
        if (!match) {
            return;
        }
        const [, value] = match;
        if (!signed) {
            return value;
        }
        const digest = await this.get(nameSig, { signed: false });
        if (!digest) {
            return;
        }
        const data = `${key}=${value}`;
        if (!this.#keyRing) {
            throw new TypeError("key ring required for signed cookies");
        }
        const index = await this.#keyRing.indexOf(data, digest);
        if (index < 0) {
            await this.delete(nameSig, { path: "/", signed: false });
        }
        else {
            if (index) {
                await this.set(nameSig, await this.#keyRing.sign(data), {
                    signed: false,
                });
            }
            return value;
        }
    }
    /** Returns `true` if the key is in the {@linkcode Request}.
     *
     * If the cookie is signed, and the signature is invalid, `false` will be
     * returned and the cookie will be set to be deleted in the response. If the
     * cookie is using an "old" key from the keyring, the cookie will be re-signed
     * with the current key and be added to the response to be updated. */
    async has(key, options = {}) {
        const signed = options.signed ?? !!this.#keyRing;
        const nameSig = `${key}.sig`;
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return false;
        }
        const match = header.match(getPattern(key));
        if (!match) {
            return false;
        }
        if (!signed) {
            return true;
        }
        const digest = await this.get(nameSig, { signed: false });
        if (!digest) {
            return false;
        }
        const [, value] = match;
        const data = `${key}=${value}`;
        if (!this.#keyRing) {
            throw new TypeError("key ring required for signed cookies");
        }
        const index = await this.#keyRing.indexOf(data, digest);
        if (index < 0) {
            await this.delete(nameSig, { path: "/", signed: false });
            return false;
        }
        else {
            if (index) {
                await this.set(nameSig, await this.#keyRing.sign(data), {
                    signed: false,
                });
            }
            return true;
        }
    }
    /** Set a cookie in the response headers.
     *
     * If there was a keyring set, cookies will be automatically signed, unless
     * overridden by the passed options. Cookies can be deleted by setting the
     * value to `null`. */
    async set(key, value, options = {}) {
        const resHeaders = this[responseHeaders];
        const headers = [];
        for (const [key, value] of resHeaders.entries()) {
            if (key === "set-cookie") {
                headers.push(value);
            }
        }
        const secure = this[isSecure];
        const signed = options.signed ?? !!this.#keyRing;
        if (!secure && options.secure && !options.ignoreInsecure) {
            throw new TypeError("Cannot send secure cookie over unencrypted connection.");
        }
        const cookie = new Cookie(key, value, options);
        cookie.secure = options.secure ?? secure;
        pushCookie(headers, cookie);
        if (signed) {
            if (!this.#keyRing) {
                throw new TypeError("keys required for signed cookies.");
            }
            cookie.value = await this.#keyRing.sign(cookie.toString());
            cookie.name += ".sig";
            pushCookie(headers, cookie);
        }
        resHeaders.delete("set-cookie");
        for (const header of headers) {
            resHeaders.append("set-cookie", header);
        }
        return this;
    }
    /** Iterate over the {@linkcode Request} cookies, yielding up a tuple
     * containing the key and value of each cookie.
     *
     * If a key ring was provided, only properly signed cookie keys and values are
     * returned. */
    entries() {
        return this[Symbol.asyncIterator]();
    }
    /** Iterate over the request's cookies, yielding up the key of each cookie.
     *
     * If a keyring was provided, only properly signed cookie keys are
     * returned. */
    async *keys() {
        for await (const [key] of this) {
            yield key;
        }
    }
    /** Iterate over the request's cookies, yielding up the value of each cookie.
     *
     * If a keyring was provided, only properly signed cookie values are
     * returned. */
    async *values() {
        for await (const [, value] of this) {
            yield value;
        }
    }
    /** Iterate over the {@linkcode Request} cookies, yielding up a tuple
     * containing the key and value of each cookie.
     *
     * If a key ring was provided, only properly signed cookie keys and values are
     * returned. */
    async *[Symbol.asyncIterator]() {
        const keys = this[requestKeys]();
        for (const key of keys) {
            const value = await this.get(key);
            if (value) {
                yield [key, value];
            }
        }
    }
}
