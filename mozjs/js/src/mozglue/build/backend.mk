# THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT EDIT.

DEFINES += -DNDEBUG=1 -DTRIMMED=1 -DIMPL_MFBT
DIST_INSTALL := 1
MOZBUILD_CXXFLAGS += -Wshadow
MOZBUILD_LDFLAGS += -Wl,-bind_at_load
LIBRARY_NAME := mozglue
FORCE_SHARED_LIB := 1
IMPORT_LIBRARY := libmozglue.dylib
SHARED_LIBRARY := libmozglue.dylib
DSO_SONAME := libmozglue.dylib
SDK_LIBRARY := libmozglue.dylib
STATIC_LIBS += $(DEPTH)/memory/mozalloc/libmemory_mozalloc.a
STATIC_LIBS += $(DEPTH)/memory/build/libmemory.a
STATIC_LIBS += $(DEPTH)/mozglue/misc/libmozglue_misc.a
STATIC_LIBS += $(DEPTH)/mfbt/libmfbt.a
