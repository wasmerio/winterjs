import { getValidatedPath } from "../internal/fs/utils.mjs";
import * as pathModule from "../../path/mod";
import { parseFileMode } from "../internal/validators.mjs";
import { promisify } from "../internal/util.mjs";
export function chmod(path, mode, callback) {
  path = getValidatedPath(path).toString();
  mode = parseFileMode(mode, "mode");
  Deno.chmod(pathModule.toNamespacedPath(path), mode)
    .catch((error) => {
      // Ignore NotSupportedError that occurs on windows
      // https://github.com/denoland/deno_std/issues/2995
      if (!(error instanceof Deno.errors.NotSupported)) {
        throw error;
      }
    })
    .then(() => callback(null), callback);
}
export const chmodPromise = promisify(chmod);
export function chmodSync(path, mode) {
  path = getValidatedPath(path).toString();
  mode = parseFileMode(mode, "mode");
  try {
    Deno.chmodSync(pathModule.toNamespacedPath(path), mode);
  } catch (error) {
    // Ignore NotSupportedError that occurs on windows
    // https://github.com/denoland/deno_std/issues/2995
    if (!(error instanceof Deno.errors.NotSupported)) {
      throw error;
    }
  }
}
