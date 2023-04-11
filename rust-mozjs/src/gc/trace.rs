use c_str;
use glue::{
    CallFunctionTracer, CallIdTracer, CallObjectTracer, CallScriptTracer, CallStringTracer,
    CallValueTracer,
};
use jsapi::{jsid, JSFunction, JSObject, JSScript, JSString, JSTracer, Value};
use mozjs_sys::jsgc::Heap;
use std::cell::{Cell, RefCell, UnsafeCell};
use std::collections::btree_map::BTreeMap;
use std::collections::btree_set::BTreeSet;
use std::collections::vec_deque::VecDeque;
use std::collections::{HashMap, HashSet};
use std::ffi::c_void;
use std::hash::{BuildHasher, Hash};
use std::rc::Rc;
use std::sync::Arc;

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

unsafe impl<T: Traceable> Traceable for Box<T> {
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

unsafe impl<A: Traceable, B: Traceable> Traceable for (A, B) {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        self.0.trace(trc);
        self.1.trace(trc);
    }
}

unsafe impl<A: Traceable, B: Traceable, C: Traceable> Traceable for (A, B, C) {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        self.0.trace(trc);
        self.1.trace(trc);
        self.2.trace(trc);
    }
}

unsafe impl<A: Traceable, B: Traceable, C: Traceable, D: Traceable> Traceable for (A, B, C, D) {
    #[inline]
    unsafe fn trace(&self, trc: *mut JSTracer) {
        self.0.trace(trc);
        self.1.trace(trc);
        self.2.trace(trc);
        self.3.trace(trc);
    }
}

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
