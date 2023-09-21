use crate::c_str;
use crate::glue::{
    CallBigIntTracer, CallFunctionTracer, CallIdTracer, CallObjectTracer, CallScriptTracer,
    CallStringTracer, CallSymbolTracer, CallValueTracer,
};
use crate::jsapi::JS::{BigInt, JobQueue, Symbol};
use crate::jsapi::{jsid, Heap, JSFunction, JSObject, JSScript, JSString, JSTracer, Value};
use std::any::TypeId;
use std::borrow::Cow;
use std::cell::{Cell, RefCell, UnsafeCell};
use std::collections::btree_map::BTreeMap;
use std::collections::btree_set::BTreeSet;
use std::collections::vec_deque::VecDeque;
use std::collections::{HashMap, HashSet};
use std::ffi::c_void;
use std::hash::{BuildHasher, Hash};
use std::num::{
    NonZeroI128, NonZeroI16, NonZeroI32, NonZeroI64, NonZeroI8, NonZeroIsize, NonZeroU128,
    NonZeroU16, NonZeroU32, NonZeroU64, NonZeroU8, NonZeroUsize,
};
use std::ops::Range;
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::atomic::{
    AtomicBool, AtomicI16, AtomicI32, AtomicI64, AtomicI8, AtomicIsize, AtomicU16, AtomicU32,
    AtomicU64, AtomicU8, AtomicUsize,
};
use std::sync::Arc;
use std::thread::JoinHandle;
use std::time::{Instant, SystemTime};

use crate::rust::{Runtime, Stencil};
use crate::typedarray::{TypedArray, TypedArrayElement};

/// Types that can be traced.
///
/// This trait is unsafe; if it is implemented incorrectly, the GC may end up collecting objects
/// that are still reachable.
pub unsafe trait Traceable {
    /// Trace `self`.
    unsafe fn trace(&self, trc: *mut JSTracer);
}

unsafe impl Traceable for Heap<*mut JSFunction> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        if self.get().is_null() {
            return;
        }
        CallFunctionTracer(trc, self as *const _ as *mut Self, c_str!("function"));
    }
}

unsafe impl Traceable for Heap<*mut JSObject> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        if self.get().is_null() {
            return;
        }
        CallObjectTracer(trc, self as *const _ as *mut Self, c_str!("object"));
    }
}

unsafe impl Traceable for Heap<*mut Symbol> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        if self.get().is_null() {
            return;
        }
        CallSymbolTracer(trc, self as *const _ as *mut Self, c_str!("symbol"));
    }
}

unsafe impl Traceable for Heap<*mut BigInt> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        if self.get().is_null() {
            return;
        }
        CallBigIntTracer(trc, self as *const _ as *mut Self, c_str!("bigint"));
    }
}

unsafe impl Traceable for Heap<*mut JSScript> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        if self.get().is_null() {
            return;
        }
        CallScriptTracer(trc, self as *const _ as *mut Self, c_str!("script"));
    }
}

unsafe impl Traceable for Heap<*mut JSString> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        if self.get().is_null() {
            return;
        }
        CallStringTracer(trc, self as *const _ as *mut Self, c_str!("string"));
    }
}

unsafe impl Traceable for Heap<Value> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallValueTracer(trc, self as *const _ as *mut Self, c_str!("value"));
    }
}

unsafe impl Traceable for Heap<jsid> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallIdTracer(trc, self as *const _ as *mut Self, c_str!("id"));
    }
}

unsafe impl<T: Traceable> Traceable for Rc<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        (**self).trace(trc);
    }
}

unsafe impl<T: Traceable> Traceable for Arc<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        (**self).trace(trc);
    }
}

unsafe impl<T: Traceable + ?Sized> Traceable for Box<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        (**self).trace(trc);
    }
}

unsafe impl<T: Traceable + Copy> Traceable for Cell<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        self.get().trace(trc);
    }
}

unsafe impl<T: Traceable> Traceable for UnsafeCell<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        (*self.get()).trace(trc);
    }
}

unsafe impl<T: Traceable> Traceable for RefCell<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        (*self).borrow().trace(trc);
    }
}

