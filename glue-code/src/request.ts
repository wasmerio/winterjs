import { Headers, HeadersInit } from "./headers";

export type RequestBody = any;
export type RequestInit = {
    method?: string;
    headers?: Headers | HeadersInit;
    url?: string;
    body?: RequestBody;
};

export class Request {
    readonly method: string;
    readonly headers: Headers;
    readonly body?: RequestBody;
    readonly url: InstanceType<typeof URL>;

    constructor(init?: RequestInit) {
        if (init?.method) {
            if (typeof init.method !== "string") {
                throw new Error("method must be a string");
            }
            this.method = init.method;
        } else {
            this.method = "GET";
        }

        if (init?.headers) {
            if (init.headers instanceof Headers) {
                this.headers = init.headers;
            } else {
                this.headers = new Headers(init.headers);
            }
        } else {
            this.headers = new Headers();
        }

        if (init?.url) {
            this.url = new URL(init.url);
        } else {
            this.url = new URL("/");
        }

        // FIXME: implement body validation / conversion
        this.body = init?.body;
    }

    async text() {
        return new TextDecoder().decode(this.body);
    }

    async json() {
        const v = await this.text();
        return JSON.parse(v);
    }
}
