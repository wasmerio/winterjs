// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { State } from "../state";
export class LoaderState extends State {
  input;
  documents = [];
  length;
  lineIndent = 0;
  lineStart = 0;
  position = 0;
  line = 0;
  filename;
  onWarning;
  legacy;
  json;
  listener;
  implicitTypes;
  typeMap;
  version;
  checkLineBreaks;
  tagMap;
  anchorMap;
  tag;
  anchor;
  kind;
  result = "";
  constructor(
    input,
    {
      filename,
      schema,
      onWarning,
      legacy = false,
      json = false,
      listener = null,
    }
  ) {
    super(schema);
    this.input = input;
    this.filename = filename;
    this.onWarning = onWarning;
    this.legacy = legacy;
    this.json = json;
    this.listener = listener;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
  }
}