unsafe impl<T: Traceable> Traceable for Option<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        self.as_ref().map(|t| t.trace(trc));
    }
}

unsafe impl<T: Traceable, E: Traceable> Traceable for Result<T, E> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        match self {
            Ok(t) => t.trace(trc),
            Err(e) => e.trace(trc),
        }
    }
}

unsafe impl<T: Traceable> Traceable for [T] {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for t in self.iter() {
            t.trace(trc);
        }
    }
}

// jsmanaged array
unsafe impl<T: Traceable, const COUNT: usize> Traceable for [T; COUNT] {
    #[inline]
    unsafe fn trace(&self, tracer: *mut JSTracer) {
        for v in self.iter() {
            v.trace(tracer);
        }
    }
}

// TODO: Check if the following two are optimized to no-ops
// if e.trace() is a no-op (e.g it is an impl_traceable_simple type)
unsafe impl<T: Traceable> Traceable for Vec<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for t in &*self {
            t.trace(trc);
        }
    }
}

unsafe impl<T: Traceable> Traceable for VecDeque<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for t in &*self {
            t.trace(trc);
        }
    }
}

unsafe impl<K: Traceable + Eq + Hash, V: Traceable, S: BuildHasher> Traceable for HashMap<K, V, S> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for (k, v) in &*self {
            k.trace(trc);
            v.trace(trc);
        }
    }
}

unsafe impl<T: Traceable + Eq + Hash, S: BuildHasher> Traceable for HashSet<T, S> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for t in &*self {
            t.trace(trc);
        }
    }
}

unsafe impl<K: Traceable + Eq + Hash, V: Traceable> Traceable for BTreeMap<K, V> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for (k, v) in &*self {
            k.trace(trc);
            v.trace(trc);
        }
    }
}

unsafe impl<T: Traceable> Traceable for BTreeSet<T> {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        for t in &*self {
            t.trace(trc);
        }
    }
}

unsafe impl<T: TypedArrayElement> Traceable for TypedArray<T, Box<Heap<*mut JSObject>>> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        self.underlying_object().trace(trc);
    }
}

