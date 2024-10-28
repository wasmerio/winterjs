import { fromFileUrl } from "../path";
import { Buffer } from "../buffer";
import { writeAllSync } from "../../streams/write_all";
import {
  checkEncoding,
  getEncoding,
  getOpenOptions,
  isFileOptions,
} from "./_fs_common";
import { isWindows } from "../../_util/os";
import { AbortError, denoErrorToNodeError } from "../internal/errors";
import {
  showStringCoercionDeprecation,
  validateStringAfterArrayBufferView,
} from "../internal/fs/utils.mjs";
import { promisify } from "../internal/util.mjs";
export function writeFile(
  pathOrRid,
  // deno-lint-ignore ban-types
  data,
  optOrCallback,
  callback
) {
  const callbackFn =
    optOrCallback instanceof Function ? optOrCallback : callback;
  const options = optOrCallback instanceof Function ? undefined : optOrCallback;
  if (!callbackFn) {
    throw new TypeError("Callback must be a function.");
  }
  pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;
  const flag = isFileOptions(options) ? options.flag : undefined;
  const mode = isFileOptions(options) ? options.mode : undefined;
  const encoding = checkEncoding(getEncoding(options)) || "utf8";
  const openOptions = getOpenOptions(flag || "w");
  if (!ArrayBuffer.isView(data)) {
    validateStringAfterArrayBufferView(data, "data");
    if (typeof data !== "string") {
      showStringCoercionDeprecation();
    }
    data = Buffer.from(String(data), encoding);
  }
  const isRid = typeof pathOrRid === "number";
  let file;
  let error = null;
  (async () => {
    try {
      file = isRid
        ? new Deno.FsFile(pathOrRid)
        : await Deno.open(pathOrRid, openOptions);
      // ignore mode because it's not supported on windows
      // TODO: remove `!isWindows` when `Deno.chmod` is supported
      if (!isRid && mode && !isWindows) {
        await Deno.chmod(pathOrRid, mode);
      }
      const signal = isFileOptions(options) ? options.signal : undefined;
      await writeAll(file, data, { signal });
    } catch (e) {
      error =
        e instanceof Error
          ? denoErrorToNodeError(e, { syscall: "write" })
          : new Error("[non-error thrown]");
    } finally {
      // Make sure to close resource
      if (!isRid && file) file.close();
      callbackFn(error);
    }
  })();
}
export const writeFilePromise = promisify(writeFile);
export function writeFileSync(
  pathOrRid,
  // deno-lint-ignore ban-types
  data,
  options
) {
  pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;
  const flag = isFileOptions(options) ? options.flag : undefined;
  const mode = isFileOptions(options) ? options.mode : undefined;
  const encoding = checkEncoding(getEncoding(options)) || "utf8";
  const openOptions = getOpenOptions(flag || "w");
  if (!ArrayBuffer.isView(data)) {
    validateStringAfterArrayBufferView(data, "data");
    if (typeof data !== "string") {
      showStringCoercionDeprecation();
    }
    data = Buffer.from(String(data), encoding);
  }
  const isRid = typeof pathOrRid === "number";
  let file;
  let error = null;
  try {
    file = isRid
      ? new Deno.FsFile(pathOrRid)
      : Deno.openSync(pathOrRid, openOptions);
    // ignore mode because it's not supported on windows
    // TODO: remove `!isWindows` when `Deno.chmod` is supported
    if (!isRid && mode && !isWindows) {
      Deno.chmodSync(pathOrRid, mode);
    }
    writeAllSync(file, data);
  } catch (e) {
    error =
      e instanceof Error
        ? denoErrorToNodeError(e, { syscall: "write" })
        : new Error("[non-error thrown]");
  } finally {
    // Make sure to close resource
    if (!isRid && file) file.close();
  }
  if (error) throw error;
}
async function writeAll(w, arr, options = {}) {
  const { offset = 0, length = arr.byteLength, signal } = options;
  checkAborted(signal);
  const written = await w.write(arr.subarray(offset, offset + length));
  if (written === length) {
    return;
  }
  await writeAll(w, arr, {
    offset: offset + written,
    length: length - written,
    signal,
  });
}
function checkAborted(signal) {
  if (signal?.aborted) {
    throw new AbortError();
  }
}
