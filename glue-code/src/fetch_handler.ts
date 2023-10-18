import { Headers } from "./headers";
import { Request } from "./request";
import { Response, ResponseBody } from "./response";

export type ResponseLiteral = {
    status?: number;
    headers?: Record<string, string> | Headers;
    body?: ResponseBody | null;
};

export type FetchResponse = string | Response | ResponseLiteral;

export type FetchHandler = (
    req: Request,
) => FetchResponse | Promise<FetchResponse> | void;

const FETCH_HANDLERS: Record<number, FetchHandler> = {};

/**
 * Register a request handler that will be invoked by the server on every
 * request.
 *
 * @param ev The name of the event (always `"fetch"`)
 * @param handler A callback that will be called whenever a request is received.
 */
export function registerFetchHandler(callback: FetchHandler): number {
    const index = Object.keys(FETCH_HANDLERS).length;

    // TODO: support multiple handlers
    if (index > 0) {
        throw new Error("only one fetch handler is supported");
    }
    FETCH_HANDLERS[index] = callback;
    return index;
}

function convertValueToResponseData(
    value: Response | ResponseLiteral | ResponseBody,
): Response {
    if (value instanceof Response) {
        return value;
    } else if (typeof value == "string") {
        return new Response(value);
    } else if (typeof value === "object") {
        let status = 200;
        if ("status" in value) {
            if (typeof value.status !== "number") {
                throw new Error("status must be a number");
            }
            status = value.status;
        }

        const headers = "headers" in value ? value.headers : {};
        const body = "body" in value ? value.body : null;

        return new Response(body || undefined, { status, headers });
    } else {
        throw new Error("unsupported response type: " + JSON.stringify(value));
    }
}

globalThis.__wasmer_callFetchHandler = function (
    request: Request,
): Response | Promise<Response> {
    // FIXME: add support for multiple handlers?

    if (!(request instanceof Request)) {
        throw new TypeError("request must be an instance of the Request class");
    }

    const items = Object.values(FETCH_HANDLERS);
    if (items.length === 0) {
        throw new Error("no fetch handlers registered");
    }

    let res = items[0](request);

    if (!res) {
        throw new Error("fetch handler returned null");
    }

    if (isAwaitable(res)) {
        return res.then(convertValueToResponseData);
    } else {
        const o = convertValueToResponseData(res);
        if (!(o instanceof Response)) {
            throw new Error(
                "internal error: response must be an instance of the Response class",
            );
        }
        if (o.body && !(o.body instanceof Uint8Array)) {
            throw new Error(
                "response body must be undefined/null or an Uint8Array",
            );
        }
        return o;
    }
};

function isAwaitable(value: any): value is Promise<unknown> {
    return value?.hasOwnProperty("then") || typeof value.then == "function";
}
