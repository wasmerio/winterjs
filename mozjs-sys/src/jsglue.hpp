/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef _JSGLUE_INCLUDED
#define _JSGLUE_INCLUDED

#include "js/ArrayBuffer.h"
#include "js/BigInt.h"
#include "js/BuildId.h"
#include "js/CompilationAndEvaluation.h"
#include "js/ContextOptions.h"
#include "js/Conversions.h"
#include "js/Date.h"
#include "js/Equality.h"
#include "js/ForOfIterator.h"
#include "js/Id.h"
#include "js/Initialization.h"
#include "js/JSON.h"
#include "js/MemoryMetrics.h"
#include "js/Modules.h"
#include "js/Object.h"
#include "js/Promise.h"
#include "js/PropertySpec.h"
#include "js/Proxy.h"
#include "js/Realm.h"
#include "js/RegExp.h"
#include "js/SavedFrameAPI.h"
#include "js/ScalarType.h"
#include "js/SourceText.h"
#include "js/Stream.h"
#include "js/String.h"
#include "js/StructuredClone.h"
#include "js/Symbol.h"
#include "js/Utility.h"
#include "js/Warnings.h"
#include "js/WasmModule.h"
#include "js/experimental/JSStencil.h"
#include "js/experimental/JitInfo.h"
#include "js/experimental/TypedData.h"
#include "js/friend/DOMProxy.h"
#include "js/friend/ErrorMessages.h"
#include "js/friend/WindowProxy.h"
#include "js/shadow/Object.h"
#include "js/shadow/Shape.h"
#include "jsapi.h"
#include "jsfriendapi.h"


namespace glue {

// Reexport some functions that are marked inline.

bool JS_Init();

JS::RealmOptions* JS_NewRealmOptions();
void DeleteRealmOptions(JS::RealmOptions* options);
JS::OwningCompileOptions* JS_NewOwningCompileOptions(JSContext* cx);
void DeleteOwningCompileOptions(JS::OwningCompileOptions* optiosn);

JS::shadow::Zone* JS_AsShadowZone(JS::Zone* zone);

JS::CallArgs JS_CallArgsFromVp(unsigned argc, JS::Value* vp);

void JS_StackCapture_AllFrames(JS::StackCapture*);
void JS_StackCapture_MaxFrames(uint32_t max, JS::StackCapture*);
void JS_StackCapture_FirstSubsumedFrame(JSContext* cx,
                                        bool ignoreSelfHostedFrames,
                                        JS::StackCapture*);

// Reexport some methods

bool JS_ForOfIteratorInit(
    JS::ForOfIterator* iterator, JS::HandleValue iterable,
    JS::ForOfIterator::NonIterableBehavior nonIterableBehavior);
bool JS_ForOfIteratorNext(JS::ForOfIterator* iterator,
                          JS::MutableHandleValue val, bool* done);

// These functions are only intended for use in testing,
// to make sure that the Rust implementation of JS::Value
// agrees with the C++ implementation.

void JS_ValueSetBoolean(JS::Value* value, bool x);
bool JS_ValueIsBoolean(const JS::Value* value);
bool JS_ValueToBoolean(const JS::Value* value);

void JS_ValueSetDouble(JS::Value* value, double x);
bool JS_ValueIsDouble(const JS::Value* value);
double JS_ValueToDouble(const JS::Value* value);

void JS_ValueSetInt32(JS::Value* value, int32_t x);
bool JS_ValueIsInt32(const JS::Value* value);
int32_t JS_ValueToInt32(const JS::Value* value);

bool JS_ValueIsNumber(const JS::Value* value);
double JS_ValueToNumber(const JS::Value* value);

void JS_ValueSetNull(JS::Value* value);
bool JS_ValueIsNull(const JS::Value* value);

bool JS_ValueIsUndefined(const JS::Value* value);

size_t GetLinearStringLength(JSLinearString* s);
uint16_t GetLinearStringCharAt(JSLinearString* s, size_t idx);
JSLinearString* AtomToLinearString(JSAtom* atom);

// These types are using maybe so we manually unwrap them in these wrappers

bool FromPropertyDescriptor(JSContext *cx, JS::Handle<JS::PropertyDescriptor> desc, JS::MutableHandle<JS::Value> vp);
bool JS_GetOwnPropertyDescriptorById(JSContext* cx, JS::HandleObject obj, JS::HandleId id, JS::MutableHandle<JS::PropertyDescriptor> desc, bool* isNone);
bool JS_GetOwnPropertyDescriptor(JSContext* cx, JS::HandleObject obj, const char* name, JS::MutableHandle<JS::PropertyDescriptor> desc, bool* isNone);
bool JS_GetOwnUCPropertyDescriptor(JSContext* cx, JS::HandleObject obj, const char16_t* name, size_t namelen, JS::MutableHandle<JS::PropertyDescriptor> desc, bool* isNone);
bool JS_GetPropertyDescriptorById(JSContext* cx, JS::HandleObject obj, JS::HandleId id, JS::MutableHandle<JS::PropertyDescriptor> desc, JS::MutableHandleObject holder, bool* isNone);
bool JS_GetPropertyDescriptor(JSContext* cx, JS::HandleObject obj, const char* name, JS::MutableHandle<JS::PropertyDescriptor> desc, JS::MutableHandleObject holder, bool* isNone);
bool JS_GetUCPropertyDescriptor(JSContext* cx, JS::HandleObject obj, const char16_t* name, size_t namelen, JS::MutableHandle<JS::PropertyDescriptor> desc, JS::MutableHandleObject holder, bool* isNone);
bool SetPropertyIgnoringNamedGetter(JSContext* cx, JS::HandleObject obj, JS::HandleId id, JS::HandleValue v, JS::HandleValue receiver, JS::Handle<JS::PropertyDescriptor> ownDesc, JS::ObjectOpResult& result);

bool CreateError(JSContext* cx, JSExnType type, JS::HandleObject stack,
                 JS::HandleString fileName, uint32_t lineNumber,
                 uint32_t columnNumber, JSErrorReport* report,
                 JS::HandleString message, JS::HandleValue cause,
                 JS::MutableHandleValue rval);

JSExnType GetErrorType(const JS::Value& val);

JS::Value GetExceptionCause(JSObject* exc);

}  // namespace glue

