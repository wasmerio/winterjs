// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { createExtractor, Format } from "./mod";
import { parse as parseYAML } from "../yaml";
import { parse as parseTOML } from "../toml";
export { Format, test } from "./mod";
export const extract = createExtractor({
  [Format.YAML]: parseYAML,
  [Format.TOML]: parseTOML,
  [Format.JSON]: JSON.parse,
});
export default extract;
