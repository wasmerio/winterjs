# THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT EDIT.

DEFINES += -DNDEBUG=1 -DTRIMMED=1 -D_GNU_SOURCE -DIMPL_MFBT
LOCAL_INCLUDES += -I$(topobjdir)/xpcom
LOCAL_INCLUDES += -I$(topsrcdir)/memory/build

# We build files in 'unified' mode by including several files
# together into a single source file.  This cuts down on
# compilation times and debug information size.
UNIFIED_CPPSRCS := Unified_cpp_memory_mozalloc0.cpp
CPPSRCS += $(UNIFIED_CPPSRCS)
DISABLE_STL_WRAPPING := 1
DIST_INSTALL := 1
MOZBUILD_CXXFLAGS += -Wshadow
VISIBILITY_FLAGS := 
LIBRARY_NAME := memory_mozalloc
FORCE_STATIC_LIB := 1
REAL_LIBRARY := libmemory_mozalloc.a
