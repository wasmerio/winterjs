js/src/shell/export: js/src/export
js/src/jsapi-tests/export: js/src/export
js/src/tests/export: js/src/export
recurse_export: config/export memory/mozjemalloc/export mozglue/build/export config/external/icu/export js/src/export js/src/shell/export js/src/jsapi-tests/export js/src/tests/export
js/src/shell/libs: js/src/libs
mozglue/build/libs: memory/mozjemalloc/libs
js/src/jsapi-tests/libs: js/src/shell/libs
memory/mozjemalloc/libs: config/libs
js/src/tests/libs: js/src/jsapi-tests/libs
config/external/icu/libs: mozglue/build/libs
js/src/libs: config/external/icu/libs
recurse_libs: js/src/tests/libs
recurse_misc: js/src/shell/misc js/src/jsapi-tests/misc js/src/gdb/misc
recurse_tools:
recurse_compile: js/src/jsapi-tests/target mfbt/tests/target js/src/gdb/target config/host js/src/shell/target js/src/host memory/fallible/target
js/src/gdb/target: mozglue/build/target js/src/target
js/src/jsapi-tests/target: mozglue/build/target js/src/target
js/src/shell/target: js/src/editline/target mozglue/build/target js/src/target
js/src/target: config/external/icu/target config/external/nspr/target mozglue/build/target config/external/zlib/target
memory/build/target: memory/mozjemalloc/target
mfbt/tests/target: mfbt/target
mozglue/build/target: memory/mozalloc/target mozglue/misc/target mfbt/target memory/build/target
