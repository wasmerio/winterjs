import { promisify } from "../internal/util.mjs";
import { denoErrorToNodeError } from "../internal/errors";
import { getValidatedPath } from "../internal/fs/utils.mjs";
import { validateBoolean } from "../internal/validators.mjs";
export function mkdir(path, options, callback) {
  path = getValidatedPath(path);
  let mode = 0o777;
  let recursive = false;
  if (typeof options == "function") {
    callback = options;
  } else if (typeof options === "number") {
    mode = options;
  } else if (typeof options === "boolean") {
    recursive = options;
  } else if (options) {
    if (options.recursive !== undefined) recursive = options.recursive;
    if (options.mode !== undefined) mode = options.mode;
  }
  validateBoolean(recursive, "options.recursive");
  Deno.mkdir(path, { recursive, mode }).then(
    () => {
      if (typeof callback === "function") {
        callback(null);
      }
    },
    (err) => {
      if (typeof callback === "function") {
        callback(err);
      }
    }
  );
}
export const mkdirPromise = promisify(mkdir);
export function mkdirSync(path, options) {
  path = getValidatedPath(path);
  let mode = 0o777;
  let recursive = false;
  if (typeof options === "number") {
    mode = options;
  } else if (typeof options === "boolean") {
    recursive = options;
  } else if (options) {
    if (options.recursive !== undefined) recursive = options.recursive;
    if (options.mode !== undefined) mode = options.mode;
  }
  validateBoolean(recursive, "options.recursive");
  try {
    Deno.mkdirSync(path, { recursive, mode });
  } catch (err) {
    throw denoErrorToNodeError(err, { syscall: "mkdir", path });
  }
}
