export_dirs := config memory/mozjemalloc mozglue/build config/external/icu js/src js/src/shell js/src/jsapi-tests js/src/tests
libs_dirs := config memory/mozjemalloc mozglue/build config/external/icu js/src js/src/shell js/src/jsapi-tests js/src/tests
misc_dirs := js/src/shell js/src/jsapi-tests js/src/gdb
tools_dirs := 
compile_targets := config/external/icu/target config/external/nspr/target config/external/zlib/target config/host js/src/editline/target js/src/gdb/target js/src/host js/src/jsapi-tests/target js/src/shell/target js/src/target memory/build/target memory/fallible/target memory/mozalloc/target memory/mozjemalloc/target mfbt/target mfbt/tests/target mozglue/build/target mozglue/misc/target
include root-deps.mk
