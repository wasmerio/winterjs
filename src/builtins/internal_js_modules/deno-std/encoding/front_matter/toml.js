// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { createExtractor, Format, test as _test } from "./mod";
import { parse } from "../toml";
export { Format } from "./mod";
export function test(str) {
  return _test(str, [Format.TOML]);
}
export const extract = createExtractor({ [Format.TOML]: parse });
export default extract;