macro_rules! impl_traceable_tuple {
    () => {
        unsafe impl Traceable for () {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
    };
    ($($name:ident)+) => {
        unsafe impl<$($name: Traceable,)+> Traceable for ($($name,)+) {
            #[allow(non_snake_case)]
            #[inline]
            unsafe fn trace(&self, trc: *mut JSTracer) {
                let ($(ref $name,)+) = *self;
                $($name.trace(trc);)+
            }
        }
    };
}

impl_traceable_tuple! {}
impl_traceable_tuple! { A }
impl_traceable_tuple! { A B }
impl_traceable_tuple! { A B C }
impl_traceable_tuple! { A B C D }
impl_traceable_tuple! { A B C D E }
impl_traceable_tuple! { A B C D E F }
impl_traceable_tuple! { A B C D E F G }
impl_traceable_tuple! { A B C D E F G H }
impl_traceable_tuple! { A B C D E F G H I }
impl_traceable_tuple! { A B C D E F G H I J }
impl_traceable_tuple! { A B C D E F G H I J K }
impl_traceable_tuple! { A B C D E F G H I J K L }

macro_rules! impl_traceable_fnptr {
    () => {
        unsafe impl<Ret> Traceable for fn() -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret> Traceable for unsafe fn() -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret> Traceable for extern "C" fn() -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret> Traceable for unsafe extern "C" fn() -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
    };
    ($($arg:ident)+) => {
        unsafe impl<Ret, $($arg,)+> Traceable for fn($($arg,)+) -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret, $($arg,)+> Traceable for unsafe fn($($arg,)+) -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret, $($arg,)+> Traceable for extern "C" fn($($arg,)+) -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret, $($arg,)+> Traceable for unsafe extern "C" fn($($arg,)+) -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret, $($arg,)+> Traceable for extern "C" fn($($arg),+, ...) -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
        unsafe impl<Ret, $($arg,)+> Traceable for unsafe extern "C" fn($($arg),+, ...) -> Ret {
            #[inline]
            unsafe fn trace(&self, _: *mut JSTracer) {}
        }
    }
}

impl_traceable_fnptr! {}
impl_traceable_fnptr! { A }
impl_traceable_fnptr! { A B }
impl_traceable_fnptr! { A B C }
impl_traceable_fnptr! { A B C D }
impl_traceable_fnptr! { A B C D E }
impl_traceable_fnptr! { A B C D E F }
impl_traceable_fnptr! { A B C D E F G }
impl_traceable_fnptr! { A B C D E F G H }
impl_traceable_fnptr! { A B C D E F G H I }
impl_traceable_fnptr! { A B C D E F G H I J }
impl_traceable_fnptr! { A B C D E F G H I J K }
impl_traceable_fnptr! { A B C D E F G H I J K L }

/// For use on non-jsmanaged types
macro_rules! impl_traceable_simple {
    ($($ty:ty $(,)?)+) => {
        $(
            unsafe impl Traceable for $ty {
                #[inline]
                unsafe fn trace(&self, _: *mut JSTracer) {}
            }
        )+
    }
}

impl_traceable_simple!(bool);
impl_traceable_simple!(i8, i16, i32, i64, isize);
impl_traceable_simple!(u8, u16, u32, u64, usize);
impl_traceable_simple!(f32, f64);
impl_traceable_simple!(char, String);
impl_traceable_simple!(
    NonZeroI128,
    NonZeroI16,
    NonZeroI32,
    NonZeroI64,
    NonZeroI8,
    NonZeroIsize
);
impl_traceable_simple!(
    NonZeroU128,
    NonZeroU16,
    NonZeroU32,
    NonZeroU64,
    NonZeroU8,
    NonZeroUsize
);
impl_traceable_simple!(AtomicBool);
impl_traceable_simple!(AtomicI8, AtomicI16, AtomicI32, AtomicI64, AtomicIsize);
impl_traceable_simple!(AtomicU8, AtomicU16, AtomicU32, AtomicU64, AtomicUsize);
impl_traceable_simple!(Cow<'static, str>);
impl_traceable_simple!(TypeId);
impl_traceable_simple!(SystemTime, Instant);
impl_traceable_simple!(PathBuf);
impl_traceable_simple!(Range<u64>);
impl_traceable_simple!(JoinHandle<()>);
impl_traceable_simple!(*mut JobQueue);
impl_traceable_simple!(Runtime);
impl_traceable_simple!(Stencil);

unsafe impl<'a> Traceable for &'a str {
    #[inline]
    unsafe fn trace(&self, _: *mut JSTracer) {}
}

/// Holds a set of JSTraceables that need to be rooted
pub struct RootedTraceableSet {
    set: Vec<*const dyn Traceable>,
}

thread_local!(
    static ROOTED_TRACEABLES: RefCell<RootedTraceableSet>  = RefCell::new(RootedTraceableSet::new())
);

impl RootedTraceableSet {
    fn new() -> RootedTraceableSet {
        RootedTraceableSet { set: Vec::new() }
    }

    pub unsafe fn add(traceable: *const dyn Traceable) {
        ROOTED_TRACEABLES.with(|traceables| {
            traceables.borrow_mut().set.push(traceable);
        });
    }

    pub unsafe fn remove(traceable: *const dyn Traceable) {
        ROOTED_TRACEABLES.with(|traceables| {
            let mut traceables = traceables.borrow_mut();
            let idx = match traceables
                .set
                .iter()
                .rposition(|x| *x as *const () == traceable as *const ())
            {
                Some(idx) => idx,
                None => return,
            };
            traceables.set.remove(idx);
        });
    }

    pub(crate) unsafe fn trace(&self, trc: *mut JSTracer) {
        for traceable in &self.set {
            (**traceable).trace(trc);
        }
    }
}

pub unsafe extern "C" fn trace_traceables(trc: *mut JSTracer, _: *mut c_void) {
    ROOTED_TRACEABLES.with(|traceables| {
        traceables.borrow().trace(trc);
    });
}
