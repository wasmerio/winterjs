#!/bin/sh
# This is one big heuristic but seems to work well enough
grep_heur() {
    grep -v "link_name" "$1" | \
        grep -v '"\]' | \
        grep -F -v '/\*\*' | \
        sed -z 's/,\n */, /g' | \
        sed -z 's/:\n */: /g' | \
        sed -z 's/\n *->/ ->/g' | \
        grep -v '^\}$' | \
        sed 's/^ *pub/pub/' | \
        sed -z 's/\;\n/\n/g' | \
        grep 'pub fn' | \
        grep Handle | \
        grep -v roxyHandler | \
        grep -v '\bIdVector\b' | # name clash between rust::IdVector and JS::IdVector \
        grep -v 'pub fn Unbox' | # this function seems to be platform specific \
        grep -v 'CopyAsyncStack' | # arch-specific bindgen output
        sed 's/root:://g' |
        sed 's/JS:://g' |
        sed 's/js:://g' |
        sed 's/mozilla:://g' |
        sed 's/Handle<\*mut JSObject>/HandleObject/g'
}

grep_heur ../target/debug/build/mozjs_sys-*/out/build/jsapi.rs | sed 's/\(.*\)/wrap!(jsapi: \1);/g'  > jsapi_wrappers.in
grep_heur glue.rs | sed 's/\(.*\)/wrap!(glue: \1);/g'  > glue_wrappers.in
