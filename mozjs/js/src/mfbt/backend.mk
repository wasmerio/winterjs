# THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT EDIT.

DEFINES += -DNDEBUG=1 -DTRIMMED=1 -DIMPL_MFBT
DIRS := tests
CPPSRCS += Compression.cpp
CPPSRCS += decimal/Decimal.cpp

# We build files in 'unified' mode by including several files
# together into a single source file.  This cuts down on
# compilation times and debug information size.
UNIFIED_CPPSRCS := Unified_cpp_mfbt0.cpp
CPPSRCS += $(UNIFIED_CPPSRCS)
Compression.cpp_FLAGS += -Wno-unused-function
Decimal.cpp_FLAGS += -Wno-implicit-fallthrough
DISABLE_STL_WRAPPING := 1
LIBRARY_NAME := mfbt
FORCE_STATIC_LIB := 1
REAL_LIBRARY := libmfbt.a
