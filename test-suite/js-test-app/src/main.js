import { handleRequest as handleHello } from "./test-files/1-hello.js";
import { handleRequest as handleBlob } from "./test-files/2-blob.js";
import { handleRequest as handleFile } from "./test-files/2.1-file.js";
import { handleRequest as handleHeaders } from "./test-files/3-headers.js";
import { handleRequest as handleRequest } from "./test-files/4-request.js";
import { handleRequest as handleResponse } from "./test-files/5-response.js";
import { handleRequest as handleTextEncoder } from "./test-files/6-text-encoder.js";
import { handleRequest as handleTextDecoder } from "./test-files/7-text-decoder.js";
import { handleRequest as handleURL } from "./test-files/8-url.js";
import { handleRequest as handleSearchParams } from "./test-files/8.1-search-params.js";
import { handleRequest as handleAtobBtoA } from "./test-files/10-atob-btoa.js";
import { handleRequest as handleFetch } from "./test-files/11-fetch.js";
import { handleRequest as handleFetchBody } from "./test-files/11.1-fetch-body.js";
import { handleRequest as handleStreams } from "./test-files/12-streams.js";
import { handleRequest as handleTransformStream } from "./test-files/12.1-transform-stream.js";
import { handleRequest as handleTextEncoderStream } from "./test-files/12.2-text-encoder-stream.js";
import { handleRequest as handleTextDecoderStream } from "./test-files/12.3-text-decoder-stream.js";
import { handleRequest as handlePerformance } from "./test-files/13-performance.js";
import { handleRequest as handleFormData } from "./test-files/14-form-data.js";
import { handleRequest as handleTimers } from "./test-files/15-timers.js";
import { handleRequest as handleCrypto } from "./test-files/16-crypto.js";
import { handleRequest as handleCryptoHmac } from "./test-files/16.1-crypto-hmac.js";

function router(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith("/1-hello")) {
    return handleHello(req);
  }
  if (path.startsWith("/2-blob")) {
    return handleBlob(req);
  }
  if (path.startsWith("/2.1-file")) {
    return handleFile(req);
  }
  if (path.startsWith("/3-headers")) {
    return handleHeaders(req);
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
  if (path.startsWith("/8.1-search-params")) {
    return handleSearchParams(req);
  }
  if (path.startsWith("/10-atob-btoa")) {
    return handleAtobBtoA(req);
  }
  if (path.startsWith("/11-fetch")) {
    return handleFetch(req);
  }
  if (path.startsWith("/11.1-fetch-body")) {
    return handleFetchBody(req);
  }
  if (path.startsWith("/12-streams")) {
    return handleStreams(req);
  }
  if (path.startsWith("/12.1-transform-stream")) {
    return handleTransformStream(req);
  }
  if (path.startsWith("/12.2-text-encoder-stream")) {
    return handleTextEncoderStream(req);
  }
  if (path.startsWith("/12.3-text-decoder-stream")) {
    return handleTextDecoderStream(req);
  }
  if (path.startsWith("/13-performance")) {
    return handlePerformance(req);
  }
  if (path.startsWith("/14-form-data")) {
    return handleFormData(req);
  }
  if (path.startsWith("/15-timers")) {
    return handleTimers(req);
  }
  if (path.startsWith("/16-crypto")) {
    return handleCrypto(req);
  }
  if (path.startsWith("/16.1-crypto-hmac")) {
    return handleCryptoHmac(req);
  }
  return new Response(`Route Not Found - ${path}`, { status: 404 });
}

addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(router(fetchEvent.request));
});