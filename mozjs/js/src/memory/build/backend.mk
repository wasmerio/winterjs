# THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT EDIT.

DEFINES += -DNDEBUG=1 -DTRIMMED=1 -DMOZ_MEMORY_IMPL
CSRCS += mozmemory_wrap.c
CPPSRCS += jemalloc_config.cpp
MOZBUILD_CFLAGS += -Wshadow
LIBRARY_NAME := memory
FORCE_STATIC_LIB := 1
REAL_LIBRARY := libmemory.a
STATIC_LIBS += $(DEPTH)/memory/mozjemalloc/libjemalloc.a
