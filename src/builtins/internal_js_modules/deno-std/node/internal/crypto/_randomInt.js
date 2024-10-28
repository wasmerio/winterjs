export default function randomInt(max, min, cb) {
    if (typeof max === "number" && typeof min === "number") {
        [max, min] = [min, max];
    }
    if (min === undefined)
        min = 0;
    else if (typeof min === "function") {
        cb = min;
        min = 0;
    }
    if (!Number.isSafeInteger(min) ||
        typeof max === "number" && !Number.isSafeInteger(max)) {
        throw new Error("max or min is not a Safe Number");
    }
    if (max - min > Math.pow(2, 48)) {
        throw new RangeError("max - min should be less than 2^48!");
    }
    if (min >= max) {
        throw new Error("Min is bigger than Max!");
    }
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xffffffff + 1);
    min = Math.ceil(min);
    max = Math.floor(max);
    const result = Math.floor(randomNumber * (max - min)) + min;
    if (cb) {
        cb(null, result);
        return;
    }
    return result;
}
