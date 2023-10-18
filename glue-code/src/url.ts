// TODO: Copy the URL implementation across from url.js

export class URL {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    readonly origin: string;
    password: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    username: string;

    constructor(url: string, base?: string) {
        throw new Error();
    }

    toString(): string {
        throw new Error();
    }
}
