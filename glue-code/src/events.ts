import { FetchHandler, registerFetchHandler } from "./fetch_handler";

interface EventListeners {
    fetch: FetchHandler;
}

export function addEventListener<E extends keyof EventListeners>(
    event: E,
    callback: EventListeners[E],
): number {
    if (typeof callback !== "function") {
        throw new Error("callback must be a function");
    }

    switch (event) {
        case "fetch":
            return registerFetchHandler(callback);
        default:
            throw new Error(`Unknown event type, "${event}"`);
    }
}
