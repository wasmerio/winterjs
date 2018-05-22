/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "jsglue.hpp"

namespace glue {

// Reexport some functions that are marked inline.

JS::CompartmentOptions JS_NewCompartmentOptions() {
    JS::CompartmentOptions result;
    return result;
}

JS::OwningCompileOptions JS_NewOwningCompileOptions(JSContext* cx, JSVersion version) {
    JS::OwningCompileOptions result(cx);
    result.setVersion(version);
    return result;
}

JS::shadow::Zone* JS_AsShadowZone(JS::Zone* zone) {
    return JS::shadow::Zone::asShadowZone(zone);
}

JS::CallArgs JS_CallArgsFromVp(unsigned argc, JS::Value* vp) {
    return JS::CallArgsFromVp(argc, vp);
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

JS::Value JS_BooleanValue(bool value) {
    return JS::BooleanValue(value);
}

bool JS_ValueIsBoolean(JS::Value value) {
    return value.isBoolean();
}

bool JS_ValueToBoolean(JS::Value value) {
    return value.toBoolean();
}

JS::Value JS_DoubleValue(double value) {
    return JS::DoubleValue(value);
}

bool JS_ValueIsDouble(JS::Value value) {
    return value.isDouble();
}

double JS_ValueToDouble(JS::Value value) {
    return value.toDouble();
}

JS::Value JS_Int32Value(int32_t value) {
    return JS::Int32Value(value);
}

bool JS_ValueIsInt32(JS::Value value) {
    return value.isInt32();
}

int32_t JS_ValueToInt32(JS::Value value) {
    return value.toInt32();
}

JS::Value JS_NullValue() {
    return JS::NullValue();
}

bool JS_ValueIsNull(JS::Value value) {
    return value.isNull();
}

JS::Value JS_UndefinedValue() {
    return JS::UndefinedValue();
}

bool JS_ValueIsUndefined(JS::Value value) {
    return value.isUndefined();
}

}
