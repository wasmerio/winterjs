export type HeadersInit =
    | Array<[string, string]>
    | Record<string, string | string[]>;

export class Headers {
    private items: Record<string, string[]> = {};

    constructor(init?: HeadersInit) {
        if (Array.isArray(init)) {
            const items = new Map();
            for (const item of init) {
                if (!Array.isArray(item) || item.length !== 2) {
                    throw new Error(
                        "init must be an array of [name, value] tuples",
                    );
                }
                const [name, value] = item;
                this.set(name, value);
            }
        } else if (typeof init === "object") {
            for (const [name, value] of Object.entries(init)) {
                if (typeof value === "string") {
                    this.set(name, value);
                } else if (Array.isArray(value)) {
                    for (const x of value) {
                        if (typeof x !== "string") {
                            throw new Error(
                                "HeaderInit object key contained array with non-string values",
                            );
                        }
                    }
                    this.items[name] = value;
                } else {
                    throw new Error(
                        "HeaderInit object contained non-string values",
                    );
                }
            }
        } else if (init) {
            throw new Error("init must be an array, object, or null/undefined");
        }
    }

    set(key: string, value: string): void {
        if (typeof key !== "string") {
            throw new Error("key must be a string");
        }
        if (typeof value !== "string") {
            throw new Error("value must be a string");
        }

        this.items[key] = [value];
    }

    append(key: string, value: string): void {
        if (typeof key !== "string") {
            throw new Error("key must be a string");
        }
        if (typeof value !== "string") {
            throw new Error("value must be a string");
        }

        if (this.items[key]) {
            this.items[key].push(value);
        } else {
            this.items[key] = [value];
        }
    }

    toList(): Array<[string, string]> {
        const items: Array<[string, string]> = [];

        for (const [name, values] of Object.entries(this.items)) {
            for (const value of values) {
                items.push([name, value]);
            }
        }

        return items;
    }
}
