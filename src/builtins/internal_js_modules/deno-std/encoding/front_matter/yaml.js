// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { createExtractor, Format, test as _test } from "./mod";
import { parse } from "../yaml";
export { Format } from "./mod";
export function test(str) {
  return _test(str, [Format.YAML]);
}
export const extract = createExtractor({ [Format.YAML]: parse });
export default extract;
