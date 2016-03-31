# THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT EDIT.

DEFINES += -DNDEBUG=1 -DTRIMMED=1
HOST_DEFINES += -DNDEBUG=1 -DTRIMMED=1 -D_UNICODE -DUNICODE
HOST_CSRCS += nsinstall.c
HOST_CSRCS += pathsub.c
MOZBUILD_CFLAGS += -O3
NO_DIST_INSTALL := 1
PYTHON_UNIT_TESTS += tests/test_mozbuild_reading.py
PYTHON_UNIT_TESTS += tests/unit-expandlibs.py
PYTHON_UNIT_TESTS += tests/unit-mozunit.py
PYTHON_UNIT_TESTS += tests/unit-nsinstall.py
PYTHON_UNIT_TESTS += tests/unit-printprereleasesuffix.py
VISIBILITY_FLAGS := 
HOST_PROGRAM = nsinstall_real
