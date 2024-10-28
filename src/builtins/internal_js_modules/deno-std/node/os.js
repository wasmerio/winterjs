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
import { notImplemented } from "./_utils";
import { validateIntegerRange } from "./_utils";
import { EOL as fsEOL } from "../fs/eol";
import process from "./process";
import { isWindows, osType } from "../_util/os";
import { os } from "./internal_binding/constants";
export const constants = os;
const SEE_GITHUB_ISSUE = "See https://github.com/denoland/deno_std/issues/1436";
// @ts-ignore Deno[Deno.internal] is used on purpose here
const DenoOsUptime =
  Deno[Deno.internal]?.nodeUnstable?.osUptime || Deno.osUptime;
export function arch() {
  return process.arch;
}
// deno-lint-ignore no-explicit-any
arch[Symbol.toPrimitive] = () => process.arch;
// deno-lint-ignore no-explicit-any
endianness[Symbol.toPrimitive] = () => endianness();
// deno-lint-ignore no-explicit-any
freemem[Symbol.toPrimitive] = () => freemem();
// deno-lint-ignore no-explicit-any
homedir[Symbol.toPrimitive] = () => homedir();
// deno-lint-ignore no-explicit-any
hostname[Symbol.toPrimitive] = () => hostname();
// deno-lint-ignore no-explicit-any
platform[Symbol.toPrimitive] = () => platform();
// deno-lint-ignore no-explicit-any
release[Symbol.toPrimitive] = () => release();
// deno-lint-ignore no-explicit-any
version[Symbol.toPrimitive] = () => version();
// deno-lint-ignore no-explicit-any
totalmem[Symbol.toPrimitive] = () => totalmem();
// deno-lint-ignore no-explicit-any
type[Symbol.toPrimitive] = () => type();
// deno-lint-ignore no-explicit-any
uptime[Symbol.toPrimitive] = () => uptime();
export function cpus() {
  return Array.from(Array(navigator.hardwareConcurrency)).map(() => {
    return {
      model: "",
      speed: 0,
      times: {
        user: 0,
        nice: 0,
        sys: 0,
        idle: 0,
        irq: 0,
      },
    };
  });
}
/**
 * Returns a string identifying the endianness of the CPU for which the Deno
 * binary was compiled. Possible values are 'BE' for big endian and 'LE' for
 * little endian.
 */
export function endianness() {
  // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#Endianness
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  // Int16Array uses the platform's endianness.
  return new Int16Array(buffer)[0] === 256 ? "LE" : "BE";
}
/** Return free memory amount */
export function freemem() {
  return Deno.systemMemoryInfo().free;
}
/** Not yet implemented */
export function getPriority(pid = 0) {
  validateIntegerRange(pid, "pid");
  notImplemented(SEE_GITHUB_ISSUE);
}
/** Returns the string path of the current user's home directory. */
export function homedir() {
  // Note: Node/libuv calls getpwuid() / GetUserProfileDirectory() when the
  // environment variable isn't set but that's the (very uncommon) fallback
  // path. IMO, it's okay to punt on that for now.
  switch (osType) {
    case "windows":
      return Deno.env.get("USERPROFILE") || null;
    case "linux":
    case "darwin":
    case "freebsd":
      return Deno.env.get("HOME") || null;
    default:
      throw Error("unreachable");
  }
}
/** Returns the host name of the operating system as a string. */
export function hostname() {
  return Deno.hostname();
}
/** Returns an array containing the 1, 5, and 15 minute load averages */
export function loadavg() {
  if (isWindows) {
    return [0, 0, 0];
  }
  return Deno.loadavg();
}
/** Returns an object containing network interfaces that have been assigned a network address.
 * Each key on the returned object identifies a network interface. The associated value is an array of objects that each describe an assigned network address. */
