## Makefile.in for ICU - extra/scrptrun
## Copyright (c) 2001-2011, International Business Machines Corporation and
## others. All Rights Reserved.

## Source directory information
srcdir = /Users/nox/src/gecko-dev/intl/icu/source/extra/scrptrun
top_srcdir = /Users/nox/src/gecko-dev/intl/icu/source

top_builddir = ../..

include $(top_builddir)/icudefs.mk

## Platform-specific setup
include $(top_srcdir)/config/mh-darwin

## Build directory information
subdir = extra/scrptrun

## Extra files to remove for 'make clean'
CLEANFILES = *~ $(DEPS)

## Target information
TARGET = srtest

DEFS = -DPACKAGE_NAME=\"ICU\" -DPACKAGE_TARNAME=\"International\ Components\ for\ Unicode\" -DPACKAGE_VERSION=\"56.1\" -DPACKAGE_STRING=\"ICU\ 56.1\" -DPACKAGE_BUGREPORT=\"http://icu-project.org/bugs\" -DPACKAGE_URL=\"http://icu-project.org\" -DSTDC_HEADERS=1 -DHAVE_SYS_TYPES_H=1 -DHAVE_SYS_STAT_H=1 -DHAVE_STDLIB_H=1 -DHAVE_STRING_H=1 -DHAVE_MEMORY_H=1 -DHAVE_STRINGS_H=1 -DHAVE_INTTYPES_H=1 -DHAVE_STDINT_H=1 -DHAVE_UNISTD_H=1 -DSIZEOF_VOID_P=8 -DHAVE_LIBM=1 -DHAVE_DLFCN_H=1 -DHAVE_DLOPEN=1 -DHAVE_GETTIMEOFDAY=1 -DHAVE_LIBPTHREAD=1 -DHAVE_INTTYPES_H=1 -DHAVE_DIRENT_H=1 -DHAVE_WCHAR_H=1 -DSIZEOF_WCHAR_T=4
CPPFLAGS =  -DU_USING_ICU_NAMESPACE=0 -DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 -DUCONFIG_NO_LEGACY_CONVERSION -DUCONFIG_NO_TRANSLITERATION -DUCONFIG_NO_REGULAR_EXPRESSIONS -DUCONFIG_NO_BREAK_ITERATION -DU_CHARSET_IS_UTF8 -I/Users/nox/src/gecko-dev/intl/icu/source/common -I/Users/nox/src/gecko-dev/intl/icu/source/i18n -Qunused-arguments  $(THREADSCPPFLAGS)  -DU_HAVE_ATOMIC=0  -I$(top_srcdir)/common -I$(top_srcdir) 
CFLAGS = -fPIC -Qunused-arguments -Wall -Wempty-body -Wignored-qualifiers -Wpointer-arith -Wsign-compare -Wtype-limits -Wunreachable-code -Wclass-varargs -Wloop-analysis -Wthread-safety -Wno-error=deprecated-declarations -Wno-error=array-bounds -std=gnu99 -fno-common -fno-math-errno -pthread -pipe -g -UDEBUG -DNDEBUG -O3 -fno-stack-protector -DU_STATIC_IMPLEMENTATION -fvisibility=hidden $(THREADSCFLAGS) 
CXXFLAGS = -fPIC -Qunused-arguments -Wall -Wc++11-compat -Wempty-body -Wignored-qualifiers -Woverloaded-virtual -Wpointer-arith -Wsign-compare -Wtype-limits -Wunreachable-code -Wwrite-strings -Wc++11-compat-pedantic -Wc++14-compat -Wc++14-compat-pedantic -Wclass-varargs -Wimplicit-fallthrough -Wloop-analysis -Wthread-safety -Wno-invalid-offsetof -Wno-inline-new-delete -Wno-error=deprecated-declarations -Wno-error=array-bounds -Wno-unknown-warning-option -Wno-return-type-c-linkage -fno-common -frtti -fno-exceptions -fno-math-errno -std=gnu++0x -pthread -pipe -g -UDEBUG -DNDEBUG -O3 -fno-stack-protector -DU_STATIC_IMPLEMENTATION -fvisibility=hidden $(THREADSCXXFLAGS) 
ENABLE_RPATH = NO
ifeq ($(ENABLE_RPATH),YES)
RPATHLDFLAGS = $(LD_RPATH)$(LD_RPATH_PRE)$(libdir)
endif
LDFLAGS =  -framework ExceptionHandling   -lobjc $(RPATHLDFLAGS)
LIBS = $(LIBICUUC) -lpthread -lm  

OBJECTS = scrptrun.o srtest.o

DEPS = $(OBJECTS:.o=.d)

## List of phony targets
.PHONY : all all-local install install-local clean clean-local	\
distclean distclean-local dist dist-local check check-local

## Clear suffix list
.SUFFIXES :

## List of standard targets
all: all-local
install: install-local
clean: clean-local
distclean : distclean-local
dist: dist-local
check: all check-local

all-local: $(TARGET)

install-local:

dist-local:

clean-local:
	test -z "$(CLEANFILES)" || $(RMV) $(CLEANFILES)
	$(RMV) $(OBJECTS) $(TARGET)

distclean-local: clean-local
	$(RMV) Makefile

check-local: all-local

Makefile: $(srcdir)/Makefile.in  $(top_builddir)/config.status
	cd $(top_builddir) \
	 && CONFIG_FILES=$(subdir)/$@ CONFIG_HEADERS= $(SHELL) ./config.status

$(TARGET) : $(OBJECTS)
	$(LINK.cc) -o $@ $^ $(LIBS)
	$(POST_BUILD_STEP)

invoke:
	ICU_DATA=$${ICU_DATA:-$(top_builddir)/data/} TZ=PST8PDT $(INVOKE) $(INVOCATION)

ifeq (,$(MAKECMDGOALS))
-include $(DEPS)
else
ifneq ($(patsubst %clean,,$(MAKECMDGOALS)),)
-include $(DEPS)
endif
endif
