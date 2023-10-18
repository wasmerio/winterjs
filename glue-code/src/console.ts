export function log() {
    __native_log.apply(
        null,
        Object.values(arguments).map(arg => JSON.stringify(arg)),
    );
}
