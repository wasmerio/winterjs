import { Headers, HeadersInit } from "./headers";

export type ResponseBody = string | Uint8Array;
export type ResponseInit = {
    status?: number;
    headers?: Headers | HeadersInit;
};

export class Response {
    status: number;
    headers: Headers;
    body: Uint8Array;

    constructor(body?: ResponseBody, init?: ResponseInit) {
        let status = 200;
        if (init?.status) {
            if (typeof init.status !== "number") {
                throw new Error("status must be a number");
            }
            status = init.status;
        }
        this.status = status;

        let headers;

        if (init?.headers) {
            if (init.headers instanceof Headers) {
                headers = init.headers;
            } else {
                headers = new Headers(init.headers);
            }
        } else {
            headers = new Headers();
        }
        this.headers = headers;

        if (body) {
            if (typeof body === "string") {
                this.body = new TextEncoder().encode(body);
            } else if (body instanceof Uint8Array) {
                this.body = body;
            } else {
                throw new Error("invalid body - must be string or Uint8Array");
            }
        } else {
            this.body = new TextEncoder().encode("");
        }

        // TODO: remove, just for debugging
        if (this.body) {
            if (!(this.body instanceof Uint8Array)) {
                throw new Error("internal error: invalid body");
            }
        }
    }

    get statusText() {
        // FIXME: fill this in!
        switch (this.status) {
            case 200:
                return "OK";
            case 404:
                return "Not Found";
            default:
                return "Unknown";
        }
    }

    async json() {
        return this.text().then(JSON.parse);
    }

    async text() {
        return new TextDecoder().decode(this.body);
    }
}
