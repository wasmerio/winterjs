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
import { nextTick } from "./_next_tick";
import { customPromisifyArgs } from "./internal/util.mjs";
import {
  validateBoolean,
  validateFunction,
  validateNumber,
  validateOneOf,
  validateString,
} from "./internal/validators.mjs";
import { isIP } from "./internal/net";
import {
  emitInvalidHostnameWarning,
  getDefaultResolver,
  getDefaultVerbatim,
  isFamily,
  isLookupCallback,
  isLookupOptions,
  isResolveCallback,
  Resolver as CallbackResolver,
  setDefaultResolver,
  setDefaultResultOrder,
  validateHints,
} from "./internal/dns/utils";
import promisesBase from "./internal/dns/promises";
import {
  dnsException,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
} from "./internal/errors";
import {
  AI_ADDRCONFIG as ADDRCONFIG,
  AI_ALL as ALL,
  AI_V4MAPPED as V4MAPPED,
} from "./internal_binding/ares";
import {
  getaddrinfo,
  GetAddrInfoReqWrap,
  QueryReqWrap,
} from "./internal_binding/cares_wrap";
import { toASCII } from "./internal/idna";
import { notImplemented } from "./_utils";
function onlookup(err, addresses) {
  if (err) {
    return this.callback(dnsException(err, "getaddrinfo", this.hostname));
  }
  this.callback(null, addresses[0], this.family || isIP(addresses[0]));
}
function onlookupall(err, addresses) {
  if (err) {
    return this.callback(dnsException(err, "getaddrinfo", this.hostname));
  }
  const family = this.family;
  const parsedAddresses = [];
  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    parsedAddresses[i] = {
      address: addr,
      family: family || isIP(addr),
    };
  }
  this.callback(null, parsedAddresses);
}
const validFamilies = [0, 4, 6];
export function lookup(hostname, options, callback) {
  let hints = 0;
  let family = 0;
  let all = false;
  let verbatim = getDefaultVerbatim();
  // Parse arguments
  if (hostname) {
    validateString(hostname, "hostname");
  }
  if (isLookupCallback(options)) {
    callback = options;
    family = 0;
  } else if (isFamily(options)) {
    validateFunction(callback, "callback");
    validateOneOf(options, "family", validFamilies);
    family = options;
  } else if (!isLookupOptions(options)) {
    validateFunction(arguments.length === 2 ? options : callback, "callback");
    throw new ERR_INVALID_ARG_TYPE("options", ["integer", "object"], options);
  } else {
    validateFunction(callback, "callback");
    if (options?.hints != null) {
      validateNumber(options.hints, "options.hints");
      hints = options.hints >>> 0;
      validateHints(hints);
    }
    if (options?.family != null) {
      validateOneOf(options.family, "options.family", validFamilies);
      family = options.family;
    }
    if (options?.all != null) {
      validateBoolean(options.all, "options.all");
      all = options.all;
    }
    if (options?.verbatim != null) {
      validateBoolean(options.verbatim, "options.verbatim");
      verbatim = options.verbatim;
    }
  }
  if (!hostname) {
    emitInvalidHostnameWarning(hostname);
    if (all) {
      nextTick(callback, null, []);
    } else {
      nextTick(callback, null, null, family === 6 ? 6 : 4);
    }
    return {};
  }
  const matchedFamily = isIP(hostname);
  if (matchedFamily) {
    if (all) {
      nextTick(callback, null, [{ address: hostname, family: matchedFamily }]);
    } else {
      nextTick(callback, null, hostname, matchedFamily);
    }
    return {};
  }
  const req = new GetAddrInfoReqWrap();
  req.callback = callback;
  req.family = family;
  req.hostname = hostname;
  req.oncomplete = all ? onlookupall : onlookup;
  const err = getaddrinfo(req, toASCII(hostname), family, hints, verbatim);
  if (err) {
    nextTick(callback, dnsException(err, "getaddrinfo", hostname));
    return {};
  }
  return req;
}
Object.defineProperty(lookup, customPromisifyArgs, {
  value: ["address", "family"],
  enumerable: false,
});
function onresolve(err, records, ttls) {
  if (err) {
    this.callback(dnsException(err, this.bindingName, this.hostname));
    return;
  }
  const parsedRecords =
    ttls && this.ttl
      ? records.map((address, index) => ({
          address,
          ttl: ttls[index],
        }))
      : records;
  this.callback(null, parsedRecords);
}
function resolver(bindingName) {
  function query(name, options, callback) {
    if (isResolveCallback(options)) {
      callback = options;
      options = {};
    }
    validateString(name, "name");
    validateFunction(callback, "callback");
    const req = new QueryReqWrap();
    req.bindingName = bindingName;
    req.callback = callback;
    req.hostname = name;
    req.oncomplete = onresolve;
    if (options && options.ttl) {
      notImplemented("dns.resolve* with ttl option");
    }
    req.ttl = !!(options && options.ttl);
    const err = this._handle[bindingName](req, toASCII(name));
    if (err) {
      throw dnsException(err, bindingName, name);
    }
    return req;
  }
  Object.defineProperty(query, "name", { value: bindingName });
  return query;
}
const resolveMap = Object.create(null);
export class Resolver extends CallbackResolver {
  constructor(options) {
    super(options);
  }
}
Resolver.prototype.resolveAny = resolveMap.ANY = resolver("queryAny");
Resolver.prototype.resolve4 = resolveMap.A = resolver("queryA");
Resolver.prototype.resolve6 = resolveMap.AAAA = resolver("queryAaaa");
Resolver.prototype.resolveCaa = resolveMap.CAA = resolver("queryCaa");
Resolver.prototype.resolveCname = resolveMap.CNAME = resolver("queryCname");
Resolver.prototype.resolveMx = resolveMap.MX = resolver("queryMx");
Resolver.prototype.resolveNs = resolveMap.NS = resolver("queryNs");
Resolver.prototype.resolveTxt = resolveMap.TXT = resolver("queryTxt");
Resolver.prototype.resolveSrv = resolveMap.SRV = resolver("querySrv");
Resolver.prototype.resolvePtr = resolveMap.PTR = resolver("queryPtr");
Resolver.prototype.resolveNaptr = resolveMap.NAPTR = resolver("queryNaptr");
Resolver.prototype.resolveSoa = resolveMap.SOA = resolver("querySoa");
Resolver.prototype.reverse = resolver("getHostByAddr");
Resolver.prototype.resolve = _resolve;
function _resolve(hostname, rrtype, callback) {
  let resolver;
  if (typeof hostname !== "string") {
    throw new ERR_INVALID_ARG_TYPE("name", "string", hostname);
  }
  if (typeof rrtype === "string") {
    resolver = resolveMap[rrtype];
  } else if (typeof rrtype === "function") {
    resolver = resolveMap.A;
    callback = rrtype;
  } else {
    throw new ERR_INVALID_ARG_TYPE("rrtype", "string", rrtype);
  }
  if (typeof resolver === "function") {
    return Reflect.apply(resolver, this, [hostname, callback]);
  }
  throw new ERR_INVALID_ARG_VALUE("rrtype", rrtype);
}
/**
 * Sets the IP address and port of servers to be used when performing DNS
 * resolution. The `servers` argument is an array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted
 * addresses. If the port is the IANA default DNS port (53) it can be omitted.
 *
 * ```js
 * dns.setServers([
 *   '4.4.4.4',
 *   '[2001:4860:4860::8888]',
 *   '4.4.4.4:1053',
 *   '[2001:4860:4860::8888]:1053',
 * ]);
 * ```
 *
 * An error will be thrown if an invalid address is provided.
 *
 * The `dns.setServers()` method must not be called while a DNS query is in
 * progress.
 *
 * The `setServers` method affects only `resolve`,`dns.resolve*()` and `reverse` (and specifically _not_ `lookup`).
 *
 * This method works much like [resolve.conf](https://man7.org/linux/man-pages/man5/resolv.conf.5.html).
 * That is, if attempting to resolve with the first server provided results in a
 * `NOTFOUND` error, the `resolve()` method will _not_ attempt to resolve with
 * subsequent servers provided. Fallback DNS servers will only be used if the
 * earlier ones time out or result in some other error.
 *
 * @param servers array of `RFC 5952` formatted addresses
 */