// There's a couple of classes from pre-57 releases of SM that bindgen can't
// deal with. https://github.com/rust-lang-nursery/rust-bindgen/issues/851
// https://bugzilla.mozilla.org/show_bug.cgi?id=1277338
// https://rust-lang-nursery.github.io/rust-bindgen/replacing-types.html

/**
 * <div rustbindgen replaces="JS::CallArgs"></div>
 */

class MOZ_STACK_CLASS CallArgsReplacement {
 protected:
  JS::Value* argv_;
  unsigned argc_;
  bool constructing_ : 1;
  bool ignoresReturnValue_ : 1;
#ifdef JS_DEBUG
  JS::detail::IncludeUsedRval wantUsedRval_;
#endif
};

/**
 * <div rustbindgen replaces="JSJitMethodCallArgs"></div>
 */

class JSJitMethodCallArgsReplacement {
 private:
  JS::Value* argv_;
  unsigned argc_;
  bool constructing_ : 1;
  bool ignoresReturnValue_ : 1;
#ifdef JS_DEBUG
  JS::detail::NoUsedRval wantUsedRval_;
#endif
};

/// <div rustbindgen replaces="JS::MutableHandleIdVector"></div>
struct MutableHandleIdVector_Simple {
  void* ptr;
};
static_assert(sizeof(JS::MutableHandleIdVector) ==
                  sizeof(MutableHandleIdVector_Simple),
              "wrong handle size");

/// <div rustbindgen replaces="JS::HandleObjectVector"></div>
struct HandleObjectVector_Simple {
  void* ptr;
};

/// <div rustbindgen replaces="JS::MutableHandleObjectVector"></div>
struct MutableHandleObjectVector_Simple {
  void* ptr;
};

#endif
