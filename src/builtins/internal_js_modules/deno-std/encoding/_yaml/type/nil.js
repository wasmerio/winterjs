// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { Type } from "../type";
function resolveYamlNull(data) {
  const max = data.length;
  return (
    (max === 1 && data === "~") ||
    (max === 4 && (data === "null" || data === "Null" || data === "NULL"))
  );
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
export const nil = new Type("tag:yaml.org,2002:null", {
  construct: constructYamlNull,
  defaultStyle: "lowercase",
  kind: "scalar",
  predicate: isNull,
  represent: {
    canonical() {
      return "~";
    },
    lowercase() {
      return "null";
    },
    uppercase() {
      return "NULL";
    },
    camelcase() {
      return "Null";
    },
  },
  resolve: resolveYamlNull,
});
