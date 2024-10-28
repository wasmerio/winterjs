// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { DEFAULT_SCHEMA } from "./schema/mod";
export class State {
  schema;
  constructor(schema = DEFAULT_SCHEMA) {
    this.schema = schema;
  }
}
