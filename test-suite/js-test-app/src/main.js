import {
  handleHello1,
  handleBlob2,
  handleFormData3,
  handleRequest4,
  handleResponse5,
  handleTextEncoder6,
  handleTextDecoder7,
  handleURL8,
  handleAtobBtoA9,
  handleFetch,
  handleStreams,
} from "./test-files/index.js";

function router(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith("/1-hello")) {
    return handleHello1(req);
  }
  if (path.startsWith("/2-blob")) {
    return handleBlob2(req);
  }
  if (path.startsWith("/3-headers")) {
    return handleFormData3(req);
  }
  if (path.startsWith("/4-request")) {
    return handleRequest4(req);
  }
  if (path.startsWith("/5-response")) {
    return handleResponse5(req);
  }
  if (path.startsWith("/6-text-encoder")) {
    return handleTextEncoder6(req);
  }
  if (path.startsWith("/7-text-decoder")) {
    return handleTextDecoder7(req);
  }
  if (path.startsWith("/8-url")) {
    return handleURL8(req);
  }
  if (path.startsWith("/10-atob-btoa")) {
    return handleAtobBtoA9(req);
  }
  if (path.startsWith("/11-fetch")) {
    return handleFetch(req);
  }
  if (path.startsWith("/12-streams")) {
    return handleStreams(req);
  }
  return new Response(`Route Not Found - ${path}`, { status: 404 });
}

addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(router(fetchEvent.request));
});
