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
} from "./test-files/index.js";

function router(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(path.startsWith("/1-hello"));
  switch (path) {
    case "/1-hello":
      return handleHello1(req);
    case "/2-blob":
      return handleBlob2(req);
    case "/3-headers":
      return handleFormData3(req);
    case "/4-request":
      return handleRequest4(req);
    case "/5-response":
      return handleResponse5(req);
    case "/6-text-encoder":
      return handleTextEncoder6(req);
    case "/7-text-decoder":
      return handleTextDecoder7(req);
    case "/8-url":
      return handleURL8(req);
    case "/10-atob-btoa":
      return handleAtobBtoA9(req);
    default:
      return new Response("Route Not Found", { status: 404 });
  }
}

addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(router(fetchEvent.request));
});
