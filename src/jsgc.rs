/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use jsapi::JS;
use jsapi::jsid;
use jsapi::JSFunction;
use jsapi::JSObject;
use jsapi::JSScript;
use jsapi::JSString;
use jsapi::JSTracer;
use jsid::JSID_VOID;

use std::cell::UnsafeCell;
use std::mem;
use std::os::raw::c_void;
use std::ptr;

/// A trait for JS types that can be registered as roots.
pub trait RootKind {
    #[allow(non_snake_case)]
    /// Returns the rooting kind for `Self`.
    fn rootKind() -> JS::RootKind;
}

impl RootKind for *mut JSObject {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Object }
}

impl RootKind for *mut JSFunction {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Object }
}

impl RootKind for *mut JSString {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::String }
}

impl RootKind for *mut JS::Symbol {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Symbol }
}

impl RootKind for *mut JSScript {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Script }
}

impl RootKind for jsid {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Id }
}

impl RootKind for JS::Value {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Value }
}

impl RootKind for JS::PropertyDescriptor {
    #[inline(always)]
    fn rootKind() -> JS::RootKind { JS::RootKind::Traceable }
}

// Annoyingly, bindgen can't cope with SM's use of templates, so we have to roll our own.
#[repr(C)]
#[derive(Debug)]
pub struct Rooted<T> {
    pub stack: *mut *mut Rooted<*mut c_void>,
    pub prev: *mut Rooted<*mut c_void>,
    pub ptr: T,
}

/// A trait for types which can place appropriate GC barriers.
/// * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Internals/Garbage_collection#Incremental_marking
/// * https://dxr.mozilla.org/mozilla-central/source/js/src/gc/Barrier.h
pub trait GCMethods {
    /// Create a default value
    unsafe fn initial() -> Self;

    /// Place a post-write barrier
    unsafe fn post_barrier(v: *mut Self, prev: Self, next: Self);
}

impl GCMethods for jsid {
    unsafe fn initial() -> jsid { JSID_VOID }
    unsafe fn post_barrier(_: *mut jsid, _: jsid, _: jsid) {}
}

impl GCMethods for *mut JSObject {
    unsafe fn initial() -> *mut JSObject { ptr::null_mut() }
    unsafe fn post_barrier(v: *mut *mut JSObject,
                           prev: *mut JSObject, next: *mut JSObject) {
        JS::HeapObjectWriteBarriers(v, prev, next);
    }
}

impl GCMethods for *mut JSString {
    unsafe fn initial() -> *mut JSString { ptr::null_mut() }
    unsafe fn post_barrier(_: *mut *mut JSString, _: *mut JSString, _: *mut JSString) {}
}

impl GCMethods for *mut JSScript {
    unsafe fn initial() -> *mut JSScript { ptr::null_mut() }
    unsafe fn post_barrier(_: *mut *mut JSScript, _: *mut JSScript, _: *mut JSScript) { }
}

impl GCMethods for *mut JSFunction {
    unsafe fn initial() -> *mut JSFunction { ptr::null_mut() }
    unsafe fn post_barrier(v: *mut *mut JSFunction,
                           prev: *mut JSFunction, next: *mut JSFunction) {
        JS::HeapObjectWriteBarriers(mem::transmute(v), mem::transmute(prev), mem::transmute(next));
    }
}

impl GCMethods for JS::Value {
    unsafe fn initial() -> JS::Value { JS::Value::default() }
    unsafe fn post_barrier(v: *mut JS::Value, prev: JS::Value, next: JS::Value) {
        JS::HeapValueWriteBarriers(v, &prev, &next);
    }
}

impl GCMethods for JS::PropertyDescriptor {
    unsafe fn initial() -> JS::PropertyDescriptor { JS::PropertyDescriptor::default() }
    unsafe fn post_barrier(_ : *mut JS::PropertyDescriptor, _ : JS::PropertyDescriptor, _ : JS::PropertyDescriptor) {}
}

/// Heap values encapsulate GC concerns of an on-heap reference to a JS
/// object. This means that every reference to a JS object on heap must
/// be realized through this structure.
///
/// # Safety
/// For garbage collection to work correctly in SpiderMonkey, modifying the
/// wrapped value triggers a GC barrier, pointing to the underlying object.
///
/// This means that after calling the `set()` function with a non-null or
/// non-undefined value, the `Heap` wrapper *must not* be moved, since doing
/// so will invalidate the local reference to wrapped value, still held by
/// SpiderMonkey.
///
/// For safe `Heap` construction with value see `Heap::boxed` function.
#[repr(C)]
#[derive(Debug)]
pub struct Heap<T: GCMethods + Copy> {
    pub ptr: UnsafeCell<T>,
}

