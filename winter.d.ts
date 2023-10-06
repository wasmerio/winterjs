/**
 * The interface exposed by WinterJS.
 */

/// <reference no-default-lib="true"/>
/// <reference lib="es2015"/>


interface Performance {
    now(): number;
}
declare var performance: Performance;

interface Console {
    log: (...args: any[]) => void;
}
declare var console: Console;

interface FetchParams {
    method?: string;
    headers?: Record<string, string>;
 }
declare function fetch(url?: string, params?: FetchParams): Promise<Response>;

declare function atob(data: string): string;
declare function btoa(data: string): string;

type HeadersInit = Array<[string, string]> | Record<string, string|string[]>;
declare class Headers {
    constructor(init?: HeadersInit);
    set(key: string, value: string): void;
    append(key: string, value: string): void;
    toList(): Array<[string, string]>;
}

type RequestInit = {
    method?: string;
    headers?: Headers | HeadersInit;
    url?: string;
    body?: any;
};
declare class Request {
    constructor(init?: RequestInit);
    text(): Promise<string>;
    json(): Promise<any>;
}

type BodyInit = string | Uint8Array;
type ResponseInit = {
    status?: number;
    headers?: Headers | HeadersInit;
};
declare class Response {
    constructor(body?: BodyInit, init?: ResponseInit);
    statusText: string;
    text(): Promise<any>;
    json(): Promise<any>;
}

type ResponseLiteral = {
    status?: number;
    headers?: Record<string, string> | Headers;
    body?: BodyInit | null;
};
type FetchEvent = {
    readonly request: Request,
    respondWith(response: FetchResponse): void;
};
type FetchResponse = string | Response | ResponseLiteral;
type FetchHandler = (req: FetchEvent) => FetchResponse | Promise<FetchResponse>;
/**
 * Register a request handler that will be invoked by the server on every
 * request.
 *
 * @param ev The name of the event (always `"fetch"`)
 * @param handler A callback that will be called whenever a request is received.
 */
declare function addEventListener(ev: "fetch", handler: FetchHandler): number;

declare class TextEncoder {
    constructor();
    encode(s: string): Uint8Array;
}

declare class TextDecoder {
    constructor();
    decode(data: Uint8Array): string;
}
