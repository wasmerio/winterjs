// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html
import { core } from "./_core";
import {
  ChildProcess,
  normalizeSpawnArguments,
  spawnSync as _spawnSync,
  stdioStringToArray,
} from "./internal/child_process";
import {
  validateAbortSignal,
  validateFunction,
  validateObject,
  validateString,
} from "./internal/validators.mjs";
import {
  ERR_CHILD_PROCESS_IPC_REQUIRED,
  ERR_CHILD_PROCESS_STDIO_MAXBUFFER,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_OUT_OF_RANGE,
  genericNodeError,
} from "./internal/errors";
import {
  ArrayIsArray,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ObjectAssign,
  StringPrototypeSlice,
} from "./internal/primordials.mjs";
import { getSystemErrorName, promisify } from "./util";
import { createDeferredPromise } from "./internal/util.mjs";
import { process } from "./process";
import { Buffer } from "./buffer";
import { convertToValidSignal, kEmptyObject } from "./internal/util.mjs";
const MAX_BUFFER = 1024 * 1024;
/**
 * Spawns a new Node.js process + fork.
 * @param modulePath
 * @param args
 * @param option
 * @returns
 */
export function fork(modulePath, _args, _options) {
  validateString(modulePath, "modulePath");
  // Get options and args arguments.
  let execArgv;
  let options = {};
  let args = [];
  let pos = 1;
  if (pos < arguments.length && Array.isArray(arguments[pos])) {
    args = arguments[pos++];
  }
  if (pos < arguments.length && arguments[pos] == null) {
    pos++;
  }
  if (pos < arguments.length && arguments[pos] != null) {
    if (typeof arguments[pos] !== "object") {
      throw new ERR_INVALID_ARG_VALUE(`arguments[${pos}]`, arguments[pos]);
    }
    options = { ...arguments[pos++] };
  }
  // Prepare arguments for fork:
  execArgv = options.execArgv || process.execArgv;
  if (execArgv === process.execArgv && process._eval != null) {
    const index = execArgv.lastIndexOf(process._eval);
    if (index > 0) {
      // Remove the -e switch to avoid fork bombing ourselves.
      execArgv = execArgv.slice(0);
      execArgv.splice(index - 1, 2);
    }
  }
  // TODO(bartlomieju): this is incomplete, currently only handling a single
  // V8 flag to get Prisma integration running, we should fill this out with
  // more
  const v8Flags = [];
  if (Array.isArray(execArgv)) {
    for (let index = 0; index < execArgv.length; index++) {
      const flag = execArgv[index];
      if (flag.startsWith("--max-old-space-size")) {
        execArgv.splice(index, 1);
        v8Flags.push(flag);
      }
    }
  }
  const stringifiedV8Flags = [];
  if (v8Flags.length > 0) {
    stringifiedV8Flags.push("--v8-flags=" + v8Flags.join(","));
  }
  args = [
    "run",
    "--unstable", // TODO(kt3k): Remove when npm: is stable
    "--node-modules-dir",
    "-A",
    ...stringifiedV8Flags,
    ...execArgv,
    modulePath,
    ...args,
  ];
  if (typeof options.stdio === "string") {
    options.stdio = stdioStringToArray(options.stdio, "ipc");
  } else if (!Array.isArray(options.stdio)) {
    // Use a separate fd=3 for the IPC channel. Inherit stdin, stdout,
    // and stderr from the parent if silent isn't set.
    options.stdio = stdioStringToArray(
      options.silent ? "pipe" : "inherit",
      "ipc"
    );
  } else if (!options.stdio.includes("ipc")) {
    throw new ERR_CHILD_PROCESS_IPC_REQUIRED("options.stdio");
  }
  options.execPath = options.execPath || Deno.execPath();
  options.shell = false;
  Object.assign((options.env ??= {}), {
    DENO_DONT_USE_INTERNAL_NODE_COMPAT_STATE: core.ops.op_npm_process_state(),
  });
  return spawn(options.execPath, args, options);
}
/**
 * Spawns a child process using `command`.
 */
