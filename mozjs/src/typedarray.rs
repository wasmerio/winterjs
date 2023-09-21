/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//! High-level, safe bindings for JS typed array APIs. Allows creating new
//! typed arrays or wrapping existing JS reflectors, and prevents reinterpreting
//! existing buffers as different types except in well-defined cases.

use crate::conversions::ConversionResult;
use crate::conversions::FromJSValConvertible;
use crate::conversions::ToJSValConvertible;
use crate::glue::GetFloat32ArrayLengthAndData;
use crate::glue::GetFloat64ArrayLengthAndData;
use crate::glue::GetInt16ArrayLengthAndData;
use crate::glue::GetInt32ArrayLengthAndData;
use crate::glue::GetInt8ArrayLengthAndData;
use crate::glue::GetUint16ArrayLengthAndData;
use crate::glue::GetUint32ArrayLengthAndData;
use crate::glue::GetUint8ArrayLengthAndData;
use crate::glue::GetUint8ClampedArrayLengthAndData;
use crate::jsapi::GetArrayBufferData;
use crate::jsapi::GetArrayBufferLengthAndData;
use crate::jsapi::GetArrayBufferViewLengthAndData;
use crate::jsapi::Heap;
use crate::jsapi::JSContext;
use crate::jsapi::JSObject;
use crate::jsapi::JSTracer;
use crate::jsapi::JS_GetArrayBufferViewType;
use crate::jsapi::JS_GetFloat32ArrayData;
use crate::jsapi::JS_GetFloat64ArrayData;
use crate::jsapi::JS_GetInt16ArrayData;
use crate::jsapi::JS_GetInt32ArrayData;
use crate::jsapi::JS_GetInt8ArrayData;
use crate::jsapi::JS_GetTypedArraySharedness;
use crate::jsapi::JS_GetUint16ArrayData;
use crate::jsapi::JS_GetUint32ArrayData;
use crate::jsapi::JS_GetUint8ArrayData;
use crate::jsapi::JS_GetUint8ClampedArrayData;
use crate::jsapi::JS_NewFloat32Array;
use crate::jsapi::JS_NewFloat64Array;
use crate::jsapi::JS_NewInt16Array;
use crate::jsapi::JS_NewInt32Array;
use crate::jsapi::JS_NewInt8Array;
use crate::jsapi::JS_NewUint16Array;
use crate::jsapi::JS_NewUint32Array;
use crate::jsapi::JS_NewUint8Array;
use crate::jsapi::JS_NewUint8ClampedArray;
use crate::jsapi::NewArrayBuffer;
use crate::jsapi::Type;
use crate::jsapi::UnwrapArrayBuffer;
use crate::jsapi::UnwrapArrayBufferView;
use crate::jsapi::UnwrapFloat32Array;
use crate::jsapi::UnwrapFloat64Array;
use crate::jsapi::UnwrapInt16Array;
use crate::jsapi::UnwrapInt32Array;
use crate::jsapi::UnwrapInt8Array;
use crate::jsapi::UnwrapUint16Array;
use crate::jsapi::UnwrapUint32Array;
use crate::jsapi::UnwrapUint8Array;
use crate::jsapi::UnwrapUint8ClampedArray;
use crate::rust::CustomTrace;
use crate::rust::{HandleValue, MutableHandleObject, MutableHandleValue};

use std::cell::Cell;
use std::ptr;
use std::slice;

/// Trait that specifies how pointers to wrapped objects are stored. It supports
/// two variants, one with bare pointer (to be rooted on stack using
/// CustomAutoRooter) and wrapped in a Box<Heap<T>>, which can be stored in a
/// heap-allocated structure, to be rooted with JSTraceable-implementing tracers
/// (currently implemented in Servo).
pub trait JSObjectStorage {
    fn as_raw(&self) -> *mut JSObject;
    fn from_raw(raw: *mut JSObject) -> Self;
}

impl JSObjectStorage for *mut JSObject {
    fn as_raw(&self) -> *mut JSObject {
        *self
    }
    fn from_raw(raw: *mut JSObject) -> Self {
        raw
    }
}

