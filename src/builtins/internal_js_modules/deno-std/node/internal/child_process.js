// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html
import { assert } from "../../_util/asserts";
import { EventEmitter } from "../events";
import { os } from "../internal_binding/constants";
import { notImplemented, warnNotImplemented } from "../_utils";
import { Readable, Stream, Writable } from "../stream";
import { deferred } from "../../async/deferred";
import { isWindows } from "../../_util/os";
import { nextTick } from "../_next_tick";
import {
  AbortError,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_UNKNOWN_SIGNAL,
} from "./errors";
import { mapValues } from "../../collections/map_values";
import { Buffer } from "../buffer";
import { errnoException } from "./errors";
import { codeMap } from "../internal_binding/uv";
import {
  isInt32,
  validateBoolean,
  validateObject,
  validateString,
} from "./validators.mjs";
import {
  ArrayIsArray,
  ArrayPrototypeFilter,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ArrayPrototypeSort,
  ArrayPrototypeUnshift,
  ObjectPrototypeHasOwnProperty,
  StringPrototypeToUpperCase,
} from "./primordials.mjs";
import { kEmptyObject } from "./util.mjs";
import { getValidatedPath } from "./fs/utils.mjs";
import process from "../process";
// @ts-ignore Deno[Deno.internal] is used on purpose here
const DenoCommand = Deno[Deno.internal]?.nodeUnstable?.Command || Deno.Command;
export function stdioStringToArray(stdio, channel) {
  const options = [];
  switch (stdio) {
    case "ignore":
    case "overlapped":
    case "pipe":
      options.push(stdio, stdio, stdio);
      break;
    case "inherit":
      options.push(stdio, stdio, stdio);
      break;
    default:
      throw new ERR_INVALID_ARG_VALUE("stdio", stdio);
  }
  if (channel) options.push(channel);
  return options;
}
export class ChildProcess extends EventEmitter {
  /**
   * The exit code of the child process. This property will be `null` until the child process exits.
   */
  exitCode = null;
  /**
   * This property is set to `true` after `kill()` is called.
   */
  killed = false;
  /**
   * The PID of this child process.
   */
  pid;
  /**
   * The signal received by this child process.
   */
  signalCode = null;
  /**
   * Command line arguments given to this child process.
   */
  spawnargs;
  /**
   * The executable file name of this child process.
   */
  spawnfile;
  /**
   * This property represents the child process's stdin.
   */
  stdin = null;
  /**
   * This property represents the child process's stdout.
   */
  stdout = null;
  /**
   * This property represents the child process's stderr.
   */
  stderr = null;
  /**
   * Pipes to this child process.
   */
  stdio = [null, null, null];
  #process;
  #spawned = deferred();
  constructor(command, args, options) {
    super();
    const {
      env = {},
      stdio = ["pipe", "pipe", "pipe"],
      cwd,
      shell = false,
      signal,
      windowsVerbatimArguments = false,
    } = options || {};
    const [
      stdin = "pipe",
      stdout = "pipe",
      stderr = "pipe",
      _channel, // TODO(kt3k): handle this correctly
    ] = normalizeStdioOption(stdio);
    const [cmd, cmdArgs] = buildCommand(command, args || [], shell);
    this.spawnfile = cmd;
    this.spawnargs = [cmd, ...cmdArgs];
    const stringEnv = mapValues(env, (value) => value.toString());
    try {
      this.#process = new DenoCommand(cmd, {
        args: cmdArgs,
        cwd,
        env: stringEnv,
        stdin: toDenoStdio(stdin),
        stdout: toDenoStdio(stdout),
        stderr: toDenoStdio(stderr),
        windowsRawArguments: windowsVerbatimArguments,
      }).spawn();
      this.pid = this.#process.pid;
      if (stdin === "pipe") {
        assert(this.#process.stdin);
        this.stdin = Writable.fromWeb(this.#process.stdin);
      }
      if (stdout === "pipe") {
        assert(this.#process.stdout);
        this.stdout = Readable.fromWeb(this.#process.stdout);
      }
      if (stderr === "pipe") {
        assert(this.#process.stderr);
        this.stderr = Readable.fromWeb(this.#process.stderr);
      }
      this.stdio[0] = this.stdin;
      this.stdio[1] = this.stdout;
      this.stdio[2] = this.stderr;
      nextTick(() => {
        this.emit("spawn");
        this.#spawned.resolve();
      });
      if (signal) {
        const onAbortListener = () => {
          try {
            if (this.kill("SIGKILL")) {
              this.emit("error", new AbortError());
            }
          } catch (err) {
            this.emit("error", err);
          }
        };
        if (signal.aborted) {
          nextTick(onAbortListener);
        } else {
          signal.addEventListener("abort", onAbortListener, { once: true });
          this.addListener("exit", () =>
            signal.removeEventListener("abort", onAbortListener)
          );
        }
      }
      (async () => {
        const status = await this.#process.status;
        this.exitCode = status.code;
        this.#spawned.then(async () => {
          const exitCode = this.signalCode == null ? this.exitCode : null;
          const signalCode = this.signalCode == null ? null : this.signalCode;
          // The 'exit' and 'close' events must be emitted after the 'spawn' event.
          this.emit("exit", exitCode, signalCode);
          await this.#_waitForChildStreamsToClose();
          this.#closePipes();
          this.emit("close", exitCode, signalCode);
        });
      })();
    } catch (err) {
      this.#_handleError(err);
    }
  }
  /**
   * @param signal NOTE: this parameter is not yet implemented.
   */
  kill(signal) {
    if (this.killed) {
      return this.killed;
    }
    const denoSignal = signal == null ? "SIGTERM" : toDenoSignal(signal);
    this.#closePipes();
    try {
      this.#process.kill(denoSignal);
    } catch (err) {
      const alreadyClosed =
        err instanceof TypeError || err instanceof Deno.errors.PermissionDenied;
      if (!alreadyClosed) {
        throw err;
      }
    }
    this.killed = true;
    this.signalCode = denoSignal;
    return this.killed;
  }
  ref() {
    this.#process.ref();
  }
  unref() {
    this.#process.unref();
  }
  disconnect() {
    warnNotImplemented("ChildProcess.prototype.disconnect");
  }
  async #_waitForChildStreamsToClose() {
    const promises = [];
    if (this.stdin && !this.stdin.destroyed) {
      assert(this.stdin);
      this.stdin.destroy();
      promises.push(waitForStreamToClose(this.stdin));
    }
    if (this.stdout && !this.stdout.destroyed) {
      promises.push(waitForReadableToClose(this.stdout));
    }
    if (this.stderr && !this.stderr.destroyed) {
      promises.push(waitForReadableToClose(this.stderr));
    }
    await Promise.all(promises);
  }
  #_handleError(err) {
    nextTick(() => {
      this.emit("error", err); // TODO(uki00a) Convert `err` into nodejs's `SystemError` class.
    });
  }
  #closePipes() {
    if (this.stdin) {
      assert(this.stdin);
      this.stdin.destroy();
    }
  }
}
const supportedNodeStdioTypes = ["pipe", "ignore", "inherit"];
function toDenoStdio(pipe) {
  if (
    !supportedNodeStdioTypes.includes(pipe) ||
    typeof pipe === "number" ||
    pipe instanceof Stream
  ) {
    notImplemented(`toDenoStdio pipe=${typeof pipe} (${pipe})`);
  }
  switch (pipe) {
    case "pipe":
    case undefined:
    case null:
      return "piped";
    case "ignore":
      return "null";
    case "inherit":
      return "inherit";
    default:
      notImplemented(`toDenoStdio pipe=${typeof pipe} (${pipe})`);
  }
}
function toDenoSignal(signal) {
  if (typeof signal === "number") {
    for (const name of keys(os.signals)) {
      if (os.signals[name] === signal) {
        return name;
      }
    }
    throw new ERR_UNKNOWN_SIGNAL(String(signal));
  }
  const denoSignal = signal;
  if (denoSignal in os.signals) {
    return denoSignal;
  }
  throw new ERR_UNKNOWN_SIGNAL(signal);
}
function keys(object) {
  return Object.keys(object);
}
function copyProcessEnvToEnv(env, name, optionEnv) {
  if (
    Deno.env.get(name) &&
    (!optionEnv || !ObjectPrototypeHasOwnProperty(optionEnv, name))
  ) {
    env[name] = Deno.env.get(name);
  }
}
function normalizeStdioOption(stdio = ["pipe", "pipe", "pipe"]) {
  if (Array.isArray(stdio)) {
    return stdio;
  } else {
    switch (stdio) {
      case "overlapped":
        if (isWindows) {
          notImplemented("normalizeStdioOption overlapped (on windows)");
        }
        // 'overlapped' is same as 'piped' on non Windows system.
        return ["pipe", "pipe", "pipe"];
      case "pipe":
        return ["pipe", "pipe", "pipe"];
      case "inherit":
        return ["inherit", "inherit", "inherit"];
      case "ignore":
        return ["ignore", "ignore", "ignore"];
      default:
        notImplemented(`normalizeStdioOption stdio=${typeof stdio} (${stdio})`);
    }
  }
}
export function normalizeSpawnArguments(file, args, options) {
  validateString(file, "file");
  if (file.length === 0) {
    throw new ERR_INVALID_ARG_VALUE("file", file, "cannot be empty");
  }
  if (ArrayIsArray(args)) {
    args = ArrayPrototypeSlice(args);
  } else if (args == null) {
    args = [];
  } else if (typeof args !== "object") {
    throw new ERR_INVALID_ARG_TYPE("args", "object", args);
  } else {
    options = args;
    args = [];
  }
  if (options === undefined) {
    options = kEmptyObject;
  } else {
    validateObject(options, "options");
  }
  let cwd = options.cwd;
  // Validate the cwd, if present.
  if (cwd != null) {
    cwd = getValidatedPath(cwd, "options.cwd");
  }
  // Validate detached, if present.
  if (options.detached != null) {
    validateBoolean(options.detached, "options.detached");
  }
  // Validate the uid, if present.
  if (options.uid != null && !isInt32(options.uid)) {
    throw new ERR_INVALID_ARG_TYPE("options.uid", "int32", options.uid);
  }
  // Validate the gid, if present.
  if (options.gid != null && !isInt32(options.gid)) {
    throw new ERR_INVALID_ARG_TYPE("options.gid", "int32", options.gid);
  }
  // Validate the shell, if present.
  if (
    options.shell != null &&
    typeof options.shell !== "boolean" &&
    typeof options.shell !== "string"
  ) {
    throw new ERR_INVALID_ARG_TYPE(
      "options.shell",
      ["boolean", "string"],
      options.shell
    );
  }
  // Validate argv0, if present.
  if (options.argv0 != null) {
    validateString(options.argv0, "options.argv0");
  }
  // Validate windowsHide, if present.
  if (options.windowsHide != null) {
    validateBoolean(options.windowsHide, "options.windowsHide");
  }
  // Validate windowsVerbatimArguments, if present.
  let { windowsVerbatimArguments } = options;
  if (windowsVerbatimArguments != null) {
    validateBoolean(
      windowsVerbatimArguments,
      "options.windowsVerbatimArguments"
    );
  }
  if (options.shell) {
    const command = ArrayPrototypeJoin([file, ...args], " ");
    // Set the shell, switches, and commands.
    if (process.platform === "win32") {
      if (typeof options.shell === "string") {
        file = options.shell;
      } else {
        file = Deno.env.get("comspec") || "cmd.exe";
      }
      // '/d /s /c' is used only for cmd.exe.
      if (/^(?:.*\\)?cmd(?:\.exe)?$/i.exec(file) !== null) {
        args = ["/d", "/s", "/c", `"${command}"`];
        windowsVerbatimArguments = true;
      } else {
        args = ["-c", command];
      }
    } else {
      /** TODO: add Android condition */
      if (typeof options.shell === "string") {
        file = options.shell;
      } else {
        file = "/bin/sh";
      }
      args = ["-c", command];
    }
  }
  if (typeof options.argv0 === "string") {
    ArrayPrototypeUnshift(args, options.argv0);
  } else {
    ArrayPrototypeUnshift(args, file);
  }
  const env = options.env || Deno.env.toObject();
  const envPairs = [];
  // process.env.NODE_V8_COVERAGE always propagates, making it possible to
  // collect coverage for programs that spawn with white-listed environment.
  copyProcessEnvToEnv(env, "NODE_V8_COVERAGE", options.env);
  /** TODO: add `isZOS` condition */
  let envKeys = [];
  // Prototype values are intentionally included.
  for (const key in env) {
    ArrayPrototypePush(envKeys, key);
  }
  if (process.platform === "win32") {
    // On Windows env keys are case insensitive. Filter out duplicates,
    // keeping only the first one (in lexicographic order)
    /** TODO: implement SafeSet and makeSafe */
    const sawKey = new Set();
    envKeys = ArrayPrototypeFilter(ArrayPrototypeSort(envKeys), (key) => {
      const uppercaseKey = StringPrototypeToUpperCase(key);
      if (sawKey.has(uppercaseKey)) {
        return false;
      }
      sawKey.add(uppercaseKey);
      return true;
    });
  }
  for (const key of envKeys) {
    const value = env[key];
    if (value !== undefined) {
      ArrayPrototypePush(envPairs, `${key}=${value}`);
    }
  }
  return {
    // Make a shallow copy so we don't clobber the user's options object.
    ...options,
    args,
    cwd,
    detached: !!options.detached,
    envPairs,
    file,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!windowsVerbatimArguments,
  };
}
function waitForReadableToClose(readable) {
  readable.resume(); // Ensure buffered data will be consumed.
  return waitForStreamToClose(readable);
}
function waitForStreamToClose(stream) {
  const promise = deferred();
  const cleanup = () => {
    stream.removeListener("close", onClose);
    stream.removeListener("error", onError);
  };
  const onClose = () => {
    cleanup();
    promise.resolve();
  };
  const onError = (err) => {
    cleanup();
    promise.reject(err);
  };
  stream.once("close", onClose);
  stream.once("error", onError);
  return promise;
}
/**
 * This function is based on https://github.com/nodejs/node/blob/fc6426ccc4b4cb73076356fb6dbf46a28953af01/lib/child_process.js#L504-L528.
 * Copyright Joyent, Inc. and other Node contributors. All rights reserved. MIT license.
 */
function buildCommand(file, args, shell) {
  if (file === Deno.execPath()) {
    // The user is trying to spawn another Deno process as Node.js.
    args = toDenoArgs(args);
  }
  if (shell) {
    const command = [file, ...args].join(" ");
    // Set the shell, switches, and commands.
    if (isWindows) {
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = Deno.env.get("comspec") || "cmd.exe";
      }
      // '/d /s /c' is used only for cmd.exe.
      if (/^(?:.*\\)?cmd(?:\.exe)?$/i.test(file)) {
        args = ["/d", "/s", "/c", `"${command}"`];
      } else {
        args = ["-c", command];
      }
    } else {
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = "/bin/sh";
      }
      args = ["-c", command];
    }
  }
  return [file, args];
}
function _createSpawnSyncError(status, command, args = []) {
  const error = errnoException(codeMap.get(status), "spawnSync " + command);
  error.path = command;
  error.spawnargs = args;
  return error;
}
function parseSpawnSyncOutputStreams(output, name) {
  // new Deno.Command().outputSync() returns getters for stdout and stderr that throw when set
  // to 'inherit'.
  try {
    return Buffer.from(output[name]);
  } catch {
    return null;
  }
}
export function spawnSync(command, args, options) {
  const {
    env = Deno.env.toObject(),
    stdio = ["pipe", "pipe", "pipe"],
    shell = false,
    cwd,
    encoding,
    uid,
    gid,
    maxBuffer,
    windowsVerbatimArguments = false,
  } = options;
  const normalizedStdio = normalizeStdioOption(stdio);
  [command, args] = buildCommand(command, args ?? [], shell);
  const result = {};
  try {
    const output = new DenoCommand(command, {
      args,
      cwd,
      env,
      stdout: toDenoStdio(normalizedStdio[1]),
      stderr: toDenoStdio(normalizedStdio[2]),
      uid,
      gid,
      windowsRawArguments: windowsVerbatimArguments,
    }).outputSync();
    const status = output.signal ? null : 0;
    let stdout = parseSpawnSyncOutputStreams(output, "stdout");
    let stderr = parseSpawnSyncOutputStreams(output, "stderr");
    if (
      (stdout && stdout.length > maxBuffer) ||
      (stderr && stderr.length > maxBuffer)
    ) {
      result.error = _createSpawnSyncError("ENOBUFS", command, args);
    }
    if (encoding && encoding !== "buffer") {
      stdout = stdout && stdout.toString(encoding);
      stderr = stderr && stderr.toString(encoding);
    }
    result.status = status;
    result.signal = output.signal;
    result.stdout = stdout;
    result.stderr = stderr;
    result.output = [output.signal, stdout, stderr];
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      result.error = _createSpawnSyncError("ENOENT", command, args);
    }
  }
  return result;
}
// These are Node.js CLI flags that expect a value. It's necessary to
// understand these flags in order to properly replace flags passed to the
// child process. For example, -e is a Node flag for eval mode if it is part
// of process.execArgv. However, -e could also be an application flag if it is
// part of process.execv instead. We only want to process execArgv flags.
const kLongArgType = 1;
const kShortArgType = 2;
const kLongArg = { type: kLongArgType };
const kShortArg = { type: kShortArgType };
const kNodeFlagsMap = new Map([
  ["--build-snapshot", kLongArg],
  ["-c", kShortArg],
  ["--check", kLongArg],
  ["-C", kShortArg],
  ["--conditions", kLongArg],
  ["--cpu-prof-dir", kLongArg],
  ["--cpu-prof-interval", kLongArg],
  ["--cpu-prof-name", kLongArg],
  ["--diagnostic-dir", kLongArg],
  ["--disable-proto", kLongArg],
  ["--dns-result-order", kLongArg],
  ["-e", kShortArg],
  ["--eval", kLongArg],
  ["--experimental-loader", kLongArg],
  ["--experimental-policy", kLongArg],
  ["--experimental-specifier-resolution", kLongArg],
  ["--heapsnapshot-near-heap-limit", kLongArg],
  ["--heapsnapshot-signal", kLongArg],
  ["--heap-prof-dir", kLongArg],
  ["--heap-prof-interval", kLongArg],
  ["--heap-prof-name", kLongArg],
  ["--icu-data-dir", kLongArg],
  ["--input-type", kLongArg],
  ["--inspect-publish-uid", kLongArg],
  ["--max-http-header-size", kLongArg],
  ["--openssl-config", kLongArg],
  ["-p", kShortArg],
  ["--print", kLongArg],
  ["--policy-integrity", kLongArg],
  ["--prof-process", kLongArg],
  ["-r", kShortArg],
  ["--require", kLongArg],
  ["--redirect-warnings", kLongArg],
  ["--report-dir", kLongArg],
  ["--report-directory", kLongArg],
  ["--report-filename", kLongArg],
  ["--report-signal", kLongArg],
  ["--secure-heap", kLongArg],
  ["--secure-heap-min", kLongArg],
  ["--snapshot-blob", kLongArg],
  ["--title", kLongArg],
  ["--tls-cipher-list", kLongArg],
  ["--tls-keylog", kLongArg],
  ["--unhandled-rejections", kLongArg],
  ["--use-largepages", kLongArg],
  ["--v8-pool-size", kLongArg],
]);
const kDenoSubcommands = new Set([
  "bench",
  "bundle",
  "cache",
  "check",
  "compile",
  "completions",
  "coverage",
  "doc",
  "eval",
  "fmt",
  "help",
  "info",
  "init",
  "install",
  "lint",
  "lsp",
  "repl",
  "run",
  "tasks",
  "test",
  "types",
  "uninstall",
  "upgrade",
  "vendor",
]);
function toDenoArgs(args) {
  if (args.length === 0) {
    return args;
  }
  // Update this logic as more CLI arguments are mapped from Node to Deno.
  const denoArgs = [];
  let useRunArgs = true;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.charAt(0) !== "-" || arg === "--") {
      // Not a flag or no more arguments.
      // If the arg is a Deno subcommand, then the child process is being
      // spawned as Deno, not Deno in Node compat mode. In this case, bail out
      // and return the original args.
      if (kDenoSubcommands.has(arg)) {
        return args;
      }
      // Copy of the rest of the arguments to the output.
      for (let j = i; j < args.length; j++) {
        denoArgs.push(args[j]);
      }
      break;
    }
    // Something that looks like a flag was passed.
    let flag = arg;
    let flagInfo = kNodeFlagsMap.get(arg);
    let isLongWithValue = false;
    let flagValue;
    if (flagInfo === undefined) {
      // If the flag was not found, it's either not a known flag or it's a long
      // flag containing an '='.
      const splitAt = arg.indexOf("=");
      if (splitAt !== -1) {
        flag = arg.slice(0, splitAt);
        flagInfo = kNodeFlagsMap.get(flag);
        flagValue = arg.slice(splitAt + 1);
        isLongWithValue = true;
      }
    }
    if (flagInfo === undefined) {
      // Not a known flag that expects a value. Just copy it to the output.
      denoArgs.push(arg);
      continue;
    }
    // This is a flag with a value. Get the value if we don't already have it.
    if (flagValue === undefined) {
      i++;
      if (i >= args.length) {
        // There was user error. There should be another arg for the value, but
        // there isn't one. Just copy the arg to the output. It's not going
        // to work anyway.
        denoArgs.push(arg);
        continue;
      }
      flagValue = args[i];
    }
    // Remap Node's eval flags to Deno.
    if (flag === "-e" || flag === "--eval") {
      denoArgs.push("eval", flagValue);
      useRunArgs = false;
    } else if (isLongWithValue) {
      denoArgs.push(arg);
    } else {
      denoArgs.push(flag, flagValue);
    }
  }
  if (useRunArgs) {
    // -A is not ideal, but needed to propagate permissions.
    // --unstable is needed for Node compat.
    denoArgs.unshift("run", "-A", "--unstable");
  }
  return denoArgs;
}
export default {
  ChildProcess,
  stdioStringToArray,
  spawnSync,
};
