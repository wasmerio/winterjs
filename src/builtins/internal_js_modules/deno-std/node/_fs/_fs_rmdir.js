// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  emitRecursiveRmdirWarning,
  getValidatedPath,
  validateRmdirOptions,
  validateRmOptions,
  validateRmOptionsSync,
} from "../internal/fs/utils.mjs";
import { toNamespacedPath } from "../path";
import { denoErrorToNodeError, ERR_FS_RMDIR_ENOTDIR } from "../internal/errors";
import { promisify } from "../internal/util.mjs";
export function rmdir(path, optionsOrCallback, maybeCallback) {
  path = toNamespacedPath(getValidatedPath(path));
  const callback =
    typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
  const options =
    typeof optionsOrCallback === "object" ? optionsOrCallback : undefined;
  if (!callback) throw new Error("No callback function supplied");
  if (options?.recursive) {
    emitRecursiveRmdirWarning();
    validateRmOptions(
      path,
      { ...options, force: false },
      true,
      (err, options) => {
        if (err === false) {
          return callback(new ERR_FS_RMDIR_ENOTDIR(path.toString()));
        }
        if (err) {
          return callback(err);
        }
        Deno.remove(path, { recursive: options?.recursive }).then(
          (_) => callback(),
          callback
        );
      }
    );
  } else {
    validateRmdirOptions(options);
    Deno.remove(path, { recursive: options?.recursive }).then(
      (_) => callback(),
      (err) => {
        callback(
          err instanceof Error
            ? denoErrorToNodeError(err, { syscall: "rmdir" })
            : err
        );
      }
    );
  }
}
export const rmdirPromise = promisify(rmdir);
export function rmdirSync(path, options) {
  path = getValidatedPath(path);
  if (options?.recursive) {
    emitRecursiveRmdirWarning();
    const optionsOrFalse = validateRmOptionsSync(
      path,
      {
        ...options,
        force: false,
      },
      true
    );
    if (optionsOrFalse === false) {
      throw new ERR_FS_RMDIR_ENOTDIR(path.toString());
    }
    options = optionsOrFalse;
  } else {
    validateRmdirOptions(options);
  }
  try {
    Deno.removeSync(toNamespacedPath(path), {
      recursive: options?.recursive,
    });
  } catch (err) {
    throw err instanceof Error
      ? denoErrorToNodeError(err, { syscall: "rmdir" })
      : err;
  }
}