impl JSObjectStorage for Box<Heap<*mut JSObject>> {
    fn as_raw(&self) -> *mut JSObject {
        self.get()
    }
    fn from_raw(raw: *mut JSObject) -> Self {
        let boxed = Box::new(Heap::default());
        boxed.set(raw);
        boxed
    }
}

impl<T: TypedArrayElement, S: JSObjectStorage> FromJSValConvertible for TypedArray<T, S> {
    type Config = ();
    unsafe fn from_jsval(
        _cx: *mut JSContext,
        value: HandleValue,
        _option: (),
    ) -> Result<ConversionResult<Self>, ()> {
        if value.get().is_object() {
            Self::from(value.get().to_object()).map(ConversionResult::Success)
        } else {
            Err(())
        }
    }
}

impl<T: TypedArrayElement, S: JSObjectStorage> ToJSValConvertible for TypedArray<T, S> {
    #[inline]
    unsafe fn to_jsval(&self, cx: *mut JSContext, rval: MutableHandleValue) {
        ToJSValConvertible::to_jsval(&self.object.as_raw(), cx, rval);
    }
}

pub enum CreateWith<'a, T: 'a> {
    Length(usize),
    Slice(&'a [T]),
}

/// A typed array wrapper.
pub struct TypedArray<T: TypedArrayElement, S: JSObjectStorage> {
    object: S,
    computed: Cell<Option<(*mut T::Element, usize)>>,
}

unsafe impl<T> CustomTrace for TypedArray<T, *mut JSObject>
where
    T: TypedArrayElement,
{
    fn trace(&self, trc: *mut JSTracer) {
        self.object.trace(trc);
    }
}

impl<T: TypedArrayElement, S: JSObjectStorage> TypedArray<T, S> {
    /// Create a typed array representation that wraps an existing JS reflector.
    /// This operation will fail if attempted on a JS object that does not match
    /// the expected typed array details.
    pub fn from(object: *mut JSObject) -> Result<Self, ()> {
        if object.is_null() {
            return Err(());
        }
        unsafe {
            let unwrapped = T::unwrap_array(object);
            if unwrapped.is_null() {
                return Err(());
            }

            Ok(TypedArray {
                object: S::from_raw(unwrapped),
                computed: Cell::new(None),
            })
        }
    }

    fn data(&self) -> (*mut T::Element, usize) {
        if let Some(data) = self.computed.get() {
            return data;
        }

        let data = unsafe { T::length_and_data(self.object.as_raw()) };
        self.computed.set(Some(data));
        data
    }

    /// Returns the number of elements in the underlying typed array.
    pub fn len(&self) -> usize {
        self.data().1 as usize
    }

    /// # Unsafety
    ///
    /// Returned wrapped pointer to the underlying `JSObject` is meant to be
    /// read-only, modifying it can lead to Undefined Behaviour and violation
    /// of TypedArray API guarantees.
    ///
    /// Practically, this exists only to implement `JSTraceable` trait in Servo
    /// for Box<Heap<*mut JSObject>> variant.
    pub unsafe fn underlying_object(&self) -> &S {
        &self.object
    }

    /// Retrieves an owned data that's represented by the typed array.
    pub fn to_vec(&self) -> Vec<T::Element>
    where
        T::Element: Clone,
    {
        // This is safe, because we immediately copy from the underlying buffer
        // to an owned collection. Otherwise, one needs to be careful, since
        // the underlying buffer can easily invalidated when transferred with
        // postMessage to another thread (To remedy that, we shouldn't
        // execute any JS code between getting the data pointer and using it).
        unsafe { self.as_slice().to_vec() }
    }

    /// # Unsafety
    ///
    /// The returned slice can be invalidated if the underlying typed array
    /// is neutered.
    pub unsafe fn as_slice(&self) -> &[T::Element] {
        let (pointer, length) = self.data();
        slice::from_raw_parts(pointer as *const T::Element, length as usize)
    }

    /// # Unsafety
    ///
    /// The returned slice can be invalidated if the underlying typed array
    /// is neutered.
    ///
    /// The underlying `JSObject` can be aliased, which can lead to
    /// Undefined Behavior due to mutable aliasing.
    pub unsafe fn as_mut_slice(&mut self) -> &mut [T::Element] {
        let (pointer, length) = self.data();
        slice::from_raw_parts_mut(pointer, length as usize)
    }

