export function fsync(fd, callback) {
    Deno.fsync(fd).then(() => callback(null), callback);
}
export function fsyncSync(fd) {
    Deno.fsyncSync(fd);
}