impl<T: GCMethods + Copy> Heap<T> {
    /// This creates a `Box`-wrapped Heap value. Setting a value inside Heap
    /// object triggers a barrier, referring to the Heap object location,
    /// hence why it is not safe to construct a temporary Heap value, assign
    /// a non-null value and move it (e.g. typical object construction).
    ///
    /// Using boxed Heap value guarantees that the underlying Heap value will
    /// not be moved when constructed.
    pub fn boxed(v: T) -> Box<Heap<T>>
        where Heap<T>: Default
    {
        let boxed = Box::new(Heap::default());
        boxed.set(v);
        boxed
    }

    pub fn set(&self, v: T) {
        unsafe {
            let ptr = self.ptr.get();
            let prev = *ptr;
            *ptr = v;
            T::post_barrier(ptr, prev, v);
        }
    }

    pub fn get(&self) -> T {
        unsafe { *self.ptr.get() }
    }

    pub fn get_unsafe(&self) -> *mut T {
        self.ptr.get()
    }

    pub fn handle_mut(&self) -> JS::MutableHandle<T> {
        unsafe {
            JS::MutableHandle::from_marked_location(self.ptr.get())
        }
    }
    /// Retrieves a Handle to the underlying value.
    ///
    /// # Safety
    ///
    /// This is only safe to do on a rooted object (which Heap is not, it needs
    /// to be additionally rooted), like RootedGuard, so use this only if you
    /// know what you're doing.
    ///
    /// # Notes
    ///
    /// Since Heap values need to be informed when a change to underlying
    /// value is made (e.g. via `get()`), this does not allow to create
    /// MutableHandle objects, which can bypass this and lead to crashes.
    pub unsafe fn handle(&self) -> JS::Handle<T> {
        JS::Handle::from_marked_location(self.ptr.get() as *const _)
    }
}

impl<T> Default for Heap<*mut T>
    where *mut T: GCMethods + Copy
{
    fn default() -> Heap<*mut T> {
        Heap {
            ptr: UnsafeCell::new(ptr::null_mut())
        }
    }
}

impl Default for Heap<JS::Value> {
    fn default() -> Heap<JS::Value> {
        Heap {
            ptr: UnsafeCell::new(JS::Value::default())
        }
    }
}

impl<T: GCMethods + Copy> Drop for Heap<T> {
    fn drop(&mut self) {
        unsafe {
            let ptr = self.ptr.get();
            T::post_barrier(ptr, *ptr, T::initial());
        }
    }
}

impl<T: GCMethods + Copy + PartialEq> PartialEq for Heap<T> {
    fn eq(&self, other: &Self) -> bool {
        self.get() == other.get()
    }
}

/// Trait for things that can be converted to handles
/// For any type `T: IntoHandle` we have an implementation of `From<T>`
/// for `MutableHandle<T::Target>`. This is a way round the orphan
/// rule.
pub trait IntoHandle {
    /// The type of the handle
    type Target;

    /// Convert this object to a handle.
    fn into_handle(self) -> JS::Handle<Self::Target>;
}

pub trait IntoMutableHandle: IntoHandle {
    /// Convert this object to a mutable handle.
    fn into_handle_mut(self) -> JS::MutableHandle<Self::Target>;
}

impl<T: IntoHandle> From<T> for JS::Handle<T::Target> {
    fn from(value: T) -> Self {
        value.into_handle()
    }
}

impl<T: IntoMutableHandle> From<T> for JS::MutableHandle<T::Target> {
    fn from(value: T) -> Self {
        value.into_handle_mut()
    }
}

/// Methods for a CustomAutoRooter
#[repr(C)]
pub struct CustomAutoRooterVFTable {
    #[cfg(windows)]
    pub padding: [usize; 1],
    #[cfg(not(windows))]
    pub padding: [usize; 2],
    pub trace: unsafe extern "C" fn (this: *mut c_void, trc: *mut JSTracer),
}

impl CustomAutoRooterVFTable {
    #[cfg(windows)]
    pub const PADDING: [usize; 1] = [0];
    #[cfg(not(windows))]
    pub const PADDING: [usize; 2] = [0, 0];
}
