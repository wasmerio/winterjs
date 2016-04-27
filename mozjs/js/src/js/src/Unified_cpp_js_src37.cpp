#define MOZ_UNIFIED_BUILD
#include "/Users/nox/src/gecko-dev/js/src/vm/WeakMapPtr.cpp"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/vm/WeakMapPtr.cpp uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/vm/WeakMapPtr.cpp defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif
#include "/Users/nox/src/gecko-dev/js/src/vm/Xdr.cpp"
#ifdef PL_ARENA_CONST_ALIGN_MASK
#error "/Users/nox/src/gecko-dev/js/src/vm/Xdr.cpp uses PL_ARENA_CONST_ALIGN_MASK, so it cannot be built in unified mode."
#undef PL_ARENA_CONST_ALIGN_MASK
#endif
#ifdef INITGUID
#error "/Users/nox/src/gecko-dev/js/src/vm/Xdr.cpp defines INITGUID, so it cannot be built in unified mode."
#undef INITGUID
#endif