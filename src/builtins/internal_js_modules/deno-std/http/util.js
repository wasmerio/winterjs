// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { STATUS_TEXT } from "./http_status";
import { deepMerge } from "../collections/deep_merge";
/** Returns true if the etags match. Weak etag comparisons are handled. */
export function compareEtag(a, b) {
  if (a === b) {
    return true;
  }
  if (a.startsWith("W/") && !b.startsWith("W/")) {
    return a.slice(2) === b;
  }
  if (!a.startsWith("W/") && b.startsWith("W/")) {
    return a === b.slice(2);
  }
  return false;
}
/**
 * Internal utility for returning a standardized response, automatically defining the body, status code and status text, according to the response type.
 */
export function createCommonResponse(status, body, init) {
  if (body === undefined) {
    body = STATUS_TEXT[status];
  }
  init = deepMerge(
    {
      status,
      statusText: STATUS_TEXT[status],
    },
    init ?? {}
  );
  return new Response(body, init);
}
