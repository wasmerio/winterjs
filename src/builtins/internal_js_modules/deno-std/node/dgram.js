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
import { EventEmitter } from "./events";
import {
  ERR_BUFFER_OUT_OF_BOUNDS,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_FD_TYPE,
  ERR_MISSING_ARGS,
  ERR_SOCKET_ALREADY_BOUND,
  ERR_SOCKET_BAD_BUFFER_SIZE,
  ERR_SOCKET_BUFFER_SIZE,
  ERR_SOCKET_DGRAM_IS_CONNECTED,
  ERR_SOCKET_DGRAM_NOT_CONNECTED,
  ERR_SOCKET_DGRAM_NOT_RUNNING,
  errnoException,
  exceptionWithHostPort,
} from "./internal/errors";
import { kStateSymbol, newHandle } from "./internal/dgram";
import {
  asyncIdSymbol,
  defaultTriggerAsyncIdScope,
  ownerSymbol,
} from "./internal/async_hooks";
import { SendWrap } from "./internal_binding/udp_wrap";
import {
  isInt32,
  validateAbortSignal,
  validateNumber,
  validatePort,
  validateString,
} from "./internal/validators.mjs";
import { guessHandleType } from "./internal_binding/util";
import { os } from "./internal_binding/constants";
import { nextTick } from "./process";
import { channel } from "./diagnostics_channel";
import { isArrayBufferView } from "./internal/util/types";
const { UV_UDP_REUSEADDR, UV_UDP_IPV6ONLY } = os;
const udpSocketChannel = channel("udp.socket");
const BIND_STATE_UNBOUND = 0;
const BIND_STATE_BINDING = 1;
const BIND_STATE_BOUND = 2;
const CONNECT_STATE_DISCONNECTED = 0;
const CONNECT_STATE_CONNECTING = 1;
const CONNECT_STATE_CONNECTED = 2;
const RECV_BUFFER = true;
const SEND_BUFFER = false;
const isSocketOptions = (socketOption) =>
  socketOption !== null && typeof socketOption === "object";
const isUdpHandle = (handle) =>
  handle !== null &&
  typeof handle === "object" &&
  typeof handle.recvStart === "function";
const isBindOptions = (options) =>
  options !== null && typeof options === "object";
/**
 * Encapsulates the datagram functionality.
 *
 * New instances of `dgram.Socket` are created using `createSocket`.
 * The `new` keyword is not to be used to create `dgram.Socket` instances.
 */