export function networkInterfaces() {
  const interfaces = {};
  for (const {
    name,
    address,
    netmask,
    family,
    mac,
    scopeid,
    cidr,
  } of Deno.networkInterfaces()) {
    const addresses = (interfaces[name] ||= []);
    const networkAddress = {
      address,
      netmask,
      family,
      mac,
      internal:
        (family === "IPv4" && isIPv4LoopbackAddr(address)) ||
        (family === "IPv6" && isIPv6LoopbackAddr(address)),
      cidr,
    };
    if (family === "IPv6") {
      networkAddress.scopeid = scopeid;
    }
    addresses.push(networkAddress);
  }
  return interfaces;
}
function isIPv4LoopbackAddr(addr) {
  return addr.startsWith("127");
}
function isIPv6LoopbackAddr(addr) {
  return addr === "::1" || addr === "fe80::1";
}
/** Returns the a string identifying the operating system platform. The value is set at compile time. Possible values are 'darwin', 'linux', and 'win32'. */
export function platform() {
  return process.platform;
}
/** Returns the operating system as a string */
export function release() {
  return Deno.osRelease();
}
/** Returns a string identifying the kernel version */
export function version() {
  // TODO(kt3k): Temporarily uses Deno.osRelease().
  // Revisit this if this implementation is insufficient for any npm module
  return Deno.osRelease();
}
/** Not yet implemented */
export function setPriority(pid, priority) {
  /* The node API has the 'pid' as the first parameter and as optional.
         This makes for a problematic implementation in Typescript. */
  if (priority === undefined) {
    priority = pid;
    pid = 0;
  }
  validateIntegerRange(pid, "pid");
  validateIntegerRange(priority, "priority", -20, 19);
  notImplemented(SEE_GITHUB_ISSUE);
}
/** Returns the operating system's default directory for temporary files as a string. */
export function tmpdir() {
  /* This follows the node js implementation, but has a few
       differences:
       * On windows, if none of the environment variables are defined,
         we return null.
       * On unix we use a plain Deno.env.get, instead of safeGetenv,
         which special cases setuid binaries.
       * Node removes a single trailing / or \, we remove all.
    */
  if (isWindows) {
    const temp = Deno.env.get("TEMP") || Deno.env.get("TMP");
    if (temp) {
      return temp.replace(/(?<!:)[/\\]*$/, "");
    }
    const base = Deno.env.get("SYSTEMROOT") || Deno.env.get("WINDIR");
    if (base) {
      return base + "\\temp";
    }
    return null;
  } else {
    // !isWindows
    const temp =
      Deno.env.get("TMPDIR") ||
      Deno.env.get("TMP") ||
      Deno.env.get("TEMP") ||
      "/tmp";
    return temp.replace(/(?<!^)\/*$/, "");
  }
}
/** Return total physical memory amount */
export function totalmem() {
  return Deno.systemMemoryInfo().total;
}
/** Returns operating system type (i.e. 'Windows_NT', 'Linux', 'Darwin') */
export function type() {
  switch (Deno.build.os) {
    case "windows":
      return "Windows_NT";
    case "linux":
      return "Linux";
    case "darwin":
      return "Darwin";
    case "freebsd":
      return "FreeBSD";
    default:
      throw Error("unreachable");
  }
}
/** Returns the Operating System uptime in number of seconds. */
export function uptime() {
  return DenoOsUptime();
}
/** Not yet implemented */
export function userInfo(
  // deno-lint-ignore no-unused-vars
  options = { encoding: "utf-8" }
) {
  notImplemented(SEE_GITHUB_ISSUE);
}
export const EOL = isWindows ? fsEOL.CRLF : fsEOL.LF;
export const devNull = isWindows ? "\\\\.\\nul" : "/dev/null";
export default {
  arch,
  cpus,
  endianness,
  freemem,
  getPriority,
  homedir,
  hostname,
  loadavg,
  networkInterfaces,
  platform,
  release,
  setPriority,
  tmpdir,
  totalmem,
  type,
  uptime,
  userInfo,
  version,
  constants,
  EOL,
  devNull,
};
