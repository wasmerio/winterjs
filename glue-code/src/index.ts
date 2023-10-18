export type * from "./headers";
export type * from "./text";
export type * from "./request";
export type * from "./response";
export type * from "./fetch";
export type * from "./fetch_handler";

import * as headers from "./headers";
import * as text from "./text";
import * as events from "./events";
import { FetchHandler } from "./fetch_handler";
import * as consoleShim from "./console";
import * as performanceShim from "./performance";
import * as fetchShim from "./fetch";
import { Response } from "./response";

declare global {
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

    export function fetch(
        url: string,
        params: fetchShim.FetchParams,
    ): Promise<Response>;
}

globalThis.TextEncoder = text.TextEncoder;
globalThis.TextDecoder = text.TextDecoder;
globalThis.Headers = headers.Headers;
globalThis.console = { log: consoleShim.log };
globalThis.performance = { now: performanceShim.now };
globalThis.addEventListener = events.addEventListener;
globalThis.fetch = fetchShim.fetch;
