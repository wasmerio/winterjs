import { getValidatedFd } from "../internal/fs/utils.mjs";
export function close(fd, callback) {
    fd = getValidatedFd(fd);
    setTimeout(() => {
        let error = null;
        try {
            Deno.close(fd);
        }
        catch (err) {
            error = err instanceof Error ? err : new Error("[non-error thrown]");
        }
        callback(error);
    }, 0);
}
export function closeSync(fd) {
    fd = getValidatedFd(fd);
    Deno.close(fd);
}
