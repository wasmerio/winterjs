// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { createExtractor, Format, test as _test } from "./mod";
export { Format } from "./mod";
export function test(str) {
  return _test(str, [Format.JSON]);
}
export const extract = createExtractor({ [Format.JSON]: JSON.parse });
export default extract;
