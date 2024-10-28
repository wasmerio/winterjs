// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const NEWLINE_REGEXP = /\r\n|\r|\n/;
const encoder = new TextEncoder();
function assertHasNoNewline(value, varName, errPrefix) {
    if (value.match(NEWLINE_REGEXP) !== null) {
        throw new SyntaxError(`${errPrefix}: ${varName} cannot contain a newline`);
    }
}
/**
 * Converts a server-sent message object into a string for the client.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format}
 */
function stringify(message) {
    const lines = [];
    if (message.comment) {
        assertHasNoNewline(message.comment, "`message.comment`", "Cannot serialize message");
        lines.push(`:${message.comment}`);
    }
    if (message.event) {
        assertHasNoNewline(message.event, "`message.event`", "Cannot serialize message");
        lines.push(`event:${message.event}`);
    }
    if (message.data) {
        message.data.split(NEWLINE_REGEXP).forEach((line) => lines.push(`data:${line}`));
    }
    if (message.id) {
        assertHasNoNewline(message.id.toString(), "`message.id`", "Cannot serialize message");
        lines.push(`id:${message.id}`);
    }
    if (message.retry)
        lines.push(`retry:${message.retry}`);
    return encoder.encode(lines.join("\n") + "\n\n");
}
/**
 * Transforms server-sent message objects into strings for the client.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events}
 *
 * @example Usage
 * ```ts no-assert
 * import {
 *   type ServerSentEventMessage,
 *   ServerSentEventStream,
 * } from "@std/http/server-sent-event-stream";
 *
 * const stream = ReadableStream.from<ServerSentEventMessage>([
 *   { data: "hello there" }
 * ]).pipeThrough(new ServerSentEventStream());
 * new Response(stream, {
 *   headers: {
 *     "content-type": "text/event-stream",
 *     "cache-control": "no-cache",
 *   },
 * });
 * ```
 */
export class ServerSentEventStream extends TransformStream {
    constructor() {
        super({
            transform: (message, controller) => {
                controller.enqueue(stringify(message));
            },
        });
    }
}
