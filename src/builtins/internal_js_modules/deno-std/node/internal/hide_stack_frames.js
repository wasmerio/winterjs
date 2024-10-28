// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** This function removes unnecessary frames from Node.js core errors. */
export function hideStackFrames(fn) {
    // We rename the functions that will be hidden to cut off the stacktrace
    // at the outermost one.
    const hidden = "__node_internal_" + fn.name;
    Object.defineProperty(fn, "name", { value: hidden });
    return fn;
}
