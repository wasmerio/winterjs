/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef _JSGLUE_INCLUDED
#define _JSGLUE_INCLUDED

#include <stdint.h>
#ifdef _MSC_VER
#include <windows.h>
#else
#include <unistd.h>
#endif

typedef uint32_t HashNumber;

#include "jsfriendapi.h"
#include "js/Conversions.h"
#include "js/Initialization.h"
#include "js/MemoryMetrics.h"

// Reexport some functions that are marked inline.

namespace glue {
    
JS::CompartmentOptions JS_NewCompartmentOptions();
JS::OwningCompileOptions JS_NewOwningCompileOptions(JSContext* cx, JSVersion version);

bool JS_ForOfIteratorInit(JS::ForOfIterator* iterator, JS::HandleValue iterable, JS::ForOfIterator::NonIterableBehavior nonIterableBehavior);
bool JS_ForOfIteratorNext(JS::ForOfIterator* iterator, JS::MutableHandleValue val, bool* done);

JS::shadow::Zone* JS_AsShadowZone(JS::Zone* zone);

JS::CallArgs JS_CallArgsFromVp(unsigned argc, JS::Value* vp);

JS::Value JS_BooleanValue(bool value);
bool JS_ValueIsBoolean(JS::Value value);
bool JS_ValueToBoolean(JS::Value value);

JS::Value JS_DoubleValue(double value);
bool JS_ValueIsDouble(JS::Value value);
double JS_ValueToDouble(JS::Value value);

JS::Value JS_Int32Value(int32_t value);
bool JS_ValueIsInt32(JS::Value value);
int32_t JS_ValueToInt32(JS::Value value);

JS::Value JS_NullValue();
bool JS_ValueIsNull(JS::Value value);

JS::Value JS_UndefinedValue();
bool JS_ValueIsUndefined(JS::Value value);

}

// There's a couple of classes from pre-57 releases of SM that bindgen can't deal with.
// https://github.com/rust-lang-nursery/rust-bindgen/issues/851
// https://bugzilla.mozilla.org/show_bug.cgi?id=1277338
// https://rust-lang-nursery.github.io/rust-bindgen/replacing-types.html

/**
 * <div rustbindgen replaces="JS::CallArgs"></div>
 */

class MOZ_STACK_CLASS CallArgsReplacement
{
  protected:
    JS::Value* argv_;
    unsigned argc_;
    bool constructing_:1;
    bool ignoresReturnValue_:1;
#ifdef JS_DEBUG
    JS::detail::IncludeUsedRval wantUsedRval_;
#endif
};

/**
 * <div rustbindgen replaces="JSJitMethodCallArgs"></div>
 */

class JSJitMethodCallArgsReplacement
{
  private:
    JS::Value* argv_;
    unsigned argc_;
    bool constructing_:1;
    bool ignoresReturnValue_:1;
#ifdef JS_DEBUG
    JS::detail::NoUsedRval wantUsedRval_;
#endif
};

#endif
