// polyfill for functions/classes missing from spiderfire

globalThis.Headers = http.Headers;
globalThis.Request = http.Request;
globalThis.Response = http.Response;

globalThis.fetch = function(resource, options) {
  return http.request(resource, options?.method ?? "GET", options);
};