export function spawn(command, argsOrOptions, maybeOptions) {
  const args = Array.isArray(argsOrOptions) ? argsOrOptions : [];
  const options =
    !Array.isArray(argsOrOptions) && argsOrOptions != null
      ? argsOrOptions
      : maybeOptions;
  validateAbortSignal(options?.signal, "options.signal");
  return new ChildProcess(command, args, options);
}
function validateTimeout(timeout) {
  if (timeout != null && !(Number.isInteger(timeout) && timeout >= 0)) {
    throw new ERR_OUT_OF_RANGE("timeout", "an unsigned integer", timeout);
  }
}
function validateMaxBuffer(maxBuffer) {
  if (maxBuffer != null && !(typeof maxBuffer === "number" && maxBuffer >= 0)) {
    throw new ERR_OUT_OF_RANGE(
      "options.maxBuffer",
      "a positive number",
      maxBuffer
    );
  }
}
function sanitizeKillSignal(killSignal) {
  if (typeof killSignal === "string" || typeof killSignal === "number") {
    return convertToValidSignal(killSignal);
  } else if (killSignal != null) {
    throw new ERR_INVALID_ARG_TYPE(
      "options.killSignal",
      ["string", "number"],
      killSignal
    );
  }
}
export function spawnSync(command, argsOrOptions, maybeOptions) {
  const args = Array.isArray(argsOrOptions) ? argsOrOptions : [];
  let options =
    !Array.isArray(argsOrOptions) && argsOrOptions
      ? argsOrOptions
      : maybeOptions;
  options = {
    maxBuffer: MAX_BUFFER,
    ...normalizeSpawnArguments(command, args, options),
  };
  // Validate the timeout, if present.
  validateTimeout(options.timeout);
  // Validate maxBuffer, if present.
  validateMaxBuffer(options.maxBuffer);
  // Validate and translate the kill signal, if present.
  sanitizeKillSignal(options.killSignal);
  return _spawnSync(command, args, options);
}
function normalizeExecArgs(command, optionsOrCallback, maybeCallback) {
  let callback = maybeCallback;
  if (typeof optionsOrCallback === "function") {
    callback = optionsOrCallback;
    optionsOrCallback = undefined;
  }
  // Make a shallow copy so we don't clobber the user's options object.
  const options = { ...optionsOrCallback };
  options.shell = typeof options.shell === "string" ? options.shell : true;
  return {
    file: command,
    options: options,
    callback: callback,
  };
}
export function exec(command, optionsOrCallback, maybeCallback) {
  const opts = normalizeExecArgs(command, optionsOrCallback, maybeCallback);
  return execFile(opts.file, opts.options, opts.callback);
}
const customPromiseExecFunction = (orig) => {
  return (...args) => {
    const { promise, resolve, reject } = createDeferredPromise();
    promise.child = orig(...args, (err, stdout, stderr) => {
      if (err !== null) {
        const _err = err;
        _err.stdout = stdout;
        _err.stderr = stderr;
        reject && reject(_err);
      } else {
        resolve && resolve({ stdout, stderr });
      }
    });
    return promise;
  };
};
Object.defineProperty(exec, promisify.custom, {
  enumerable: false,
  value: customPromiseExecFunction(exec),
});
class ExecFileError extends Error {
  code;
  constructor(message) {
    super(message);
    this.code = "UNKNOWN";
  }
}
export function execFile(
  file,
  argsOrOptionsOrCallback,
  optionsOrCallback,
  maybeCallback
) {
  let args = [];
  let options = {};
  let callback;
  if (Array.isArray(argsOrOptionsOrCallback)) {
    args = argsOrOptionsOrCallback;
  } else if (argsOrOptionsOrCallback instanceof Function) {
    callback = argsOrOptionsOrCallback;
  } else if (argsOrOptionsOrCallback) {
    options = argsOrOptionsOrCallback;
  }
  if (optionsOrCallback instanceof Function) {
    callback = optionsOrCallback;
  } else if (optionsOrCallback) {
    options = optionsOrCallback;
    callback = maybeCallback;
  }
  const execOptions = {
    encoding: "utf8",
    timeout: 0,
    maxBuffer: MAX_BUFFER,
    killSignal: "SIGTERM",
    shell: false,
    ...options,
  };
  if (!Number.isInteger(execOptions.timeout) || execOptions.timeout < 0) {
    // In Node source, the first argument to error constructor is "timeout" instead of "options.timeout".
    // timeout is indeed a member of options object.
    throw new ERR_OUT_OF_RANGE(
      "timeout",
      "an unsigned integer",
      execOptions.timeout
    );
  }
  if (execOptions.maxBuffer < 0) {
    throw new ERR_OUT_OF_RANGE(
      "options.maxBuffer",
      "a positive number",
      execOptions.maxBuffer
    );
  }
  const spawnOptions = {
    cwd: execOptions.cwd,
    env: execOptions.env,
    gid: execOptions.gid,
    shell: execOptions.shell,
    signal: execOptions.signal,
    uid: execOptions.uid,
    windowsHide: !!execOptions.windowsHide,
    windowsVerbatimArguments: !!execOptions.windowsVerbatimArguments,
  };
  const child = spawn(file, args, spawnOptions);
  let encoding;
  const _stdout = [];
  const _stderr = [];
  if (
    execOptions.encoding !== "buffer" &&
    Buffer.isEncoding(execOptions.encoding)
  ) {
    encoding = execOptions.encoding;
  } else {
    encoding = null;
  }
  let stdoutLen = 0;
  let stderrLen = 0;
  let killed = false;
  let exited = false;
  let timeoutId;
  let ex = null;
  let cmd = file;
  function exithandler(code = 0, signal) {
    if (exited) return;
    exited = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (!callback) return;
    // merge chunks
    let stdout;
    let stderr;
    if (encoding || (child.stdout && child.stdout.readableEncoding)) {
      stdout = _stdout.join("");
    } else {
      stdout = Buffer.concat(_stdout);
    }
    if (encoding || (child.stderr && child.stderr.readableEncoding)) {
      stderr = _stderr.join("");
    } else {
      stderr = Buffer.concat(_stderr);
    }
    if (!ex && code === 0 && signal === null) {
      callback(null, stdout, stderr);
      return;
    }
    if (args?.length) {
      cmd += ` ${args.join(" ")}`;
    }
    if (!ex) {
      ex = new ExecFileError("Command failed: " + cmd + "\n" + stderr);
      ex.code = code < 0 ? getSystemErrorName(code) : code;
      ex.killed = child.killed || killed;
      ex.signal = signal;
    }
    ex.cmd = cmd;
    callback(ex, stdout, stderr);
  }
  function errorhandler(e) {
    ex = e;
    if (child.stdout) {
      child.stdout.destroy();
    }
    if (child.stderr) {
      child.stderr.destroy();
    }
    exithandler();
  }
  function kill() {
    if (child.stdout) {
      child.stdout.destroy();
    }
    if (child.stderr) {
      child.stderr.destroy();
    }
    killed = true;
    try {
      child.kill(execOptions.killSignal);
    } catch (e) {
      if (e) {
        ex = e;
      }
      exithandler();
    }
  }
  if (execOptions.timeout > 0) {
    timeoutId = setTimeout(function delayedKill() {
      kill();
      timeoutId = null;
    }, execOptions.timeout);
  }
  if (child.stdout) {
    if (encoding) {
      child.stdout.setEncoding(encoding);
    }
    child.stdout.on("data", function onChildStdout(chunk) {
      // Do not need to count the length
      if (execOptions.maxBuffer === Infinity) {
        ArrayPrototypePush(_stdout, chunk);
        return;
      }
      const encoding = child.stdout?.readableEncoding;
      const length = encoding
        ? Buffer.byteLength(chunk, encoding)
        : chunk.length;
      const slice = encoding
        ? StringPrototypeSlice
        : (buf, ...args) => buf.slice(...args);
      stdoutLen += length;
      if (stdoutLen > execOptions.maxBuffer) {
        const truncatedLen = execOptions.maxBuffer - (stdoutLen - length);
        ArrayPrototypePush(_stdout, slice(chunk, 0, truncatedLen));
        ex = new ERR_CHILD_PROCESS_STDIO_MAXBUFFER("stdout");
        kill();
      } else {
        ArrayPrototypePush(_stdout, chunk);
      }
    });
  }
  if (child.stderr) {
    if (encoding) {
      child.stderr.setEncoding(encoding);
    }
    child.stderr.on("data", function onChildStderr(chunk) {
      // Do not need to count the length
      if (execOptions.maxBuffer === Infinity) {
        ArrayPrototypePush(_stderr, chunk);
        return;
      }
      const encoding = child.stderr?.readableEncoding;
      const length = encoding
        ? Buffer.byteLength(chunk, encoding)
        : chunk.length;
      const slice = encoding
        ? StringPrototypeSlice
        : (buf, ...args) => buf.slice(...args);
      stderrLen += length;
      if (stderrLen > execOptions.maxBuffer) {
        const truncatedLen = execOptions.maxBuffer - (stderrLen - length);
        ArrayPrototypePush(_stderr, slice(chunk, 0, truncatedLen));
        ex = new ERR_CHILD_PROCESS_STDIO_MAXBUFFER("stderr");
        kill();
      } else {
        ArrayPrototypePush(_stderr, chunk);
      }
    });
  }
  child.addListener("close", exithandler);
  child.addListener("error", errorhandler);
  return child;
}
const customPromiseExecFileFunction = (orig) => {
  return (...args) => {
    const { promise, resolve, reject } = createDeferredPromise();
    promise.child = orig(...args, (err, stdout, stderr) => {
      if (err !== null) {
        const _err = err;
        _err.stdout = stdout;
        _err.stderr = stderr;
        reject && reject(_err);
      } else {
        resolve && resolve({ stdout, stderr });
      }
    });
    return promise;
  };
};
Object.defineProperty(execFile, promisify.custom, {
  enumerable: false,
  value: customPromiseExecFileFunction(execFile),
});
function checkExecSyncError(ret, args, cmd) {
  let err;
  if (ret.error) {
    err = ret.error;
    ObjectAssign(err, ret);
  } else if (ret.status !== 0) {
    let msg = "Command failed: ";
    msg += cmd || ArrayPrototypeJoin(args, " ");
    if (ret.stderr && ret.stderr.length > 0) {
      msg += `\n${ret.stderr.toString()}`;
    }
    err = genericNodeError(msg, ret);
  }
  return err;
}
export function execSync(command, options) {
  const opts = normalizeExecArgs(command, options);
  const inheritStderr = !opts.options.stdio;
  const ret = spawnSync(opts.file, opts.options);
  if (inheritStderr && ret.stderr) {
    process.stderr.write(ret.stderr);
  }
  const err = checkExecSyncError(ret, [], command);
  if (err) {
    throw err;
  }
  return ret.stdout;
}
function normalizeExecFileArgs(file, args, options, callback) {
  if (ArrayIsArray(args)) {
    args = ArrayPrototypeSlice(args);
  } else if (args != null && typeof args === "object") {
    callback = options;
    options = args;
    args = null;
  } else if (typeof args === "function") {
    callback = args;
    options = null;
    args = null;
  }
  if (args == null) {
    args = [];
  }
  if (typeof options === "function") {
    callback = options;
  } else if (options != null) {
    validateObject(options, "options");
  }
  if (options == null) {
    options = kEmptyObject;
  }
  args = args;
  options = options;
  if (callback != null) {
    validateFunction(callback, "callback");
  }
  // Validate argv0, if present.
  if (options.argv0 != null) {
    validateString(options.argv0, "options.argv0");
  }
  return { file, args, options, callback };
}
export function execFileSync(file, args, options) {
  ({ file, args, options } = normalizeExecFileArgs(file, args, options));
  const inheritStderr = !options.stdio;
  const ret = spawnSync(file, args, options);
  if (inheritStderr && ret.stderr) {
    process.stderr.write(ret.stderr);
  }
  const errArgs = [options.argv0 || file, ...args];
  const err = checkExecSyncError(ret, errArgs);
  if (err) {
    throw err;
  }
  return ret.stdout;
}
export default {
  fork,
  spawn,
  exec,
  execFile,
  execFileSync,
  execSync,
  ChildProcess,
  spawnSync,
};
export { ChildProcess };
