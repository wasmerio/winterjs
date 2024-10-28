// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { fileURLToPath } from "../url";
const searchParams = Symbol("query");
export function toPathIfFileURL(fileURLOrPath) {
  if (!(fileURLOrPath instanceof URL)) {
    return fileURLOrPath;
  }
  return fileURLToPath(fileURLOrPath);
}
// Utility function that converts a URL object into an ordinary
// options object as expected by the http.request and https.request
// APIs.
// deno-lint-ignore no-explicit-any
export function urlToHttpOptions(url) {
  // deno-lint-ignore no-explicit-any
  const options = {
    protocol: url.protocol,
    hostname:
      typeof url.hostname === "string" && url.hostname.startsWith("[")
        ? url.hostname.slice(1, -1)
        : url.hostname,
    hash: url.hash,
    search: url.search,
    pathname: url.pathname,
    path: `${url.pathname || ""}${url.search || ""}`,
    href: url.href,
  };
  if (url.port !== "") {
    options.port = Number(url.port);
  }
  if (url.username || url.password) {
    options.auth = `${decodeURIComponent(url.username)}:${decodeURIComponent(
      url.password
    )}`;
  }
  return options;
}
export { searchParams as searchParamsSymbol };
export default {
  toPathIfFileURL,
};
