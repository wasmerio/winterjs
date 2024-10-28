// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { promisify } from "../internal/util.mjs";
export function unlink(path, callback) {
    if (!callback)
        throw new Error("No callback function supplied");
    Deno.remove(path).then((_) => callback(), callback);
}
export const unlinkPromise = promisify(unlink);
export function unlinkSync(path) {
    Deno.removeSync(path);
}
