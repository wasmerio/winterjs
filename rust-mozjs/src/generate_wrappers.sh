#!/bin/sh
# Detect gsed or sed
gsed=$(type gsed >/dev/null 2>&1 && echo gsed || echo sed)
# This is one big heuristic but seems to work well enough
grep_heur() {
  grep -v "link_name" "$1" | \
  grep -v '"\]' | \
  grep -F -v '/\*\*' | \
  $gsed -z 's/,\n */, /g' | \
  $gsed -z 's/:\n */: /g' | \
  $gsed -z 's/\n *->/ ->/g' | \
  grep -v '^\}$' | \
  $gsed 's/^ *pub/pub/' | \
  $gsed -z 's/\;\n/\n/g' | \
  grep 'pub fn' | \
  grep Handle | \
  grep -v roxyHandler | \
  grep -v '\bIdVector\b' | # name clash between rust::IdVector and JS::IdVector \
  grep -v 'pub fn Unbox' | # this function seems to be platform specific \
  grep -v 'CopyAsyncStack' | # arch-specific bindgen output
  $gsed 's/root:://g' |
  $gsed 's/JS:://g' |
  $gsed 's/js:://g' |
  $gsed 's/mozilla:://g' |
  $gsed 's/Handle<\*mut JSObject>/HandleObject/g' |
  grep -F -v '> HandleObject' | # We are only wrapping handles in args not in results
  grep -v 'MutableHandleObjectVector' # GetDebuggeeGlobals has it
}

# clone file and reformat
cp target/debug/build/mozjs_sys-*/out/build/jsapi.rs target/jsapi.rs
rustfmt target/jsapi.rs --config max_width=1000
cp target/debug/build/mozjs-*/out/gluebindings.rs target/glue.rs
rustfmt target/glue.rs --config max_width=1000

# parse file
grep_heur target/jsapi.rs | $gsed 's/\(.*\)/wrap!(jsapi: \1);/g'  > rust-mozjs/src/jsapi_wrappers.in
grep_heur target/glue.rs | $gsed 's/\(.*\)/wrap!(glue: \1);/g'  > rust-mozjs/src/glue_wrappers.in
