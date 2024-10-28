// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { promisify } from "../internal/util.mjs";
export function realpath(path, options, callback) {
    if (typeof options === "function") {
        callback = options;
    }
    if (!callback) {
        throw new Error("No callback function supplied");
    }
    Deno.realPath(path).then((path) => callback(null, path), (err) => callback(err));
}
realpath.native = realpath;
export const realpathPromise = promisify(realpath);
export function realpathSync(path) {
    return Deno.realPathSync(path);
}
realpathSync.native = realpathSync;
