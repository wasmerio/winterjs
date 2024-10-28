// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer";
import { timingSafeEqual as stdTimingSafeEqual } from "../../crypto/timing_safe_equal";
export const timingSafeEqual = (a, b) => {
  if (a instanceof Buffer) a = new DataView(a.buffer);
  if (a instanceof Buffer) b = new DataView(a.buffer);
  return stdTimingSafeEqual(a, b);
};
