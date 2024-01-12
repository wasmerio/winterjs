import {
  handleHello,
  handleBlob,
  handleFormData,
  handleRequest,
  handleResponse,
  handleTextEncoder,
  handleTextDecoder,
  handleURL,
  handleAtobBtoA,
  handleFetch,
  handleStreams,
  handlePerformance,
  handleTransformStream,
} from "./test-files/index.js";

function router(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith("/1-hello")) {
    return handleHello(req);
  }
  if (path.startsWith("/2-blob")) {
    return handleBlob(req);
  }
  if (path.startsWith("/3-headers")) {
    return handleFormData(req);
  }
  if (path.startsWith("/4-request")) {
    return handleRequest(req);
  }
  if (path.startsWith("/5-response")) {
    return handleResponse(req);
  }
  if (path.startsWith("/6-text-encoder")) {
    return handleTextEncoder(req);
  }
  if (path.startsWith("/7-text-decoder")) {
    return handleTextDecoder(req);
  }
  if (path.startsWith("/8-url")) {
    return handleURL(req);
  }
  if (path.startsWith("/10-atob-btoa")) {
    return handleAtobBtoA(req);
  }
  if (path.startsWith("/11-fetch")) {
    return handleFetch(req);
  }
  if (path.startsWith("/12-streams")) {
    return handleStreams(req);
  }
  if (path.startsWith("/12.1-transform-stream")) {
    return handleTransformStream(req);
  }
  if (path.startsWith("/13-performance")) {
    return handlePerformance(req);
  }
  return new Response(`Route Not Found - ${path}`, { status: 404 });
}

addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(router(fetchEvent.request));
});
