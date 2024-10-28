// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  O_APPEND,
  O_CREAT,
  O_EXCL,
  O_RDWR,
  O_TRUNC,
  O_WRONLY,
} from "./_fs_constants";
import { existsSync } from "../../fs/exists";
import { getOpenOptions } from "./_fs_common";
import { promisify } from "../internal/util.mjs";
import { parseFileMode } from "../internal/validators.mjs";
import { ERR_INVALID_ARG_TYPE } from "../internal/errors";
import { getValidatedPath } from "../internal/fs/utils.mjs";
const FLAGS_AX = O_APPEND | O_CREAT | O_WRONLY | O_EXCL;
const FLAGS_AX_PLUS = O_APPEND | O_CREAT | O_RDWR | O_EXCL;
const FLAGS_WX = O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;
const FLAGS_WX_PLUS = O_TRUNC | O_CREAT | O_RDWR | O_EXCL;
function convertFlagAndModeToOptions(flag, mode) {
  if (!flag && !mode) return undefined;
  if (!flag && mode) return { mode };
  return { ...getOpenOptions(flag), mode };
}
export function open(path, flags, mode, callback) {
  if (flags === undefined) {
    throw new ERR_INVALID_ARG_TYPE(
      "flags or callback",
      ["string", "function"],
      flags
    );
  }
  path = getValidatedPath(path);
  if (arguments.length < 3) {
    // deno-lint-ignore no-explicit-any
    callback = flags;
    flags = "r";
    mode = 0o666;
  } else if (typeof mode === "function") {
    callback = mode;
    mode = 0o666;
  } else {
    mode = parseFileMode(mode, "mode", 0o666);
  }
  if (typeof callback !== "function") {
    throw new ERR_INVALID_ARG_TYPE("callback", "function", callback);
  }
  if (flags === undefined) {
    flags = "r";
  }
  if (existenceCheckRequired(flags) && existsSync(path)) {
    const err = new Error(`EEXIST: file already exists, open '${path}'`);
    callback(err);
  } else {
    if (flags === "as" || flags === "as+") {
      let err = null,
        res;
      try {
        res = openSync(path, flags, mode);
      } catch (error) {
        err = error instanceof Error ? error : new Error("[non-error thrown]");
      }
      if (err) {
        callback(err);
      } else {
        callback(null, res);
      }
      return;
    }
    Deno.open(path, convertFlagAndModeToOptions(flags, mode)).then(
      (file) => callback(null, file.rid),
      (err) => callback(err)
    );
  }
}
export const openPromise = promisify(open);
export function openSync(path, flags, maybeMode) {
  const mode = parseFileMode(maybeMode, "mode", 0o666);
  path = getValidatedPath(path);
  if (flags === undefined) {
    flags = "r";
  }
  if (existenceCheckRequired(flags) && existsSync(path)) {
    throw new Error(`EEXIST: file already exists, open '${path}'`);
  }
  return Deno.openSync(path, convertFlagAndModeToOptions(flags, mode)).rid;
}
function existenceCheckRequired(flags) {
  return (
    (typeof flags === "string" && ["ax", "ax+", "wx", "wx+"].includes(flags)) ||
    (typeof flags === "number" &&
      ((flags & FLAGS_AX) === FLAGS_AX ||
        (flags & FLAGS_AX_PLUS) === FLAGS_AX_PLUS ||
        (flags & FLAGS_WX) === FLAGS_WX ||
        (flags & FLAGS_WX_PLUS) === FLAGS_WX_PLUS))
  );
}
