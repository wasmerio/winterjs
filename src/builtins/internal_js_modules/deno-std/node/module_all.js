// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import _http_agent from "./_http_agent.mjs";
import _http_outgoing from "./_http_outgoing";
import _stream_duplex from "./internal/streams/duplex.mjs";
import _stream_passthrough from "./internal/streams/passthrough.mjs";
import _stream_readable from "./internal/streams/readable.mjs";
import _stream_transform from "./internal/streams/transform.mjs";
import _stream_writable from "./internal/streams/writable.mjs";
import assert from "./assert";
import assertStrict from "./assert/strict";
import async_hooks from "./async_hooks";
import buffer from "./buffer";
import childProcess from "./child_process";
import cluster from "./cluster";
import console from "./console";
import constants from "./constants";
import crypto from "./crypto";
import dgram from "./dgram";
import diagnosticsChannel from "./diagnostics_channel";
import dns from "./dns";
import dnsPromises from "./dns/promises";
import domain from "./domain";
import events from "./events";
import fs from "./fs";
import fsPromises from "./fs/promises";
import http from "./http";
import http2 from "./http2";
import https from "./https";
import inspector from "./inspector";
import internalCp from "./internal/child_process";
import internalCryptoCertificate from "./internal/crypto/certificate";
import internalCryptoCipher from "./internal/crypto/cipher";
import internalCryptoDiffiehellman from "./internal/crypto/diffiehellman";
import internalCryptoHash from "./internal/crypto/hash";
import internalCryptoHkdf from "./internal/crypto/hkdf";
import internalCryptoKeygen from "./internal/crypto/keygen";
import internalCryptoKeys from "./internal/crypto/keys";
import internalCryptoPbkdf2 from "./internal/crypto/pbkdf2";
import internalCryptoRandom from "./internal/crypto/random";
import internalCryptoScrypt from "./internal/crypto/scrypt";
import internalCryptoSig from "./internal/crypto/sig";
import internalCryptoUtil from "./internal/crypto/util";
import internalCryptoX509 from "./internal/crypto/x509";
import internalDgram from "./internal/dgram";
import internalDnsPromises from "./internal/dns/promises";
import internalErrors from "./internal/errors";
import internalEventTarget from "./internal/event_target.mjs";
import internalFsUtils from "./internal/fs/utils.mjs";
import internalHttp from "./internal/http";
import internalReadlineUtils from "./internal/readline/utils.mjs";
import internalStreamsAddAbortSignal from "./internal/streams/add-abort-signal.mjs";
import internalStreamsBufferList from "./internal/streams/buffer_list.mjs";
import internalStreamsLazyTransform from "./internal/streams/lazy_transform.mjs";
import internalStreamsState from "./internal/streams/state.mjs";
import internalTestBinding from "./internal/test/binding";
import internalTimers from "./internal/timers.mjs";
import internalUtil from "./internal/util.mjs";
import internalUtilInspect from "./internal/util/inspect.mjs";
import net from "./net";
import os from "./os";
import pathPosix from "./path/posix";
import pathWin32 from "./path/win32";
import path from "./path";
import perfHooks from "./perf_hooks";
import punycode from "./punycode";
import process from "./process";
import querystring from "./querystring";
import readline from "./readline";
import readlinePromises from "./readline/promises";
import repl from "./repl";
import stream from "./stream";
import streamConsumers from "./stream/consumers.mjs";
import streamPromises from "./stream/promises.mjs";
import streamWeb from "./stream/web";
import stringDecoder from "./string_decoder";
import sys from "./sys";
import timers from "./timers";
import timersPromises from "./timers/promises";
import tls from "./tls";
import tty from "./tty";
import url from "./url";
import utilTypes from "./util/types";
import util from "./util";
import v8 from "./v8";
import vm from "./vm";
import workerThreads from "./worker_threads";
import wasi from "./wasi";
import zlib from "./zlib";
// Canonical mapping of supported modules
export default {
  _http_agent,
  _http_outgoing,
  _stream_duplex,
  _stream_passthrough,
  _stream_readable,
  _stream_transform,
  _stream_writable,
  assert,
  "assert/strict": assertStrict,
  async_hooks,
  buffer,
  crypto,
  console,
  constants,
  child_process: childProcess,
  cluster,
  dgram,
  diagnostics_channel: diagnosticsChannel,
  dns,
  "dns/promises": dnsPromises,
  domain,
  events,
  fs,
  "fs/promises": fsPromises,
  http,
  http2,
  https,
  inspector,
  "internal/child_process": internalCp,
  "internal/crypto/certificate": internalCryptoCertificate,
  "internal/crypto/cipher": internalCryptoCipher,
  "internal/crypto/diffiehellman": internalCryptoDiffiehellman,
  "internal/crypto/hash": internalCryptoHash,
  "internal/crypto/hkdf": internalCryptoHkdf,
  "internal/crypto/keygen": internalCryptoKeygen,
  "internal/crypto/keys": internalCryptoKeys,
  "internal/crypto/pbkdf2": internalCryptoPbkdf2,
  "internal/crypto/random": internalCryptoRandom,
  "internal/crypto/scrypt": internalCryptoScrypt,
  "internal/crypto/sig": internalCryptoSig,
  "internal/crypto/util": internalCryptoUtil,
  "internal/crypto/x509": internalCryptoX509,
  "internal/dgram": internalDgram,
  "internal/dns/promises": internalDnsPromises,
  "internal/errors": internalErrors,
  "internal/event_target": internalEventTarget,
  "internal/fs/utils": internalFsUtils,
  "internal/http": internalHttp,
  "internal/readline/utils": internalReadlineUtils,
  "internal/streams/add-abort-signal": internalStreamsAddAbortSignal,
  "internal/streams/buffer_list": internalStreamsBufferList,
  "internal/streams/lazy_transform": internalStreamsLazyTransform,
  "internal/streams/state": internalStreamsState,
  "internal/test/binding": internalTestBinding,
  "internal/timers": internalTimers,
  "internal/util/inspect": internalUtilInspect,
  "internal/util": internalUtil,
  net,
  os,
  "path/posix": pathPosix,
  "path/win32": pathWin32,
  path,
  perf_hooks: perfHooks,
  process,
  get punycode() {
    process.emitWarning(
      "The `punycode` module is deprecated. Please use a userland " +
        "alternative instead.",
      "DeprecationWarning",
      "DEP0040"
    );
    return punycode;
  },
  querystring,
  readline,
  "readline/promises": readlinePromises,
  repl,
  stream,
  "stream/consumers": streamConsumers,
  "stream/promises": streamPromises,
  "stream/web": streamWeb,
  string_decoder: stringDecoder,
  sys,
  timers,
  "timers/promises": timersPromises,
  tls,
  tty,
  url,
  util,
  "util/types": utilTypes,
  v8,
  vm,
  wasi,
  worker_threads: workerThreads,
  zlib,
};
