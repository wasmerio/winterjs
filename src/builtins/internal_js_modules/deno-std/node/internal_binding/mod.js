// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import * as asyncWrap from "./async_wrap";
import * as buffer from "./buffer";
import * as config from "./config";
import * as caresWrap from "./cares_wrap";
import * as constants from "./constants";
import * as contextify from "./contextify";
import * as crypto from "./crypto";
import * as credentials from "./credentials";
import * as errors from "./errors";
import * as fs from "./fs";
import * as fsDir from "./fs_dir";
import * as fsEventWrap from "./fs_event_wrap";
import * as heapUtils from "./heap_utils";
import * as httpParser from "./http_parser";
import * as icu from "./icu";
import * as inspector from "./inspector";
import * as jsStream from "./js_stream";
import * as messaging from "./messaging";
import * as moduleWrap from "./module_wrap";
import * as nativeModule from "./native_module";
import * as natives from "./natives";
import * as options from "./options";
import * as os from "./os";
import * as pipeWrap from "./pipe_wrap";
import * as performance from "./performance";
import * as processMethods from "./process_methods";
import * as report from "./report";
import * as serdes from "./serdes";
import * as signalWrap from "./signal_wrap";
import * as spawnSync from "./spawn_sync";
import * as streamWrap from "./stream_wrap";
import * as stringDecoder from "./string_decoder";
import * as symbols from "./symbols";
import * as taskQueue from "./task_queue";
import * as tcpWrap from "./tcp_wrap";
import * as timers from "./timers";
import * as tlsWrap from "./tls_wrap";
import * as traceEvents from "./trace_events";
import * as ttyWrap from "./tty_wrap";
import * as types from "./types";
import * as udpWrap from "./udp_wrap";
import * as url from "./url";
import * as util from "./util";
import * as uv from "./uv";
import * as v8 from "./v8";
import * as worker from "./worker";
import * as zlib from "./zlib";
const modules = {
  async_wrap: asyncWrap,
  buffer,
  cares_wrap: caresWrap,
  config,
  constants,
  contextify,
  credentials,
  crypto,
  errors,
  fs,
  fs_dir: fsDir,
  fs_event_wrap: fsEventWrap,
  heap_utils: heapUtils,
  http_parser: httpParser,
  icu,
  inspector,
  js_stream: jsStream,
  messaging,
  module_wrap: moduleWrap,
  native_module: nativeModule,
  natives,
  options,
  os,
  performance,
  pipe_wrap: pipeWrap,
  process_methods: processMethods,
  report,
  serdes,
  signal_wrap: signalWrap,
  spawn_sync: spawnSync,
  stream_wrap: streamWrap,
  string_decoder: stringDecoder,
  symbols,
  task_queue: taskQueue,
  tcp_wrap: tcpWrap,
  timers,
  tls_wrap: tlsWrap,
  trace_events: traceEvents,
  tty_wrap: ttyWrap,
  types,
  udp_wrap: udpWrap,
  url,
  util,
  uv,
  v8,
  worker,
  zlib,
};
export function getBinding(name) {
  const mod = modules[name];
  if (!mod) {
    throw new Error(`No such module: ${name}`);
  }
  return mod;
}
