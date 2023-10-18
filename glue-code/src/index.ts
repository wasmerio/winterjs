export type * from "./headers";
export type * from "./text";
export type * from "./request";
export type * from "./response";
export type * from "./fetch";
export type * from "./url";
export type * from "./fetch_handler";

import * as headers from "./headers";
import * as text from "./text";
import * as url from "./url";
import * as events from "./events";
import { FetchHandler } from "./fetch_handler";
import * as con from "./console";
import * as perf from "./performance";

declare global {
    export var URL: typeof url.URL;
    export var TextEncoder: typeof text.TextEncoder;
    export var TextDecoder: typeof text.TextDecoder;
    export var Headers: typeof headers.Headers;

    interface Console {
        log(...args: any[]): void;
    }
    export var console: Console;

    interface Performance {
        now(): number;
    }
    export var performance: Performance;

    export function addEventListener(
        event: "fetch",
        callback: FetchHandler,
    ): void;
}

globalThis.TextEncoder = text.TextEncoder;
globalThis.TextDecoder = text.TextDecoder;
globalThis.Headers = headers.Headers;
globalThis.addEventListener = events.addEventListener;
globalThis.console = { log: con.log };
globalThis.performance = { now: perf.now };
