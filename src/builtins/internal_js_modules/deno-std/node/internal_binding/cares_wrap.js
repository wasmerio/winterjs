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
import { isIPv4 } from "../internal/net";
import { codeMap } from "./uv";
import { AsyncWrap, providerType } from "./async_wrap";
import { ares_strerror } from "./ares";
import { notImplemented } from "../_utils";
import { isWindows } from "../../_util/os";
export class GetAddrInfoReqWrap extends AsyncWrap {
  family;
  hostname;
  callback;
  resolve;
  reject;
  oncomplete;
  constructor() {
    super(providerType.GETADDRINFOREQWRAP);
  }
}
export function getaddrinfo(req, hostname, family, _hints, verbatim) {
  let addresses = [];
  // TODO(cmorten): use hints
  // REF: https://nodejs.org/api/dns.html#dns_supported_getaddrinfo_flags
  const recordTypes = [];
  if (family === 0 || family === 4) {
    recordTypes.push("A");
  }
  if (family === 0 || family === 6) {
    recordTypes.push("AAAA");
  }
  (async () => {
    await Promise.allSettled(
      recordTypes.map((recordType) =>
        Deno.resolveDns(hostname, recordType).then((records) => {
          records.forEach((record) => addresses.push(record));
        })
      )
    );
    const error = addresses.length ? 0 : codeMap.get("EAI_NODATA");
    // TODO(cmorten): needs work
    // REF: https://github.com/nodejs/node/blob/master/src/cares_wrap.cc#L1444
    if (!verbatim) {
      addresses.sort((a, b) => {
        if (isIPv4(a)) {
          return -1;
        } else if (isIPv4(b)) {
          return 1;
        }
        return 0;
      });
    }
    // TODO: Forces IPv4 as a workaround for Deno not
    // aligning with Node on implicit binding on Windows
    // REF: https://github.com/denoland/deno/issues/10762
    if (isWindows && hostname === "localhost") {
      addresses = addresses.filter((address) => isIPv4(address));
    }
    req.oncomplete(error, addresses);
  })();
  return 0;
}
export class QueryReqWrap extends AsyncWrap {
  bindingName;
  hostname;
  ttl;
  callback;
  // deno-lint-ignore no-explicit-any
  resolve;
  reject;
  oncomplete;
  constructor() {
    super(providerType.QUERYWRAP);
  }
}
function fqdnToHostname(fqdn) {
  return fqdn.replace(/\.$/, "");
}
function compressIPv6(address) {
  const formatted = address.replace(/\b(?:0+:){2,}/, ":");
  const finalAddress = formatted
    .split(":")
    .map((octet) => {
      if (octet.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // decimal
        return Number(octet.replaceAll(".", "")).toString(16);
      }
      return octet.replace(/\b0+/g, "");
    })
    .join(":");
  return finalAddress;
}
export class ChannelWrap extends AsyncWrap {
  #servers = [];
  #timeout;
  #tries;
  constructor(timeout, tries) {
    super(providerType.DNSCHANNEL);
    this.#timeout = timeout;
    this.#tries = tries;
  }
  async #query(query, recordType) {
    // TODO: TTL logic.
    let code;
    let ret;
    if (this.#servers.length) {
      for (const [ipAddr, port] of this.#servers) {
        const resolveOptions = {
          nameServer: {
            ipAddr,
            port,
          },
        };
        ({ code, ret } = await this.#resolve(
          query,
          recordType,
          resolveOptions
        ));
        if (code === 0 || code === codeMap.get("EAI_NODATA")) {
          break;
        }
      }
    } else {
      ({ code, ret } = await this.#resolve(query, recordType));
    }
    return { code: code, ret: ret };
  }
  async #resolve(query, recordType, resolveOptions) {
    let ret = [];
    let code = 0;
    try {
      ret = await Deno.resolveDns(query, recordType, resolveOptions);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        code = codeMap.get("EAI_NODATA");
      } else {
        // TODO(cmorten): map errors to appropriate error codes.
        code = codeMap.get("UNKNOWN");
      }
    }
    return { code, ret };
  }
  queryAny(req, name) {
    // TODO: implemented temporary measure to allow limited usage of
    // `resolveAny` like APIs.
    //
    // Ideally we move to using the "ANY" / "*" DNS query in future
    // REF: https://github.com/denoland/deno/issues/14492
    (async () => {
      const records = [];
      await Promise.allSettled([
        this.#query(name, "A").then(({ ret }) => {
          ret.forEach((record) => records.push({ type: "A", address: record }));
        }),
        this.#query(name, "AAAA").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "AAAA", address: compressIPv6(record) })
          );
        }),
        this.#query(name, "CAA").then(({ ret }) => {
          ret.forEach(({ critical, tag, value }) =>
            records.push({
              type: "CAA",
              [tag]: value,
              critical: +critical && 128,
            })
          );
        }),
        this.#query(name, "CNAME").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "CNAME", value: record })
          );
        }),
        this.#query(name, "MX").then(({ ret }) => {
          ret.forEach(({ preference, exchange }) =>
            records.push({
              type: "MX",
              priority: preference,
              exchange: fqdnToHostname(exchange),
            })
          );
        }),
        this.#query(name, "NAPTR").then(({ ret }) => {
          ret.forEach(
            ({ order, preference, flags, services, regexp, replacement }) =>
              records.push({
                type: "NAPTR",
                order,
                preference,
                flags,
                service: services,
                regexp,
                replacement,
              })
          );
        }),
        this.#query(name, "NS").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "NS", value: fqdnToHostname(record) })
          );
        }),
        this.#query(name, "PTR").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "PTR", value: fqdnToHostname(record) })
          );
        }),
        this.#query(name, "SOA").then(({ ret }) => {
          ret.forEach(
            ({ mname, rname, serial, refresh, retry, expire, minimum }) =>
              records.push({
                type: "SOA",
                nsname: fqdnToHostname(mname),
                hostmaster: fqdnToHostname(rname),
                serial,
                refresh,
                retry,
                expire,
                minttl: minimum,
              })
          );
        }),
        this.#query(name, "SRV").then(({ ret }) => {
          ret.forEach(({ priority, weight, port, target }) =>
            records.push({
              type: "SRV",
              priority,
              weight,
              port,
              name: target,
            })
          );
        }),
        this.#query(name, "TXT").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "TXT", entries: record })
          );
        }),
      ]);
      const err = records.length ? 0 : codeMap.get("EAI_NODATA");
      req.oncomplete(err, records);
    })();
    return 0;
  }
  queryA(req, name) {
    this.#query(name, "A").then(({ code, ret }) => {
      req.oncomplete(code, ret);
    });
    return 0;
  }
  queryAaaa(req, name) {
    this.#query(name, "AAAA").then(({ code, ret }) => {
      const records = ret.map((record) => compressIPv6(record));
      req.oncomplete(code, records);
    });
    return 0;
  }
  queryCaa(req, name) {
    this.#query(name, "CAA").then(({ code, ret }) => {
      const records = ret.map(({ critical, tag, value }) => ({
        [tag]: value,
        critical: +critical && 128,
      }));
      req.oncomplete(code, records);
    });
    return 0;
  }
  queryCname(req, name) {
    this.#query(name, "CNAME").then(({ code, ret }) => {
      req.oncomplete(code, ret);
    });
    return 0;
  }
  queryMx(req, name) {
    this.#query(name, "MX").then(({ code, ret }) => {
      const records = ret.map(({ preference, exchange }) => ({
        priority: preference,
        exchange: fqdnToHostname(exchange),
      }));
      req.oncomplete(code, records);
    });
    return 0;
  }
  queryNaptr(req, name) {
    this.#query(name, "NAPTR").then(({ code, ret }) => {
      const records = ret.map(
        ({ order, preference, flags, services, regexp, replacement }) => ({
          flags,
          service: services,
          regexp,
          replacement,
          order,
          preference,
        })
      );
      req.oncomplete(code, records);
    });
    return 0;
  }
  queryNs(req, name) {
    this.#query(name, "NS").then(({ code, ret }) => {
      const records = ret.map((record) => fqdnToHostname(record));
      req.oncomplete(code, records);
    });
    return 0;
  }
  queryPtr(req, name) {
    this.#query(name, "PTR").then(({ code, ret }) => {
      const records = ret.map((record) => fqdnToHostname(record));
      req.oncomplete(code, records);
    });
    return 0;
  }
  querySoa(req, name) {
    this.#query(name, "SOA").then(({ code, ret }) => {
      let record = {};
      if (ret.length) {
        const { mname, rname, serial, refresh, retry, expire, minimum } =
          ret[0];
        record = {
          nsname: fqdnToHostname(mname),
          hostmaster: fqdnToHostname(rname),
          serial,
          refresh,
          retry,
          expire,
          minttl: minimum,
        };
      }
      req.oncomplete(code, record);
    });
    return 0;
  }
  querySrv(req, name) {
    this.#query(name, "SRV").then(({ code, ret }) => {
      const records = ret.map(({ priority, weight, port, target }) => ({
        priority,
        weight,
        port,
        name: target,
      }));
      req.oncomplete(code, records);
    });
    return 0;
  }
  queryTxt(req, name) {
    this.#query(name, "TXT").then(({ code, ret }) => {
      req.oncomplete(code, ret);
    });
    return 0;
  }
  getHostByAddr(_req, _name) {
    // TODO: https://github.com/denoland/deno/issues/14432
    notImplemented("cares.ChannelWrap.prototype.getHostByAddr");
  }
  getServers() {
    return this.#servers;
  }
  setServers(servers) {
    if (typeof servers === "string") {
      const tuples = [];
      for (let i = 0; i < servers.length; i += 2) {
        tuples.push([servers[i], parseInt(servers[i + 1])]);
      }
      this.#servers = tuples;
    } else {
      this.#servers = servers.map(([_ipVersion, ip, port]) => [ip, port]);
    }
    return 0;
  }
  setLocalAddress(_addr0, _addr1) {
    notImplemented("cares.ChannelWrap.prototype.setLocalAddress");
  }
  cancel() {
    notImplemented("cares.ChannelWrap.prototype.cancel");
  }
}
const DNS_ESETSRVPENDING = -1000;
const EMSG_ESETSRVPENDING = "There are pending queries.";
export function strerror(code) {
  return code === DNS_ESETSRVPENDING
    ? EMSG_ESETSRVPENDING
    : ares_strerror(code);
}