    /// Return a boolean flag which denotes whether the underlying buffer
    /// is a SharedArrayBuffer.
    pub fn is_shared(&self) -> bool {
        unsafe { JS_GetTypedArraySharedness(self.object.as_raw()) }
    }
}

impl<T: TypedArrayElementCreator + TypedArrayElement, S: JSObjectStorage> TypedArray<T, S> {
    /// Create a new JS typed array, optionally providing initial data that will
    /// be copied into the newly-allocated buffer. Returns the new JS reflector.
    pub unsafe fn create(
        cx: *mut JSContext,
        with: CreateWith<T::Element>,
        mut result: MutableHandleObject,
    ) -> Result<(), ()> {
        let length = match with {
            CreateWith::Length(len) => len,
            CreateWith::Slice(slice) => slice.len(),
        };

        result.set(T::create_new(cx, length));
        if result.get().is_null() {
            return Err(());
        }

        if let CreateWith::Slice(data) = with {
            Self::update_raw(data, result.get());
        }

        Ok(())
    }

    ///  Update an existed JS typed array
    pub unsafe fn update(&mut self, data: &[T::Element]) {
        Self::update_raw(data, self.object.as_raw());
    }

    unsafe fn update_raw(data: &[T::Element], result: *mut JSObject) {
        let (buf, length) = T::length_and_data(result);
        assert!(data.len() <= length as usize);
        ptr::copy_nonoverlapping(data.as_ptr(), buf, data.len());
    }
}

/// Internal trait used to associate an element type with an underlying representation
/// and various functions required to manipulate typed arrays of that element type.
pub trait TypedArrayElement {
    /// Underlying primitive representation of this element type.
    type Element;
    /// Unwrap a typed array JS reflector for this element type.
    unsafe fn unwrap_array(obj: *mut JSObject) -> *mut JSObject;
    /// Retrieve the length and data of a typed array's buffer for this element type.
    unsafe fn length_and_data(obj: *mut JSObject) -> (*mut Self::Element, usize);
}

/// Internal trait for creating new typed arrays.
pub trait TypedArrayElementCreator: TypedArrayElement {
    /// Create a new typed array.
    unsafe fn create_new(cx: *mut JSContext, length: usize) -> *mut JSObject;
    /// Get the data.
    unsafe fn get_data(obj: *mut JSObject) -> *mut Self::Element;
}

macro_rules! typed_array_element {
    ($t: ident,
     $element: ty,
     $unwrap: ident,
     $length_and_data: ident) => {
        /// A kind of typed array.
        pub struct $t;

        impl TypedArrayElement for $t {
            type Element = $element;
            unsafe fn unwrap_array(obj: *mut JSObject) -> *mut JSObject {
                $unwrap(obj)
            }

            unsafe fn length_and_data(obj: *mut JSObject) -> (*mut Self::Element, usize) {
                let mut len = 0;
                let mut shared = false;
                let mut data = ptr::null_mut();
                $length_and_data(obj, &mut len, &mut shared, &mut data);
                assert!(!shared);
                (data, len)
            }
        }
    };

    ($t: ident,
     $element: ty,
     $unwrap: ident,
     $length_and_data: ident,
     $create_new: ident,
     $get_data: ident) => {
        typed_array_element!($t, $element, $unwrap, $length_and_data);

        impl TypedArrayElementCreator for $t {
            unsafe fn create_new(cx: *mut JSContext, length: usize) -> *mut JSObject {
                $create_new(cx, length)
            }

            unsafe fn get_data(obj: *mut JSObject) -> *mut Self::Element {
                let mut shared = false;
                let data = $get_data(obj, &mut shared, ptr::null_mut());
                assert!(!shared);
                data
            }
        }
    };
}

typed_array_element!(
    Uint8,
    u8,
    UnwrapUint8Array,
    GetUint8ArrayLengthAndData,
    JS_NewUint8Array,
    JS_GetUint8ArrayData
);
typed_array_element!(
    Uint16,
    u16,
    UnwrapUint16Array,
    GetUint16ArrayLengthAndData,
    JS_NewUint16Array,
    JS_GetUint16ArrayData
);
typed_array_element!(
    Uint32,
    u32,
    UnwrapUint32Array,
    GetUint32ArrayLengthAndData,
    JS_NewUint32Array,
    JS_GetUint32ArrayData
);
typed_array_element!(
    Int8,
    i8,
    UnwrapInt8Array,
    GetInt8ArrayLengthAndData,
    JS_NewInt8Array,
    JS_GetInt8ArrayData
);
typed_array_element!(
    Int16,
    i16,
    UnwrapInt16Array,
    GetInt16ArrayLengthAndData,
    JS_NewInt16Array,
    JS_GetInt16ArrayData
);
typed_array_element!(
    Int32,
    i32,
    UnwrapInt32Array,
    GetInt32ArrayLengthAndData,
    JS_NewInt32Array,
    JS_GetInt32ArrayData
);
typed_array_element!(
    Float32,
    f32,
    UnwrapFloat32Array,
    GetFloat32ArrayLengthAndData,
    JS_NewFloat32Array,
    JS_GetFloat32ArrayData
);
typed_array_element!(
    Float64,
    f64,
    UnwrapFloat64Array,
    GetFloat64ArrayLengthAndData,
    JS_NewFloat64Array,
    JS_GetFloat64ArrayData
);
typed_array_element!(
    ClampedU8,
    u8,
    UnwrapUint8ClampedArray,
    GetUint8ClampedArrayLengthAndData,
    JS_NewUint8ClampedArray,
    JS_GetUint8ClampedArrayData
);
typed_array_element!(
    ArrayBufferU8,
    u8,
    UnwrapArrayBuffer,
    GetArrayBufferLengthAndData,
    NewArrayBuffer,
    GetArrayBufferData
);
typed_array_element!(
    ArrayBufferViewU8,
    u8,
    UnwrapArrayBufferView,
    GetArrayBufferViewLengthAndData
);

// Default type aliases, uses bare pointer by default, since stack lifetime
// should be the most common scenario
macro_rules! array_alias {
    ($arr: ident, $heap_arr: ident, $elem: ty) => {
        pub type $arr = TypedArray<$elem, *mut JSObject>;
        pub type $heap_arr = TypedArray<$elem, Box<Heap<*mut JSObject>>>;
    };
}

array_alias!(Uint8ClampedArray, HeapUint8ClampedArray, ClampedU8);
array_alias!(Uint8Array, HeapUint8Array, Uint8);
array_alias!(Int8Array, HeapInt8Array, Int8);
array_alias!(Uint16Array, HeapUint16Array, Uint16);
array_alias!(Int16Array, HeapInt16Array, Int16);
array_alias!(Uint32Array, HeapUint32Array, Uint32);
array_alias!(Int32Array, HeapInt32Array, Int32);
array_alias!(Float32Array, HeapFloat32Array, Float32);
array_alias!(Float64Array, HeapFloat64Array, Float64);
array_alias!(ArrayBuffer, HeapArrayBuffer, ArrayBufferU8);
array_alias!(ArrayBufferView, HeapArrayBufferView, ArrayBufferViewU8);

impl<S: JSObjectStorage> TypedArray<ArrayBufferViewU8, S> {
    pub fn get_array_type(&self) -> Type {
        unsafe { JS_GetArrayBufferViewType(self.object.as_raw()) }
    }
}

#[macro_export]
macro_rules! typedarray {
    (in($cx:expr) let $name:ident : $ty:ident = $init:expr) => {
        let mut __array =
            $crate::typedarray::$ty::from($init).map($crate::rust::CustomAutoRooter::new);

        let $name = __array.as_mut().map(|ok| ok.root($cx));
    };
    (in($cx:expr) let mut $name:ident : $ty:ident = $init:expr) => {
        let mut __array =
            $crate::typedarray::$ty::from($init).map($crate::rust::CustomAutoRooter::new);

        let mut $name = __array.as_mut().map(|ok| ok.root($cx));
    };
}
