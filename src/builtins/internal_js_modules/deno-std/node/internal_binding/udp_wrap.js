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
import { AsyncWrap, providerType } from "./async_wrap";
import { HandleWrap } from "./handle_wrap";
import { ownerSymbol } from "./symbols";
import { codeMap, errorMap } from "./uv";
import { notImplemented } from "../_utils";
import { Buffer } from "../buffer";
import { isIP } from "../internal/net";
import { isLinux, isWindows } from "../../_util/os";
// @ts-ignore Deno[Deno.internal] is used on purpose here
const DenoListenDatagram =
  Deno[Deno.internal]?.nodeUnstable?.listenDatagram || Deno.listenDatagram;
const AF_INET = 2;
const AF_INET6 = 10;
const UDP_DGRAM_MAXSIZE = 64 * 1024;
export class SendWrap extends AsyncWrap {
  list;
  address;
  port;
  callback;
  oncomplete;
  constructor() {
    super(providerType.UDPSENDWRAP);
  }
}
export class UDP extends HandleWrap {
  [ownerSymbol] = null;
  #address;
  #family;
  #port;
  #remoteAddress;
  #remoteFamily;
  #remotePort;
  #listener;
  #receiving = false;
  #recvBufferSize = UDP_DGRAM_MAXSIZE;
  #sendBufferSize = UDP_DGRAM_MAXSIZE;
  onmessage;
  lookup;
  constructor() {
    super(providerType.UDPWRAP);
  }
  addMembership(_multicastAddress, _interfaceAddress) {
    notImplemented("udp.UDP.prototype.addMembership");
  }
  addSourceSpecificMembership(
    _sourceAddress,
    _groupAddress,
    _interfaceAddress
  ) {
    notImplemented("udp.UDP.prototype.addSourceSpecificMembership");
  }
  /**
   * Bind to an IPv4 address.
   * @param ip The hostname to bind to.
   * @param port The port to bind to
   * @return An error status code.
   */
  bind(ip, port, flags) {
    return this.#doBind(ip, port, flags, AF_INET);
  }
  /**
   * Bind to an IPv6 address.
   * @param ip The hostname to bind to.
   * @param port The port to bind to
   * @return An error status code.
   */
  bind6(ip, port, flags) {
    return this.#doBind(ip, port, flags, AF_INET6);
  }
  bufferSize(size, buffer, ctx) {
    let err;
    if (size > UDP_DGRAM_MAXSIZE) {
      err = "EINVAL";
    } else if (!this.#address) {
      err = isWindows ? "ENOTSOCK" : "EBADF";
    }
    if (err) {
      ctx.errno = codeMap.get(err);
      ctx.code = err;
      ctx.message = errorMap.get(ctx.errno)[1];
      ctx.syscall = buffer ? "uv_recv_buffer_size" : "uv_send_buffer_size";
      return;
    }
    if (size !== 0) {
      size = isLinux ? size * 2 : size;
      if (buffer) {
        return (this.#recvBufferSize = size);
      }
      return (this.#sendBufferSize = size);
    }
    return buffer ? this.#recvBufferSize : this.#sendBufferSize;
  }
  connect(ip, port) {
    return this.#doConnect(ip, port, AF_INET);
  }
  connect6(ip, port) {
    return this.#doConnect(ip, port, AF_INET6);
  }
  disconnect() {
    this.#remoteAddress = undefined;
    this.#remotePort = undefined;
    this.#remoteFamily = undefined;
    return 0;
  }
  dropMembership(_multicastAddress, _interfaceAddress) {
    notImplemented("udp.UDP.prototype.dropMembership");
  }
  dropSourceSpecificMembership(
    _sourceAddress,
    _groupAddress,
    _interfaceAddress
  ) {
    notImplemented("udp.UDP.prototype.dropSourceSpecificMembership");
  }
  /**
   * Populates the provided object with remote address entries.
   * @param peername An object to add the remote address entries to.
   * @return An error status code.
   */
  getpeername(peername) {
    if (this.#remoteAddress === undefined) {
      return codeMap.get("EBADF");
    }
    peername.address = this.#remoteAddress;
    peername.port = this.#remotePort;
    peername.family = this.#remoteFamily;
    return 0;
  }
  /**
   * Populates the provided object with local address entries.
   * @param sockname An object to add the local address entries to.
   * @return An error status code.
   */
  getsockname(sockname) {
    if (this.#address === undefined) {
      return codeMap.get("EBADF");
    }
    sockname.address = this.#address;
    sockname.port = this.#port;
    sockname.family = this.#family;
    return 0;
  }
  /**
   * Opens a file descriptor.
   * @param fd The file descriptor to open.
   * @return An error status code.
   */
  open(_fd) {
    // REF: https://github.com/denoland/deno/issues/6529
    notImplemented("udp.UDP.prototype.open");
  }
  /**
   * Start receiving on the connection.
   * @return An error status code.
   */
  recvStart() {
    if (!this.#receiving) {
      this.#receiving = true;
      this.#receive();
    }
    return 0;
  }
  /**
   * Stop receiving on the connection.
   * @return An error status code.
   */
  recvStop() {
    this.#receiving = false;
    return 0;
  }
  ref() {
    notImplemented("udp.UDP.prototype.ref");
  }
  send(req, bufs, count, ...args) {
    return this.#doSend(req, bufs, count, args, AF_INET);
  }
  send6(req, bufs, count, ...args) {
    return this.#doSend(req, bufs, count, args, AF_INET6);
  }
  setBroadcast(_bool) {
    notImplemented("udp.UDP.prototype.setBroadcast");
  }
  setMulticastInterface(_interfaceAddress) {
    notImplemented("udp.UDP.prototype.setMulticastInterface");
  }
  setMulticastLoopback(_bool) {
    notImplemented("udp.UDP.prototype.setMulticastLoopback");
  }
  setMulticastTTL(_ttl) {
    notImplemented("udp.UDP.prototype.setMulticastTTL");
  }
  setTTL(_ttl) {
    notImplemented("udp.UDP.prototype.setTTL");
  }
  unref() {
    notImplemented("udp.UDP.prototype.unref");
  }
  #doBind(ip, port, _flags, family) {
    // TODO(cmorten): use flags to inform socket reuse etc.
    const listenOptions = {
      port,
      hostname: ip,
      transport: "udp",
    };
    let listener;
    try {
      listener = DenoListenDatagram(listenOptions);
    } catch (e) {
      if (e instanceof Deno.errors.AddrInUse) {
        return codeMap.get("EADDRINUSE");
      } else if (e instanceof Deno.errors.AddrNotAvailable) {
        return codeMap.get("EADDRNOTAVAIL");
      } else if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
      }
      // TODO(cmorten): map errors to appropriate error codes.
      return codeMap.get("UNKNOWN");
    }
    const address = listener.addr;
    this.#address = address.hostname;
    this.#port = address.port;
    this.#family = family === AF_INET6 ? "IPv6" : "IPv4";
    this.#listener = listener;
    return 0;
  }
  #doConnect(ip, port, family) {
    this.#remoteAddress = ip;
    this.#remotePort = port;
    this.#remoteFamily = family === AF_INET6 ? "IPv6" : "IPv4";
    return 0;
  }
  #doSend(req, bufs, _count, args, _family) {
    let hasCallback;
    if (args.length === 3) {
      this.#remotePort = args[0];
      this.#remoteAddress = args[1];
      hasCallback = args[2];
    } else {
      hasCallback = args[0];
    }
    const addr = {
      hostname: this.#remoteAddress,
      port: this.#remotePort,
      transport: "udp",
    };
    // Deno.DatagramConn.prototype.send accepts only one Uint8Array
    const payload = new Uint8Array(
      Buffer.concat(
        bufs.map((buf) => {
          if (typeof buf === "string") {
            return Buffer.from(buf);
          }
          return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
        })
      )
    );
    (async () => {
      let sent;
      let err = null;
      try {
        sent = await this.#listener.send(payload, addr);
      } catch (e) {
        // TODO(cmorten): map errors to appropriate error codes.
        if (e instanceof Deno.errors.BadResource) {
          err = codeMap.get("EBADF");
        } else if (
          e instanceof Error &&
          e.message.match(/os error (40|90|10040)/)
        ) {
          err = codeMap.get("EMSGSIZE");
        } else {
          err = codeMap.get("UNKNOWN");
        }
        sent = 0;
      }
      if (hasCallback) {
        try {
          req.oncomplete(err, sent);
        } catch {
          // swallow callback errors
        }
      }
    })();
    return 0;
  }
  async #receive() {
    if (!this.#receiving) {
      return;
    }
    const p = new Uint8Array(this.#recvBufferSize);
    let buf;
    let remoteAddr;
    let nread;
    try {
      [buf, remoteAddr] = await this.#listener.receive(p);
      nread = buf.length;
    } catch (e) {
      // TODO(cmorten): map errors to appropriate error codes.
      if (
        e instanceof Deno.errors.Interrupted ||
        e instanceof Deno.errors.BadResource
      ) {
        nread = 0;
      } else {
        nread = codeMap.get("UNKNOWN");
      }
      buf = new Uint8Array(0);
      remoteAddr = null;
    }
    nread ??= 0;
    const rinfo = remoteAddr
      ? {
          address: remoteAddr.hostname,
          port: remoteAddr.port,
          family: isIP(remoteAddr.hostname) === 6 ? "IPv6" : "IPv4",
        }
      : undefined;
    try {
      this.onmessage(nread, this, Buffer.from(buf), rinfo);
    } catch {
      // swallow callback errors.
    }
    this.#receive();
  }
  /** Handle socket closure. */
  _onClose() {
    this.#receiving = false;
    this.#address = undefined;
    this.#port = undefined;
    this.#family = undefined;
    try {
      this.#listener.close();
    } catch {
      // listener already closed
    }
    this.#listener = undefined;
    return 0;
  }
}