export function setServers(servers) {
  const resolver = new Resolver();
  resolver.setServers(servers);
  setDefaultResolver(resolver);
}
// The Node implementation uses `bindDefaultResolver` to set the follow methods
// on `module.exports` bound to the current `defaultResolver`. We don't have
// the same ability in ESM but can simulate this (at some cost) by explicitly
// exporting these methods which dynamically bind to the default resolver when
// called.
/**
 * Returns an array of IP address strings, formatted according to [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6),
 * that are currently configured for DNS resolution. A string will include a port
 * section if a custom port is used.
 *
 * ```js
 * [
 *   '4.4.4.4',
 *   '2001:4860:4860::8888',
 *   '4.4.4.4:1053',
 *   '[2001:4860:4860::8888]:1053',
 * ]
 * ```
 */
export function getServers() {
  return Resolver.prototype.getServers.bind(getDefaultResolver())();
}
export function resolveAny(...args) {
  return Resolver.prototype.resolveAny.bind(getDefaultResolver())(...args);
}
export function resolve4(hostname, options, callback) {
  return Resolver.prototype.resolve4.bind(getDefaultResolver())(
    hostname,
    options,
    callback
  );
}
export function resolve6(hostname, options, callback) {
  return Resolver.prototype.resolve6.bind(getDefaultResolver())(
    hostname,
    options,
    callback
  );
}
export function resolveCaa(...args) {
  return Resolver.prototype.resolveCaa.bind(getDefaultResolver())(...args);
}
export function resolveCname(...args) {
  return Resolver.prototype.resolveCname.bind(getDefaultResolver())(...args);
}
export function resolveMx(...args) {
  return Resolver.prototype.resolveMx.bind(getDefaultResolver())(...args);
}
export function resolveNs(...args) {
  return Resolver.prototype.resolveNs.bind(getDefaultResolver())(...args);
}
export function resolveTxt(...args) {
  return Resolver.prototype.resolveTxt.bind(getDefaultResolver())(...args);
}
export function resolveSrv(...args) {
  return Resolver.prototype.resolveSrv.bind(getDefaultResolver())(...args);
}
export function resolvePtr(...args) {
  return Resolver.prototype.resolvePtr.bind(getDefaultResolver())(...args);
}
export function resolveNaptr(...args) {
  return Resolver.prototype.resolveNaptr.bind(getDefaultResolver())(...args);
}
export function resolveSoa(...args) {
  return Resolver.prototype.resolveSoa.bind(getDefaultResolver())(...args);
}
export function reverse(...args) {
  return Resolver.prototype.reverse.bind(getDefaultResolver())(...args);
}
export function resolve(hostname, rrtype, callback) {
  return Resolver.prototype.resolve.bind(getDefaultResolver())(
    hostname,
    rrtype,
    callback
  );
}
// ERROR CODES
export const NODATA = "ENODATA";
export const FORMERR = "EFORMERR";
export const SERVFAIL = "ESERVFAIL";
export const NOTFOUND = "ENOTFOUND";
export const NOTIMP = "ENOTIMP";
export const REFUSED = "EREFUSED";
export const BADQUERY = "EBADQUERY";
export const BADNAME = "EBADNAME";
export const BADFAMILY = "EBADFAMILY";
export const BADRESP = "EBADRESP";
export const CONNREFUSED = "ECONNREFUSED";
export const TIMEOUT = "ETIMEOUT";
export const EOF = "EOF";
export const FILE = "EFILE";
export const NOMEM = "ENOMEM";
export const DESTRUCTION = "EDESTRUCTION";
export const BADSTR = "EBADSTR";
export const BADFLAGS = "EBADFLAGS";
export const NONAME = "ENONAME";
export const BADHINTS = "EBADHINTS";
export const NOTINITIALIZED = "ENOTINITIALIZED";
export const LOADIPHLPAPI = "ELOADIPHLPAPI";
export const ADDRGETNETWORKPARAMS = "EADDRGETNETWORKPARAMS";
export const CANCELLED = "ECANCELLED";
const promises = {
  ...promisesBase,
  setDefaultResultOrder,
  setServers,
  // ERROR CODES
  NODATA,
  FORMERR,
  SERVFAIL,
  NOTFOUND,
  NOTIMP,
  REFUSED,
  BADQUERY,
  BADNAME,
  BADFAMILY,
  BADRESP,
  CONNREFUSED,
  TIMEOUT,
  EOF,
  FILE,
  NOMEM,
  DESTRUCTION,
  BADSTR,
  BADFLAGS,
  NONAME,
  BADHINTS,
  NOTINITIALIZED,
  LOADIPHLPAPI,
  ADDRGETNETWORKPARAMS,
  CANCELLED,
};
export { ADDRCONFIG, ALL, promises, setDefaultResultOrder, V4MAPPED };
export default {
  ADDRCONFIG,
  ALL,
  V4MAPPED,
  lookup,
  getServers,
  resolveAny,
  resolve4,
  resolve6,
  resolveCaa,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveTxt,
  resolveSrv,
  resolvePtr,
  resolveNaptr,
  resolveSoa,
  resolve,
  Resolver,
  reverse,
  setServers,
  setDefaultResultOrder,
  promises,
  NODATA,
  FORMERR,
  SERVFAIL,
  NOTFOUND,
  NOTIMP,
  REFUSED,
  BADQUERY,
  BADNAME,
  BADFAMILY,
  BADRESP,
  CONNREFUSED,
  TIMEOUT,
  EOF,
  FILE,
  NOMEM,
  DESTRUCTION,
  BADSTR,
  BADFLAGS,
  NONAME,
  BADHINTS,
  NOTINITIALIZED,
  LOADIPHLPAPI,
  ADDRGETNETWORKPARAMS,
  CANCELLED,
};
