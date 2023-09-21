use std::ffi::c_void;
use std::ops::{Deref, DerefMut};

use crate::c_str;
use crate::glue::{CallObjectRootTracer, CallValueRootTracer};
use crate::jsapi;
use crate::jsapi::{AutoGCRooter, AutoGCRooterKind, JSContext, JSObject, JSTracer, Value};
use crate::rust::{Handle, MutableHandle};
use mozjs_sys::jsgc::{CustomAutoRooterVFTable, RootKind};

/// Similarly to `Traceable` trait, it's used to specify tracing of various types
/// that are used in conjunction with `CustomAutoRooter`.
pub unsafe trait CustomTrace {
    fn trace(&self, trc: *mut JSTracer);
}

unsafe impl CustomTrace for *mut JSObject {
    fn trace(&self, trc: *mut JSTracer) {
        let this = self as *const *mut _ as *mut *mut _;
        unsafe {
            CallObjectRootTracer(trc, this, c_str!("object"));
        }
    }
}

unsafe impl CustomTrace for Value {
    fn trace(&self, trc: *mut JSTracer) {
        let this = self as *const _ as *mut _;
        unsafe {
            CallValueRootTracer(trc, this, c_str!("any"));
        }
    }
}

unsafe impl<T: CustomTrace> CustomTrace for Option<T> {
    fn trace(&self, trc: *mut JSTracer) {
        if let Some(ref some) = *self {
            some.trace(trc);
        }
    }
}

unsafe impl<T: CustomTrace> CustomTrace for Vec<T> {
    fn trace(&self, trc: *mut JSTracer) {
        for elem in self {
            elem.trace(trc);
        }
    }
}

// This structure reimplements a C++ class that uses virtual dispatch, so
// use C layout to guarantee that vftable in CustomAutoRooter is in right place.
#[repr(C)]
pub struct CustomAutoRooter<T> {
    _base: jsapi::CustomAutoRooter,
    data: T,
}

impl<T> CustomAutoRooter<T> {
    unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext) {
        self._base._base.add_to_root_stack(cx);
    }

    unsafe fn remove_from_root_stack(&mut self) {
        self._base._base.remove_from_root_stack();
    }
}

/// `CustomAutoRooter` uses dynamic dispatch on the C++ side for custom tracing,
/// so provide trace logic via vftable when creating an object on Rust side.
unsafe trait CustomAutoTraceable: Sized {
    const vftable: CustomAutoRooterVFTable = CustomAutoRooterVFTable {
        padding: CustomAutoRooterVFTable::PADDING,
        trace: Self::trace,
    };

    unsafe extern "C" fn trace(this: *mut c_void, trc: *mut JSTracer) {
        let this = this as *const Self;
        let this = this.as_ref().unwrap();
        Self::do_trace(this, trc);
    }

    /// Used by `CustomAutoTraceable` implementer to trace its contents.
    /// Corresponds to virtual `trace` call in a `CustomAutoRooter` subclass (C++).
    fn do_trace(&self, trc: *mut JSTracer);
}

unsafe impl<T: CustomTrace> CustomAutoTraceable for CustomAutoRooter<T> {
    fn do_trace(&self, trc: *mut JSTracer) {
        self.data.trace(trc);
    }
}

impl<T: CustomTrace> CustomAutoRooter<T> {
    pub fn new(data: T) -> Self {
        let vftable = &Self::vftable;
        CustomAutoRooter {
            _base: jsapi::CustomAutoRooter {
                vtable_: vftable as *const _ as *const _,
                _base: AutoGCRooter::new_unrooted(AutoGCRooterKind::Custom),
            },
            data,
        }
    }

    pub fn root(&mut self, cx: *mut JSContext) -> CustomAutoRooterGuard<T> {
        CustomAutoRooterGuard::new(cx, self)
    }
}

/// An RAII guard used to root underlying data in `CustomAutoRooter` until the
/// guard is dropped (falls out of scope).
/// The underlying data can be accessed through this guard via its Deref and
/// DerefMut implementations.
/// This structure is created by `root` method on `CustomAutoRooter` or
/// by the `auto_root!` macro.
pub struct CustomAutoRooterGuard<'a, T: 'a + CustomTrace> {
    rooter: &'a mut CustomAutoRooter<T>,
}

impl<'a, T: 'a + CustomTrace> CustomAutoRooterGuard<'a, T> {
    pub fn new(cx: *mut JSContext, rooter: &'a mut CustomAutoRooter<T>) -> Self {
        unsafe {
            rooter.add_to_root_stack(cx);
        }
        CustomAutoRooterGuard { rooter }
    }

    pub fn handle(&'a self) -> Handle<'a, T>
    where
        T: RootKind,
    {
        Handle::new(&self.rooter.data)
    }

    pub fn handle_mut(&mut self) -> MutableHandle<T>
    where
        T: RootKind,
    {
        unsafe { MutableHandle::from_marked_location(&mut self.rooter.data) }
    }
}

impl<'a, T: 'a + CustomTrace> Deref for CustomAutoRooterGuard<'a, T> {
    type Target = T;
    fn deref(&self) -> &T {
        &self.rooter.data
    }
}

impl<'a, T: 'a + CustomTrace> DerefMut for CustomAutoRooterGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut T {
        &mut self.rooter.data
    }
}

impl<'a, T: 'a + CustomTrace> Drop for CustomAutoRooterGuard<'a, T> {
    fn drop(&mut self) {
        unsafe {
            self.rooter.remove_from_root_stack();
        }
    }
}

pub type SequenceRooter<T> = CustomAutoRooter<Vec<T>>;
pub type SequenceRooterGuard<'a, T> = CustomAutoRooterGuard<'a, Vec<T>>;
