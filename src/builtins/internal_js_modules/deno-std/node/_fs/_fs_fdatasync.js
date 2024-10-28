export function fdatasync(fd, callback) {
    Deno.fdatasync(fd).then(() => callback(null), callback);
}
export function fdatasyncSync(fd) {
    Deno.fdatasyncSync(fd);
}
