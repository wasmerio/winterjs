#define MOZ_UNIFIED_BUILD
#include "/Users/nox/src/gecko-dev/js/src/editline/editline.c"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/editline/editline.c uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/editline/editline.c defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif
#include "/Users/nox/src/gecko-dev/js/src/editline/sysunix.c"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/editline/sysunix.c uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/editline/sysunix.c defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif