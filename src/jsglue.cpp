/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "jsglue.hpp"

namespace glue {

// Reexport some functions that are marked inline.

bool JS_Init() {
    return ::JS_Init();
}

JS::RealmOptions* JS_NewRealmOptions() {
    JS::RealmOptions* result = new JS::RealmOptions;
    return result;
}

void DeleteRealmOptions(JS::RealmOptions* options) {
	delete options;
}

JS::OwningCompileOptions JS_NewOwningCompileOptions(JSContext* cx) {
    JS::OwningCompileOptions result(cx);
    return result;
}

JS::shadow::Zone* JS_AsShadowZone(JS::Zone* zone) {
    return JS::shadow::Zone::asShadowZone(zone);
}

JS::CallArgs JS_CallArgsFromVp(unsigned argc, JS::Value* vp) {
    return JS::CallArgsFromVp(argc, vp);
}

JS::StackCapture JS_StackCapture_AllFrames() {
    return JS::StackCapture(JS::AllFrames());
}

JS::StackCapture JS_StackCapture_MaxFrames(uint32_t max) {
    return JS::StackCapture(JS::MaxFrames(max));
}

JS::StackCapture JS_StackCapture_FirstSubsumedFrame(JSContext* cx, bool ignoreSelfHostedFrames) {
    return JS::StackCapture(JS::FirstSubsumedFrame(cx, ignoreSelfHostedFrames));
}

// Reexport some methods

bool JS_ForOfIteratorInit(JS::ForOfIterator* iterator, JS::HandleValue iterable, JS::ForOfIterator::NonIterableBehavior nonIterableBehavior) {
    return iterator->init(iterable, nonIterableBehavior);
}

bool JS_ForOfIteratorNext(JS::ForOfIterator* iterator, JS::MutableHandleValue val, bool* done) {
    return iterator->next(val, done);
}

// These functions are only intended for use in testing,
// to make sure that the Rust implementation of JS::Value
// agrees with the C++ implementation.

void JS_ValueSetBoolean(JS::Value* value, bool x) {
    value->setBoolean(x);
}

bool JS_ValueIsBoolean(const JS::Value* value) {
    return value->isBoolean();
}

bool JS_ValueToBoolean(const JS::Value* value) {
    return value->toBoolean();
}

void JS_ValueSetDouble(JS::Value* value, double x) {
    value->setDouble(x);
}

bool JS_ValueIsDouble(const JS::Value* value) {
    return value->isDouble();
}

double JS_ValueToDouble(const JS::Value* value) {
    return value->toDouble();
}

void JS_ValueSetInt32(JS::Value* value, int32_t x) {
    value->setInt32(x);
}

bool JS_ValueIsInt32(const JS::Value* value) {
    return value->isInt32();
}

int32_t JS_ValueToInt32(const JS::Value* value) {
    return value->toInt32();
}

bool JS_ValueIsNumber(const JS::Value* value) {
    return value->isNumber();
}

double JS_ValueToNumber(const JS::Value* value) {
    return value->toNumber();
}

void JS_ValueSetNull(JS::Value* value) {
    value->setNull();
}

bool JS_ValueIsNull(const JS::Value* value) {
    return value->isNull();
}

bool JS_ValueIsUndefined(const JS::Value* value) {
    return value->isUndefined();
}
}
