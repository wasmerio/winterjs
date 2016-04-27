#define MOZ_UNIFIED_BUILD
#include "/Users/nox/src/gecko-dev/js/src/shell/OSObject.cpp"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/shell/OSObject.cpp uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/shell/OSObject.cpp defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif
#include "/Users/nox/src/gecko-dev/js/src/shell/js.cpp"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/shell/js.cpp uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/shell/js.cpp defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif
#include "/Users/nox/src/gecko-dev/js/src/shell/jsoptparse.cpp"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/shell/jsoptparse.cpp uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/shell/jsoptparse.cpp defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif
#include "/Users/nox/src/gecko-dev/js/src/shell/jsshell.cpp"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/shell/jsshell.cpp uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/shell/jsshell.cpp defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif