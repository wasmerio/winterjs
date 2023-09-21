/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "jsglue.hpp"

namespace glue {

// Reexport some functions that are marked inline.

bool JS_Init() { return ::JS_Init(); }

JS::RealmOptions* JS_NewRealmOptions() {
  JS::RealmOptions* result = new JS::RealmOptions;
  return result;
}

void DeleteRealmOptions(JS::RealmOptions* options) { delete options; }

JS::OwningCompileOptions* JS_NewOwningCompileOptions(JSContext* cx) {
  JS::OwningCompileOptions* result = new JS::OwningCompileOptions(cx);
  return result;
}

void DeleteOwningCompileOptions(JS::OwningCompileOptions* opts) { delete opts; }

JS::shadow::Zone* JS_AsShadowZone(JS::Zone* zone) {
  return JS::shadow::Zone::from(zone);
}

JS::CallArgs JS_CallArgsFromVp(unsigned argc, JS::Value* vp) {
  return JS::CallArgsFromVp(argc, vp);
}

void JS_StackCapture_AllFrames(JS::StackCapture* capture) {
  JS::StackCapture all = JS::StackCapture(JS::AllFrames());
  // Since Rust can't provide a meaningful initial value for the
  // pointer, it is uninitialized memory. This means we must
  // overwrite its value, rather than perform an assignment
  // which could invoke a destructor on uninitialized memory.
  mozilla::PodAssign(capture, &all);
}

void JS_StackCapture_MaxFrames(uint32_t max, JS::StackCapture* capture) {
  JS::StackCapture maxFrames = JS::StackCapture(JS::MaxFrames(max));
  mozilla::PodAssign(capture, &maxFrames);
}

void JS_StackCapture_FirstSubsumedFrame(JSContext* cx,
                                        bool ignoreSelfHostedFrames,
                                        JS::StackCapture* capture) {
  JS::StackCapture subsumed =
      JS::StackCapture(JS::FirstSubsumedFrame(cx, ignoreSelfHostedFrames));
  mozilla::PodAssign(capture, &subsumed);
}

// Reexport some methods

bool JS_ForOfIteratorInit(
    JS::ForOfIterator* iterator, JS::HandleValue iterable,
    JS::ForOfIterator::NonIterableBehavior nonIterableBehavior) {
  return iterator->init(iterable, nonIterableBehavior);
}

bool JS_ForOfIteratorNext(JS::ForOfIterator* iterator,
                          JS::MutableHandleValue val, bool* done) {
  return iterator->next(val, done);
}

// These functions are only intended for use in testing,
// to make sure that the Rust implementation of JS::Value
// agrees with the C++ implementation.

void JS_ValueSetBoolean(JS::Value* value, bool x) { value->setBoolean(x); }

bool JS_ValueIsBoolean(const JS::Value* value) { return value->isBoolean(); }

bool JS_ValueToBoolean(const JS::Value* value) { return value->toBoolean(); }

void JS_ValueSetDouble(JS::Value* value, double x) { value->setDouble(x); }

bool JS_ValueIsDouble(const JS::Value* value) { return value->isDouble(); }

double JS_ValueToDouble(const JS::Value* value) { return value->toDouble(); }

void JS_ValueSetInt32(JS::Value* value, int32_t x) { value->setInt32(x); }

bool JS_ValueIsInt32(const JS::Value* value) { return value->isInt32(); }

int32_t JS_ValueToInt32(const JS::Value* value) { return value->toInt32(); }

bool JS_ValueIsNumber(const JS::Value* value) { return value->isNumber(); }

double JS_ValueToNumber(const JS::Value* value) { return value->toNumber(); }

void JS_ValueSetNull(JS::Value* value) { value->setNull(); }

bool JS_ValueIsNull(const JS::Value* value) { return value->isNull(); }

bool JS_ValueIsUndefined(const JS::Value* value) {
  return value->isUndefined();
}

size_t GetLinearStringLength(JSLinearString* s) {
  return JS::GetLinearStringLength(s);
}

uint16_t GetLinearStringCharAt(JSLinearString* s, size_t idx) {
  return JS::GetLinearStringCharAt(s, idx);
}

JSLinearString* AtomToLinearString(JSAtom* atom) {
  return JS::AtomToLinearString(atom);
}

// These types are using maybe so we manually unwrap them in these wrappers

bool FromPropertyDescriptor(JSContext* cx,
                            JS::Handle<JS::PropertyDescriptor> desc_,
                            JS::MutableHandleValue vp) {
  return JS::FromPropertyDescriptor(
      cx,
      JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>>(
          cx, mozilla::ToMaybe(&desc_)),
      vp);
}

bool JS_GetPropertyDescriptor(JSContext* cx, JS::Handle<JSObject*> obj,
                              const char* name,
                              JS::MutableHandle<JS::PropertyDescriptor> desc,
                              JS::MutableHandle<JSObject*> holder,
                              bool* isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result = JS_GetPropertyDescriptor(cx, obj, name, &mpd, holder);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool JS_GetOwnPropertyDescriptorById(
    JSContext* cx, JS::HandleObject obj, JS::HandleId id,
    JS::MutableHandle<JS::PropertyDescriptor> desc, bool* isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result = JS_GetOwnPropertyDescriptorById(cx, obj, id, &mpd);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool JS_GetOwnPropertyDescriptor(JSContext* cx, JS::HandleObject obj,
                                 const char* name,
                                 JS::MutableHandle<JS::PropertyDescriptor> desc,
                                 bool* isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result = JS_GetOwnPropertyDescriptor(cx, obj, name, &mpd);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool JS_GetOwnUCPropertyDescriptor(
    JSContext* cx, JS::HandleObject obj, const char16_t* name, size_t namelen,
    JS::MutableHandle<JS::PropertyDescriptor> desc, bool* isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result = JS_GetOwnUCPropertyDescriptor(cx, obj, name, namelen, &mpd);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool JS_GetPropertyDescriptorById(
    JSContext* cx, JS::HandleObject obj, JS::HandleId id,
    JS::MutableHandle<JS::PropertyDescriptor> desc,
    JS::MutableHandleObject holder, bool* isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result = JS_GetPropertyDescriptorById(cx, obj, id, &mpd, holder);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool JS_GetUCPropertyDescriptor(JSContext* cx, JS::HandleObject obj,
                                const char16_t* name, size_t namelen,
                                JS::MutableHandle<JS::PropertyDescriptor> desc,
                                JS::MutableHandleObject holder, bool* isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result =
      JS_GetUCPropertyDescriptor(cx, obj, name, namelen, &mpd, holder);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool SetPropertyIgnoringNamedGetter(JSContext* cx, JS::HandleObject obj,
                                    JS::HandleId id, JS::HandleValue v,
                                    JS::HandleValue receiver,
                                    JS::Handle<JS::PropertyDescriptor> ownDesc,
                                    JS::ObjectOpResult& result) {
  return js::SetPropertyIgnoringNamedGetter(
      cx, obj, id, v, receiver,
      JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>>(
          cx, mozilla::ToMaybe(&ownDesc)),
      result);
}

bool CreateError(JSContext* cx, JSExnType type, JS::HandleObject stack,
                 JS::HandleString fileName, uint32_t lineNumber,
                 uint32_t columnNumber, JSErrorReport* report,
                 JS::HandleString message, JS::HandleValue cause,
                 JS::MutableHandleValue rval) {
  return JS::CreateError(
      cx, type, stack, fileName, lineNumber, columnNumber, report, message,
      JS::Rooted<mozilla::Maybe<JS::Value>>(cx, mozilla::ToMaybe(&cause)),
      rval);
}

JSExnType GetErrorType(const JS::Value& val) {
  auto type = JS_GetErrorType(val);
  if (type.isNothing()) {
    return JSEXN_ERROR_LIMIT;
  }
  return *type;
}

JS::Value GetExceptionCause(JSObject* exc) {
  auto cause = JS::GetExceptionCause(exc);
  if (cause.isNothing()) {
    return JS::NullValue();
  }
  return *cause;
}
}  // namespace glue
