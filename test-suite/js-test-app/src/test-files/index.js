import { handleRequest as handleHello } from "./1-hello.js";
import { handleRequest as handleBlob } from "./2-blob.js";
import { handleRequest as handleFormData } from "./3-headers.js";
import { handleRequest as handleRequest } from "./4-request.js";
import { handleRequest as handleResponse } from "./5-response.js";
import { handleRequest as handleTextEncoder } from "./6-text-encoder.js";
import { handleRequest as handleTextDecoder } from "./7-text-decoder.js";
import { handleRequest as handleURL } from "./8-url.js";
import { handleRequest as handleAtobBtoA } from "./10-atob-btoa.js";
import { handleRequest as handleFetch } from "./11-fetch.js";
import { handleRequest as handleStreams } from "./12-streams.js";
import { handleRequest as handleTransformStream } from "./12.1-transform-stream.js";
import { handleRequest as handlePerformance } from "./13-performance.js";

export {
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
  handleTransformStream,
  handlePerformance,
};
