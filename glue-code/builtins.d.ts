/**!
 * Native functions that are exposed by the WinterJS VM.
 */

import { Request, Response, FetchParams } from "./src";

declare global {
    function __native_performance_now(): number;
    function __native_atob(): string;
    function __native_btoa(): string;
    function __native_log(...args: any[]): void;
    function __native_fetch(
        resolve: (r: RawResponse | undefined) => void,
        reject: () => void,
        url?: string,
        params?: FetchParams,
    ): void;
    var __wasmer_callFetchHandler: (
        request: Request,
    ) => Response | Promise<Response>;
}

type RawResponse = {
    body: string;
    headers: Record<string, string>;
};

export {};
