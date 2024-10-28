export function ftruncate(fd, lenOrCallback, maybeCallback) {
    const len = typeof lenOrCallback === "number"
        ? lenOrCallback
        : undefined;
    const callback = typeof lenOrCallback === "function"
        ? lenOrCallback
        : maybeCallback;
    if (!callback)
        throw new Error("No callback function supplied");
    Deno.ftruncate(fd, len).then(() => callback(null), callback);
}
export function ftruncateSync(fd, len) {
    Deno.ftruncateSync(fd, len);
}