export class Socket extends EventEmitter {
  [asyncIdSymbol];
  [kStateSymbol];
  type;
  constructor(type, listener) {
    super();
    let lookup;
    let recvBufferSize;
    let sendBufferSize;
    let options;
    if (isSocketOptions(type)) {
      options = type;
      type = options.type;
      lookup = options.lookup;
      recvBufferSize = options.recvBufferSize;
      sendBufferSize = options.sendBufferSize;
    }
    const handle = newHandle(type, lookup);
    handle[ownerSymbol] = this;
    this[asyncIdSymbol] = handle.getAsyncId();
    this.type = type;
    if (typeof listener === "function") {
      this.on("message", listener);
    }
    this[kStateSymbol] = {
      handle,
      receiving: false,
      bindState: BIND_STATE_UNBOUND,
      connectState: CONNECT_STATE_DISCONNECTED,
      queue: undefined,
      reuseAddr: options && options.reuseAddr, // Use UV_UDP_REUSEADDR if true.
      ipv6Only: options && options.ipv6Only,
      recvBufferSize,
      sendBufferSize,
    };
    if (options?.signal !== undefined) {
      const { signal } = options;
      validateAbortSignal(signal, "options.signal");
      const onAborted = () => {
        this.close();
      };
      if (signal.aborted) {
        onAborted();
      } else {
        signal.addEventListener("abort", onAborted);
        this.once("close", () =>
          signal.removeEventListener("abort", onAborted)
        );
      }
    }
    if (udpSocketChannel.hasSubscribers) {
      udpSocketChannel.publish({
        socket: this,
      });
    }
  }
  /**
   * Tells the kernel to join a multicast group at the given `multicastAddress`
   * and `multicastInterface` using the `IP_ADD_MEMBERSHIP` socket option. If
   * the`multicastInterface` argument is not specified, the operating system
   * will choose one interface and will add membership to it. To add membership
   * to every available interface, call `addMembership` multiple times, once
   * per interface.
   *
   * When called on an unbound socket, this method will implicitly bind to a
   * random port, listening on all interfaces.
   *
   * When sharing a UDP socket across multiple `cluster` workers, the
   * `socket.addMembership()` function must be called only once or an
   * `EADDRINUSE` error will occur:
   *
   * ```js
   * import cluster from 'cluster';
   * import dgram from 'dgram';
   *
   * if (cluster.isPrimary) {
   *   cluster.fork(); // Works ok.
   *   cluster.fork(); // Fails with EADDRINUSE.
   * } else {
   *   const s = dgram.createSocket('udp4');
   *   s.bind(1234, () => {
   *     s.addMembership('224.0.0.114');
   *   });
   * }
   * ```
   */
  addMembership(multicastAddress, interfaceAddress) {
    healthCheck(this);
    if (!multicastAddress) {
      throw new ERR_MISSING_ARGS("multicastAddress");
    }
    const { handle } = this[kStateSymbol];
    const err = handle.addMembership(multicastAddress, interfaceAddress);
    if (err) {
      throw errnoException(err, "addMembership");
    }
  }
  /**
   * Tells the kernel to join a source-specific multicast channel at the given
   * `sourceAddress` and `groupAddress`, using the `multicastInterface` with
   * the `IP_ADD_SOURCE_MEMBERSHIP` socket option. If the `multicastInterface`
   * argument is not specified, the operating system will choose one interface
   * and will add membership to it. To add membership to every available
   * interface, call `socket.addSourceSpecificMembership()` multiple times,
   * once per interface.
   *
   * When called on an unbound socket, this method will implicitly bind to a
   * random port, listening on all interfaces.
   */
  addSourceSpecificMembership(sourceAddress, groupAddress, interfaceAddress) {
    healthCheck(this);
    validateString(sourceAddress, "sourceAddress");
    validateString(groupAddress, "groupAddress");
    const err = this[kStateSymbol].handle.addSourceSpecificMembership(
      sourceAddress,
      groupAddress,
      interfaceAddress
    );
    if (err) {
      throw errnoException(err, "addSourceSpecificMembership");
    }
  }
  /**
   * Returns an object containing the address information for a socket.
   * For UDP sockets, this object will contain `address`, `family` and `port`properties.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  address() {
    healthCheck(this);
    const out = {};
    const err = this[kStateSymbol].handle.getsockname(out);
    if (err) {
      throw errnoException(err, "getsockname");
    }
    return out;
  }
  bind(port_, address_ /* callback */) {
    let port = typeof port_ === "function" ? null : port_;
    healthCheck(this);
    const state = this[kStateSymbol];
    if (state.bindState !== BIND_STATE_UNBOUND) {
      throw new ERR_SOCKET_ALREADY_BOUND();
    }
    state.bindState = BIND_STATE_BINDING;
    const cb = arguments.length && arguments[arguments.length - 1];
    if (typeof cb === "function") {
      // deno-lint-ignore no-inner-declarations
      function removeListeners() {
        this.removeListener("error", removeListeners);
        this.removeListener("listening", onListening);
      }
      // deno-lint-ignore no-inner-declarations
      function onListening() {
        removeListeners.call(this);
        cb.call(this);
      }
      this.on("error", removeListeners);
      this.on("listening", onListening);
    }
    if (isUdpHandle(port)) {
      replaceHandle(this, port);
      startListening(this);
      return this;
    }
    // Open an existing fd instead of creating a new one.
    if (isBindOptions(port) && isInt32(port.fd) && port.fd > 0) {
      const fd = port.fd;
      const state = this[kStateSymbol];
      // TODO(cmorten): here we deviate somewhat from the Node implementation which
      // makes use of the https://nodejs.org/api/cluster.html module to run servers
      // across a "cluster" of Node processes to take advantage of multi-core
      // systems.
      //
      // Though Deno has has a Worker capability from which we could simulate this,
      // for now we assert that we are _always_ on the primary process.
      const type = guessHandleType(fd);
      if (type !== "UDP") {
        throw new ERR_INVALID_FD_TYPE(type);
      }
      const err = state.handle.open(fd);
      if (err) {
        throw errnoException(err, "open");
      }
      startListening(this);
      return this;
    }
    let address;
    if (isBindOptions(port)) {
      address = port.address || "";
      port = port.port;
    } else {
      address = typeof address_ === "function" ? "" : address_;
    }
    // Defaulting address for bind to all interfaces
    if (!address) {
      if (this.type === "udp4") {
        address = "0.0.0.0";
      } else {
        address = "::";
      }
    }
    // Resolve address first
    state.handle.lookup(address, (lookupError, ip) => {
      if (lookupError) {
        state.bindState = BIND_STATE_UNBOUND;
        this.emit("error", lookupError);
        return;
      }
      let flags = 0;
      if (state.reuseAddr) {
        flags |= UV_UDP_REUSEADDR;
      }
      if (state.ipv6Only) {
        flags |= UV_UDP_IPV6ONLY;
      }
      // TODO(cmorten): here we deviate somewhat from the Node implementation which
      // makes use of the https://nodejs.org/api/cluster.html module to run servers
      // across a "cluster" of Node processes to take advantage of multi-core
      // systems.
      //
      // Though Deno has has a Worker capability from which we could simulate this,
      // for now we assert that we are _always_ on the primary process.
      if (!state.handle) {
        return; // Handle has been closed in the mean time
      }
      const err = state.handle.bind(ip, port || 0, flags);
      if (err) {
        const ex = exceptionWithHostPort(err, "bind", ip, port);
        state.bindState = BIND_STATE_UNBOUND;
        this.emit("error", ex);
        // Todo: close?
        return;
      }
      startListening(this);
    });
    return this;
  }
  /**
   * Close the underlying socket and stop listening for data on it. If a
   * callback is provided, it is added as a listener for the `'close'` event.
   *
   * @param callback Called when the socket has been closed.
   */
  close(callback) {
    const state = this[kStateSymbol];
    const queue = state.queue;
    if (typeof callback === "function") {
      this.on("close", callback);
    }
    if (queue !== undefined) {
      queue.push(this.close.bind(this));
      return this;
    }
    healthCheck(this);
    stopReceiving(this);
    state.handle.close();
    state.handle = null;
    defaultTriggerAsyncIdScope(
      this[asyncIdSymbol],
      nextTick,
      socketCloseNT,
      this
    );
    return this;
  }
  connect(port, address, callback) {
    port = validatePort(port, "Port", false);
    if (typeof address === "function") {
      callback = address;
      address = "";
    } else if (address === undefined) {
      address = "";
    }
    validateString(address, "address");
    const state = this[kStateSymbol];
    if (state.connectState !== CONNECT_STATE_DISCONNECTED) {
      throw new ERR_SOCKET_DGRAM_IS_CONNECTED();
    }
    state.connectState = CONNECT_STATE_CONNECTING;
    if (state.bindState === BIND_STATE_UNBOUND) {
      this.bind({ port: 0, exclusive: true });
    }
    if (state.bindState !== BIND_STATE_BOUND) {
      enqueue(this, _connect.bind(this, port, address, callback));
      return;
    }
    Reflect.apply(_connect, this, [port, address, callback]);
  }
  /**
   * A synchronous function that disassociates a connected `dgram.Socket` from
   * its remote address. Trying to call `disconnect()` on an unbound or already
   * disconnected socket will result in an `ERR_SOCKET_DGRAM_NOT_CONNECTED`
   * exception.
   */
  disconnect() {
    const state = this[kStateSymbol];
    if (state.connectState !== CONNECT_STATE_CONNECTED) {
      throw new ERR_SOCKET_DGRAM_NOT_CONNECTED();
    }
    const err = state.handle.disconnect();
    if (err) {
      throw errnoException(err, "connect");
    } else {
      state.connectState = CONNECT_STATE_DISCONNECTED;
    }
  }
  /**
   * Instructs the kernel to leave a multicast group at `multicastAddress`
   * using the `IP_DROP_MEMBERSHIP` socket option. This method is automatically
   * called by the kernel when the socket is closed or the process terminates,
   * so most apps will never have reason to call this.
   *
   * If `multicastInterface` is not specified, the operating system will
   * attempt to drop membership on all valid interfaces.
   */
  dropMembership(multicastAddress, interfaceAddress) {
    healthCheck(this);
    if (!multicastAddress) {
      throw new ERR_MISSING_ARGS("multicastAddress");
    }
    const err = this[kStateSymbol].handle.dropMembership(
      multicastAddress,
      interfaceAddress
    );
    if (err) {
      throw errnoException(err, "dropMembership");
    }
  }
  /**
   * Instructs the kernel to leave a source-specific multicast channel at the
   * given `sourceAddress` and `groupAddress` using the
   * `IP_DROP_SOURCE_MEMBERSHIP` socket option. This method is automatically
   * called by the kernel when the socket is closed or the process terminates,
   * so most apps will never have reason to call this.
   *
   * If `multicastInterface` is not specified, the operating system will
   * attempt to drop membership on all valid interfaces.
   */
  dropSourceSpecificMembership(sourceAddress, groupAddress, interfaceAddress) {
    healthCheck(this);
    validateString(sourceAddress, "sourceAddress");
    validateString(groupAddress, "groupAddress");
    const err = this[kStateSymbol].handle.dropSourceSpecificMembership(
      sourceAddress,
      groupAddress,
      interfaceAddress
    );
    if (err) {
      throw errnoException(err, "dropSourceSpecificMembership");
    }
  }
  /**
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound
   * socket.
   *
   * @return the `SO_RCVBUF` socket receive buffer size in bytes.
   */
  getRecvBufferSize() {
    return bufferSize(this, 0, RECV_BUFFER);
  }
  /**
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound
   * socket.
   *
   * @return the `SO_SNDBUF` socket send buffer size in bytes.
   */
  getSendBufferSize() {
    return bufferSize(this, 0, SEND_BUFFER);
  }
  /**
   * By default, binding a socket will cause it to block the Node.js process
   * from exiting as long as the socket is open. The `socket.unref()` method
   * can be used to exclude the socket from the reference counting that keeps
   * the Node.js process active. The `socket.ref()` method adds the socket back
   * to the reference counting and restores the default behavior.
   *
   * Calling `socket.ref()` multiples times will have no additional effect.
   *
   * The `socket.ref()` method returns a reference to the socket so calls can
   * be chained.
   */
  ref() {
    const handle = this[kStateSymbol].handle;
    if (handle) {
      handle.ref();
    }
    return this;
  }
  /**
   * Returns an object containing the `address`, `family`, and `port` of the
   * remote endpoint. This method throws an `ERR_SOCKET_DGRAM_NOT_CONNECTED`
   * exception if the socket is not connected.
   */
  remoteAddress() {
    healthCheck(this);
    const state = this[kStateSymbol];
    if (state.connectState !== CONNECT_STATE_CONNECTED) {
      throw new ERR_SOCKET_DGRAM_NOT_CONNECTED();
    }
    const out = {};
    const err = state.handle.getpeername(out);
    if (err) {
      throw errnoException(err, "getpeername");
    }
    return out;
  }
  send(buffer, offset, length, port, address, callback) {
    let list;
    const state = this[kStateSymbol];
    const connected = state.connectState === CONNECT_STATE_CONNECTED;
    if (!connected) {
      if (address || (port && typeof port !== "function")) {
        buffer = sliceBuffer(buffer, offset, length);
      } else {
        callback = port;
        port = offset;
        address = length;
      }
    } else {
      if (typeof length === "number") {
        buffer = sliceBuffer(buffer, offset, length);
        if (typeof port === "function") {
          callback = port;
          port = null;
        }
      } else {
        callback = offset;
      }
      if (port || address) {
        throw new ERR_SOCKET_DGRAM_IS_CONNECTED();
      }
    }
    if (!Array.isArray(buffer)) {
      if (typeof buffer === "string") {
        list = [Buffer.from(buffer)];
      } else if (!isArrayBufferView(buffer)) {
        throw new ERR_INVALID_ARG_TYPE(
          "buffer",
          ["Buffer", "TypedArray", "DataView", "string"],
          buffer
        );
      } else {
        list = [buffer];
      }
    } else if (!(list = fixBufferList(buffer))) {
      throw new ERR_INVALID_ARG_TYPE(
        "buffer list arguments",
        ["Buffer", "TypedArray", "DataView", "string"],
        buffer
      );
    }
    if (!connected) {
      port = validatePort(port, "Port", false);
    }
    // Normalize callback so it's either a function or undefined but not anything
    // else.
    if (typeof callback !== "function") {
      callback = undefined;
    }
    if (typeof address === "function") {
      callback = address;
      address = undefined;
    } else if (address && typeof address !== "string") {
      throw new ERR_INVALID_ARG_TYPE("address", ["string", "falsy"], address);
    }
    healthCheck(this);
    if (state.bindState === BIND_STATE_UNBOUND) {
      this.bind({ port: 0, exclusive: true });
    }
    if (list.length === 0) {
      list.push(Buffer.alloc(0));
    }
    // If the socket hasn't been bound yet, push the outbound packet onto the
    // send queue and send after binding is complete.
    if (state.bindState !== BIND_STATE_BOUND) {
      // @ts-ignore mapping unknowns back onto themselves doesn't type nicely
      enqueue(this, this.send.bind(this, list, port, address, callback));
      return;
    }
    const afterDns = (ex, ip) => {
      defaultTriggerAsyncIdScope(
        this[asyncIdSymbol],
        doSend,
        ex,
        this,
        ip,
        list,
        address,
        port,
        callback
      );
    };
    if (!connected) {
      state.handle.lookup(address, afterDns);
    } else {
      afterDns(null, "");
    }
  }
  /**
   * Sets or clears the `SO_BROADCAST` socket option. When set to `true`, UDP
   * packets may be sent to a local interface's broadcast address.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setBroadcast(arg) {
    const err = this[kStateSymbol].handle.setBroadcast(arg ? 1 : 0);
    if (err) {
      throw errnoException(err, "setBroadcast");
    }
  }
  /**
   * _All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC
   * 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP_
   * _with a scope index is written as `'IP%scope'` where scope is an interface name_
   * _or interface number._
   *
   * Sets the default outgoing multicast interface of the socket to a chosen
   * interface or back to system interface selection. The `multicastInterface` must
   * be a valid string representation of an IP from the socket's family.
   *
   * For IPv4 sockets, this should be the IP configured for the desired physical
   * interface. All packets sent to multicast on the socket will be sent on the
   * interface determined by the most recent successful use of this call.
   *
   * For IPv6 sockets, `multicastInterface` should include a scope to indicate the
   * interface as in the examples that follow. In IPv6, individual `send` calls can
   * also use explicit scope in addresses, so only packets sent to a multicast
   * address without specifying an explicit scope are affected by the most recent
   * successful use of this call.
   *
   * This method throws `EBADF` if called on an unbound socket.
   *
   * #### Example: IPv6 outgoing multicast interface
   *
   * On most systems, where scope format uses the interface name:
   *
   * ```js
   * const socket = dgram.createSocket('udp6');
   *
   * socket.bind(1234, () => {
   *   socket.setMulticastInterface('::%eth1');
   * });
   * ```
   *
   * On Windows, where scope format uses an interface number:
   *
   * ```js
   * const socket = dgram.createSocket('udp6');
   *
   * socket.bind(1234, () => {
   *   socket.setMulticastInterface('::%2');
   * });
   * ```
   *
   * #### Example: IPv4 outgoing multicast interface
   *
   * All systems use an IP of the host on the desired physical interface:
   *
   * ```js
   * const socket = dgram.createSocket('udp4');
   *
   * socket.bind(1234, () => {
   *   socket.setMulticastInterface('10.0.0.2');
   * });
   * ```
   */
  setMulticastInterface(interfaceAddress) {
    healthCheck(this);
    validateString(interfaceAddress, "interfaceAddress");
    const err =
      this[kStateSymbol].handle.setMulticastInterface(interfaceAddress);
    if (err) {
      throw errnoException(err, "setMulticastInterface");
    }
  }
  /**
   * Sets or clears the `IP_MULTICAST_LOOP` socket option. When set to `true`,
   * multicast packets will also be received on the local interface.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setMulticastLoopback(arg) {
    const err = this[kStateSymbol].handle.setMulticastLoopback(arg ? 1 : 0);
    if (err) {
      throw errnoException(err, "setMulticastLoopback");
    }
    return arg; // 0.4 compatibility
  }
  /**
   * Sets the `IP_MULTICAST_TTL` socket option. While TTL generally stands for
   * "Time to Live", in this context it specifies the number of IP hops that a
   * packet is allowed to travel through, specifically for multicast traffic. Each
   * router or gateway that forwards a packet decrements the TTL. If the TTL is
   * decremented to 0 by a router, it will not be forwarded.
   *
   * The `ttl` argument may be between 0 and 255\. The default on most systems is `1`.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setMulticastTTL(ttl) {
    validateNumber(ttl, "ttl");
    const err = this[kStateSymbol].handle.setMulticastTTL(ttl);
    if (err) {
      throw errnoException(err, "setMulticastTTL");
    }
    return ttl;
  }
  /**
   * Sets the `SO_RCVBUF` socket option. Sets the maximum socket receive buffer
   * in bytes.
   *
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound socket.
   */
  setRecvBufferSize(size) {
    bufferSize(this, size, RECV_BUFFER);
  }
  /**
   * Sets the `SO_SNDBUF` socket option. Sets the maximum socket send buffer
   * in bytes.
   *
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound socket.
   */
  setSendBufferSize(size) {
    bufferSize(this, size, SEND_BUFFER);
  }
  /**
   * Sets the `IP_TTL` socket option. While TTL generally stands for "Time to Live",
   * in this context it specifies the number of IP hops that a packet is allowed to
   * travel through. Each router or gateway that forwards a packet decrements the
   * TTL. If the TTL is decremented to 0 by a router, it will not be forwarded.
   * Changing TTL values is typically done for network probes or when multicasting.
   *
   * The `ttl` argument may be between between 1 and 255\. The default on most systems
   * is 64.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setTTL(ttl) {
    validateNumber(ttl, "ttl");
    const err = this[kStateSymbol].handle.setTTL(ttl);
    if (err) {
      throw errnoException(err, "setTTL");
    }
    return ttl;
  }
  /**
   * By default, binding a socket will cause it to block the Node.js process from
   * exiting as long as the socket is open. The `socket.unref()` method can be used
   * to exclude the socket from the reference counting that keeps the Node.js
   * process active, allowing the process to exit even if the socket is still
   * listening.
   *
   * Calling `socket.unref()` multiple times will have no addition effect.
   *
   * The `socket.unref()` method returns a reference to the socket so calls can be
   * chained.
   */
  unref() {
    const handle = this[kStateSymbol].handle;
    if (handle) {
      handle.unref();
    }
    return this;
  }
}
export function createSocket(type, listener) {
  return new Socket(type, listener);
}
function startListening(socket) {
  const state = socket[kStateSymbol];
  state.handle.onmessage = onMessage;
  // Todo: handle errors
  state.handle.recvStart();
  state.receiving = true;
  state.bindState = BIND_STATE_BOUND;
  if (state.recvBufferSize) {
    bufferSize(socket, state.recvBufferSize, RECV_BUFFER);
  }
  if (state.sendBufferSize) {
    bufferSize(socket, state.sendBufferSize, SEND_BUFFER);
  }
  socket.emit("listening");
}
function replaceHandle(self, newHandle) {
  const state = self[kStateSymbol];
  const oldHandle = state.handle;
  // Set up the handle that we got from primary.
  newHandle.lookup = oldHandle.lookup;
  newHandle.bind = oldHandle.bind;
  newHandle.send = oldHandle.send;
  newHandle[ownerSymbol] = self;
  // Replace the existing handle by the handle we got from primary.
  oldHandle.close();
  state.handle = newHandle;
}
function bufferSize(self, size, buffer) {
  if (size >>> 0 !== size) {
    throw new ERR_SOCKET_BAD_BUFFER_SIZE();
  }
  const ctx = {};
  const ret = self[kStateSymbol].handle.bufferSize(size, buffer, ctx);
  if (ret === undefined) {
    throw new ERR_SOCKET_BUFFER_SIZE(ctx);
  }
  return ret;
}
function socketCloseNT(self) {
  self.emit("close");
}
function healthCheck(socket) {
  if (!socket[kStateSymbol].handle) {
    // Error message from dgram_legacy.js.
    throw new ERR_SOCKET_DGRAM_NOT_RUNNING();
  }
}
function stopReceiving(socket) {
  const state = socket[kStateSymbol];
  if (!state.receiving) {
    return;
  }
  state.handle.recvStop();
  state.receiving = false;
}
function onMessage(nread, handle, buf, rinfo) {
  const self = handle[ownerSymbol];
  if (nread < 0) {
    self.emit("error", errnoException(nread, "recvmsg"));
    return;
  }
  rinfo.size = buf.length; // compatibility
  self.emit("message", buf, rinfo);
}
function sliceBuffer(buffer, offset, length) {
  if (typeof buffer === "string") {
    buffer = Buffer.from(buffer);
  } else if (!isArrayBufferView(buffer)) {
    throw new ERR_INVALID_ARG_TYPE(
      "buffer",
      ["Buffer", "TypedArray", "DataView", "string"],
      buffer
    );
  }
  offset = offset >>> 0;
  length = length >>> 0;
  if (offset > buffer.byteLength) {
    throw new ERR_BUFFER_OUT_OF_BOUNDS("offset");
  }
  if (offset + length > buffer.byteLength) {
    throw new ERR_BUFFER_OUT_OF_BOUNDS("length");
  }
  return Buffer.from(buffer.buffer, buffer.byteOffset + offset, length);
}
function fixBufferList(list) {
  const newList = new Array(list.length);
  for (let i = 0, l = list.length; i < l; i++) {
    const buf = list[i];
    if (typeof buf === "string") {
      newList[i] = Buffer.from(buf);
    } else if (!isArrayBufferView(buf)) {
      return null;
    } else {
      newList[i] = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  }
  return newList;
}
function enqueue(self, toEnqueue) {
  const state = self[kStateSymbol];
  // If the send queue hasn't been initialized yet, do it, and install an
  // event handler that flushes the send queue after binding is done.
  if (state.queue === undefined) {
    state.queue = [];
    self.once(EventEmitter.errorMonitor, onListenError);
    self.once("listening", onListenSuccess);
  }
  state.queue.push(toEnqueue);
}
function onListenSuccess() {
  this.removeListener(EventEmitter.errorMonitor, onListenError);
  clearQueue.call(this);
}
function onListenError() {
  this.removeListener("listening", onListenSuccess);
  this[kStateSymbol].queue = undefined;
}
function clearQueue() {
  const state = this[kStateSymbol];
  const queue = state.queue;
  state.queue = undefined;
  // Flush the send queue.
  for (const queueEntry of queue) {
    queueEntry();
  }
}
function _connect(port, address, callback) {
  const state = this[kStateSymbol];
  if (callback) {
    this.once("connect", callback);
  }
  const afterDns = (ex, ip) => {
    defaultTriggerAsyncIdScope(
      this[asyncIdSymbol],
      doConnect,
      ex,
      this,
      ip,
      address,
      port,
      callback
    );
  };
  state.handle.lookup(address, afterDns);
}
function doConnect(ex, self, ip, address, port, callback) {
  const state = self[kStateSymbol];
  if (!state.handle) {
    return;
  }
  if (!ex) {
    const err = state.handle.connect(ip, port);
    if (err) {
      ex = exceptionWithHostPort(err, "connect", address, port);
    }
  }
  if (ex) {
    state.connectState = CONNECT_STATE_DISCONNECTED;
    return nextTick(() => {
      if (callback) {
        self.removeListener("connect", callback);
        callback(ex);
      } else {
        self.emit("error", ex);
      }
    });
  }
  state.connectState = CONNECT_STATE_CONNECTED;
  nextTick(() => self.emit("connect"));
}
function doSend(ex, self, ip, list, address, port, callback) {
  const state = self[kStateSymbol];
  if (ex) {
    if (typeof callback === "function") {
      nextTick(callback, ex);
      return;
    }
    nextTick(() => self.emit("error", ex));
    return;
  } else if (!state.handle) {
    return;
  }
  const req = new SendWrap();
  req.list = list; // Keep reference alive.
  req.address = address;
  req.port = port;
  if (callback) {
    req.callback = callback;
    req.oncomplete = afterSend;
  }
  let err;
  if (port) {
    err = state.handle.send(req, list, list.length, port, ip, !!callback);
  } else {
    err = state.handle.send(req, list, list.length, !!callback);
  }
  if (err >= 1) {
    // Synchronous finish. The return code is msg_length + 1 so that we can
    // distinguish between synchronous success and asynchronous success.
    if (callback) {
      nextTick(callback, null, err - 1);
    }
    return;
  }
  if (err && callback) {
    // Don't emit as error, dgram_legacy.js compatibility
    const ex = exceptionWithHostPort(err, "send", address, port);
    nextTick(callback, ex);
  }
}
function afterSend(err, sent) {
  let ex;
  if (err) {
    ex = exceptionWithHostPort(err, "send", this.address, this.port);
  } else {
    ex = null;
  }
  this.callback(ex, sent);
}
export default {
  createSocket,
  Socket,
};
