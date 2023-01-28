/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

//! Rust wrappers around the raw JS apis

use mozjs_sys::jsgc::IntoHandle as IntoRawHandle;
use mozjs_sys::jsgc::IntoMutableHandle as IntoRawMutableHandle;
use mozjs_sys::jsgc::RootKind;
use mozjs_sys::{jsapi::JS::shadow::BaseShape, jsgc::CustomAutoRooterVFTable};

use std::cell::Cell;
use std::char;
use std::default::Default;
use std::ffi;
use std::ffi::CStr;
use std::marker::PhantomData;
use std::mem::MaybeUninit;
use std::ops::{Deref, DerefMut};
use std::os::raw::c_void;
use std::ptr;
use std::slice;
use std::str;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};

use consts::{JSCLASS_GLOBAL_SLOT_COUNT, JSCLASS_RESERVED_SLOTS_MASK};
use consts::{JSCLASS_IS_DOMJSCLASS, JSCLASS_IS_GLOBAL};

use conversions::jsstr_to_string;

use jsapi;
use jsapi::glue::{DeleteRealmOptions, JS_Init, JS_NewRealmOptions};
use jsapi::js::frontend::CompilationStencil;
use jsapi::mozilla::Utf8Unit;
use jsapi::Handle as RawHandle;
use jsapi::HandleObjectVector as RawHandleObjectVector;
use jsapi::HandleValue as RawHandleValue;
use jsapi::MutableHandle as RawMutableHandle;
use jsapi::MutableHandleIdVector as RawMutableHandleIdVector;
use jsapi::JS::RegExpFlags;
use jsapi::{already_AddRefed, jsid, Value};
use jsapi::{AutoGCRooter, AutoGCRooterKind};
use jsapi::{BuildStackString, CaptureCurrentStack, StackFormat};
use jsapi::{Evaluate2, HandleValueArray, Heap, StencilRelease};
use jsapi::{InitSelfHostedCode, InstantiationStorage, IsWindowSlow, OffThreadToken};
use jsapi::{JSAutoRealm, JS_SetGCParameter, JS_SetNativeStackQuota, JS_WrapValue};
use jsapi::{JSClass, JSClassOps, JSContext, Realm, JSCLASS_RESERVED_SLOTS_SHIFT};
use jsapi::{JSErrorReport, JSFunction, JSFunctionSpec, JSGCParamKey};
use jsapi::{JSObject, JSPropertySpec, JSRuntime, JSScript};
use jsapi::{JSString, JSTracer, Object, PersistentRootedIdVector};
use jsapi::{JS_DefineFunctions, JS_DefineProperties, JS_DestroyContext, JS_ShutDown};
use jsapi::{JS_EnumerateStandardClasses, JS_GetRuntime, JS_GlobalObjectTraceHook};
use jsapi::{JS_MayResolveStandardClass, JS_NewContext, JS_ResolveStandardClass};
use jsapi::{JS_StackCapture_AllFrames, JS_StackCapture_MaxFrames};
use jsapi::{PersistentRootedObjectVector, ReadOnlyCompileOptions, Rooted, RootingContext};
use jsapi::{SetWarningReporter, SourceText, Symbol, ToBooleanSlow};
use jsapi::{ToInt32Slow, ToInt64Slow, ToNumberSlow, ToStringSlow, ToUint16Slow};
use jsapi::{ToUint32Slow, ToUint64Slow, ToWindowProxyIfWindowSlow};

use jsval::ObjectValue;

use glue::{AppendToRootedObjectVector, CallFunctionTracer, CallIdTracer, CallObjectRootTracer};
use glue::{CallObjectTracer, CallScriptTracer, CallStringTracer, CallValueRootTracer};
use glue::{CallValueTracer, CreateRootedIdVector, CreateRootedObjectVector};
use glue::{
    DeleteCompileOptions, DeleteRootedObjectVector, DescribeScriptedCaller, DestroyRootedIdVector,
};
use glue::{GetIdVectorAddress, GetObjectVectorAddress, NewCompileOptions, SliceRootedIdVector};

use panic::maybe_resume_unwind;

use default_heapsize;

pub use mozjs_sys::jsgc::{GCMethods, IntoHandle, IntoMutableHandle};

// From Gecko:
// Our "default" stack is what we use in configurations where we don't have a compelling reason to
// do things differently. This is effectively 1MB on 64-bit platforms.
const STACK_QUOTA: usize = 128 * 8 * 1024;

// From Gecko:
// The JS engine permits us to set different stack limits for system code,
// trusted script, and untrusted script. We have tests that ensure that
// we can always execute 10 "heavy" (eval+with) stack frames deeper in
// privileged code. Our stack sizes vary greatly in different configurations,
// so satisfying those tests requires some care. Manual measurements of the
// number of heavy stack frames achievable gives us the following rough data,
// ordered by the effective categories in which they are grouped in the
// JS_SetNativeStackQuota call (which predates this analysis).
//
// (NB: These numbers may have drifted recently - see bug 938429)
// OSX 64-bit Debug: 7MB stack, 636 stack frames => ~11.3k per stack frame
// OSX64 Opt: 7MB stack, 2440 stack frames => ~3k per stack frame
//
// Linux 32-bit Debug: 2MB stack, 426 stack frames => ~4.8k per stack frame
// Linux 64-bit Debug: 4MB stack, 455 stack frames => ~9.0k per stack frame
//
// Windows (Opt+Debug): 900K stack, 235 stack frames => ~3.4k per stack frame
//
// Linux 32-bit Opt: 1MB stack, 272 stack frames => ~3.8k per stack frame
// Linux 64-bit Opt: 2MB stack, 316 stack frames => ~6.5k per stack frame
//
// We tune the trusted/untrusted quotas for each configuration to achieve our
// invariants while attempting to minimize overhead. In contrast, our buffer
// between system code and trusted script is a very unscientific 10k.
const SYSTEM_CODE_BUFFER: usize = 10 * 1024;

// Gecko's value on 64-bit.
const TRUSTED_SCRIPT_BUFFER: usize = 8 * 12800;

trait ToResult {
    fn to_result(self) -> Result<(), ()>;
}

impl ToResult for bool {
    fn to_result(self) -> Result<(), ()> {
        if self {
            Ok(())
        } else {
            Err(())
        }
    }
}

// ___________________________________________________________________________
// friendly Rustic API to runtimes

pub struct RealmOptions(*mut jsapi::RealmOptions);

impl Deref for RealmOptions {
    type Target = jsapi::RealmOptions;
    fn deref(&self) -> &Self::Target {
        unsafe { &*self.0 }
    }
}

impl DerefMut for RealmOptions {
    fn deref_mut(&mut self) -> &mut Self::Target {
        unsafe { &mut *self.0 }
    }
}

impl Default for RealmOptions {
    fn default() -> RealmOptions {
        RealmOptions(unsafe { JS_NewRealmOptions() })
    }
}

impl Drop for RealmOptions {
    fn drop(&mut self) {
        unsafe { DeleteRealmOptions(self.0) }
    }
}

thread_local!(static CONTEXT: Cell<*mut JSContext> = Cell::new(ptr::null_mut()));

#[derive(PartialEq)]
enum EngineState {
    Uninitialized,
    InitFailed,
    Initialized,
    ShutDown,
}

lazy_static! {
    static ref ENGINE_STATE: Mutex<EngineState> = Mutex::new(EngineState::Uninitialized);
}

#[derive(Debug)]
pub enum JSEngineError {
    AlreadyInitialized,
    AlreadyShutDown,
    InitFailed,
}

/// A handle that must be kept alive in order to create new Runtimes.
/// When this handle is dropped, the engine is shut down and cannot
/// be reinitialized.
pub struct JSEngine {
    /// The count of alive handles derived from this initialized instance.
    outstanding_handles: Arc<AtomicU32>,
    // Ensure this type cannot be sent between threads.
    marker: PhantomData<*mut ()>,
}

pub struct JSEngineHandle(Arc<AtomicU32>);

impl Clone for JSEngineHandle {
    fn clone(&self) -> JSEngineHandle {
        self.0.fetch_add(1, Ordering::SeqCst);
        JSEngineHandle(self.0.clone())
    }
}

impl Drop for JSEngineHandle {
    fn drop(&mut self) {
        self.0.fetch_sub(1, Ordering::SeqCst);
    }
}

impl JSEngine {
    /// Initialize the JS engine to prepare for creating new JS runtimes.
    pub fn init() -> Result<JSEngine, JSEngineError> {
        let mut state = ENGINE_STATE.lock().unwrap();
        match *state {
            EngineState::Initialized => return Err(JSEngineError::AlreadyInitialized),
            EngineState::InitFailed => return Err(JSEngineError::InitFailed),
            EngineState::ShutDown => return Err(JSEngineError::AlreadyShutDown),
            EngineState::Uninitialized => (),
        }
        if unsafe { !JS_Init() } {
            *state = EngineState::InitFailed;
            Err(JSEngineError::InitFailed)
        } else {
            *state = EngineState::Initialized;
            Ok(JSEngine {
                outstanding_handles: Arc::new(AtomicU32::new(0)),
                marker: PhantomData,
            })
        }
    }

    pub fn can_shutdown(&self) -> bool {
        self.outstanding_handles.load(Ordering::SeqCst) == 0
    }

    /// Create a handle to this engine.
    pub fn handle(&self) -> JSEngineHandle {
        self.outstanding_handles.fetch_add(1, Ordering::SeqCst);
        JSEngineHandle(self.outstanding_handles.clone())
    }
}

/// Shut down the JS engine, invalidating any existing runtimes and preventing
/// any new ones from being created.
impl Drop for JSEngine {
    fn drop(&mut self) {
        let mut state = ENGINE_STATE.lock().unwrap();
        if *state == EngineState::Initialized {
            assert_eq!(
                self.outstanding_handles.load(Ordering::SeqCst),
                0,
                "There are outstanding JS engine handles"
            );
            *state = EngineState::ShutDown;
            unsafe {
                JS_ShutDown();
            }
        }
    }
}

pub fn transform_str_to_source_text(source: &str) -> SourceText<Utf8Unit> {
    SourceText {
        units_: source.as_ptr() as *const _,
        length_: source.len() as u32,
        ownsUnits_: false,
        _phantom_0: PhantomData,
    }
}

pub fn transform_u16_to_source_text(source: &[u16]) -> SourceText<u16> {
    SourceText {
        units_: source.as_ptr() as *const _,
        length_: source.len() as u32,
        ownsUnits_: false,
        _phantom_0: PhantomData,
    }
}

/// A handle to a Runtime that will be used to create a new runtime in another
/// thread. This handle and the new runtime must be destroyed before the original
/// runtime can be dropped.
pub struct ParentRuntime {
    /// Raw pointer to the underlying SpiderMonkey runtime.
    parent: *mut JSRuntime,
    /// Handle to ensure the JS engine remains running while this handle exists.
    engine: JSEngineHandle,
    /// The number of children of the runtime that created this ParentRuntime value.
    children_of_parent: Arc<()>,
}
unsafe impl Send for ParentRuntime {}

/// A wrapper for the `JSContext` structure in SpiderMonkey.
pub struct Runtime {
    /// Raw pointer to the underlying SpiderMonkey context.
    cx: *mut JSContext,
    /// The engine that this runtime is associated with.
    engine: JSEngineHandle,
    /// If this Runtime was created with a parent, this member exists to ensure
    /// that that parent's count of outstanding children (see [outstanding_children])
    /// remains accurate and will be automatically decreased when this Runtime value
    /// is dropped.
    _parent_child_count: Option<Arc<()>>,
    /// The strong references to this value represent the number of child runtimes
    /// that have been created using this Runtime as a parent. Since Runtime values
    /// must be associated with a particular thread, we cannot simply use Arc<Runtime>
    /// to represent the resulting ownership graph and risk destroying a Runtime on
    /// the wrong thread.
    outstanding_children: Arc<()>,
}

impl Runtime {
    /// Get the `JSContext` for this thread.
    pub fn get() -> *mut JSContext {
        let cx = CONTEXT.with(|context| context.get());
        assert!(!cx.is_null());
        cx
    }

    /// Creates a new `JSContext`.
    pub fn new(engine: JSEngineHandle) -> Runtime {
        unsafe { Self::create(engine, None) }
    }

    /// Signal that a new child runtime will be created in the future, and ensure
    /// that this runtime will not allow itself to be destroyed before the new
    /// child runtime. Returns a handle that can be passed to `create_with_parent`
    /// in order to create a new runtime on another thread that is associated with
    /// this runtime.
    pub fn prepare_for_new_child(&self) -> ParentRuntime {
        ParentRuntime {
            parent: self.rt(),
            engine: self.engine.clone(),
            children_of_parent: self.outstanding_children.clone(),
        }
    }

    /// Creates a new `JSContext` with a parent runtime. If the parent does not outlive
    /// the new runtime, its destructor will assert.
    ///
    /// Unsafety:
    /// If panicking does not abort the program, any threads with child runtimes will
    /// continue executing after the thread with the parent runtime panics, but they
    /// will be in an invalid and undefined state.
    pub unsafe fn create_with_parent(parent: ParentRuntime) -> Runtime {
        Self::create(parent.engine.clone(), Some(parent))
    }

    unsafe fn create(engine: JSEngineHandle, parent: Option<ParentRuntime>) -> Runtime {
        let parent_runtime = parent.as_ref().map_or(ptr::null_mut(), |r| r.parent);
        let js_context = JS_NewContext(default_heapsize + (ChunkSize as u32), parent_runtime);
        assert!(!js_context.is_null());

        // Unconstrain the runtime's threshold on nominal heap size, to avoid
        // triggering GC too often if operating continuously near an arbitrary
        // finite threshold. This leaves the maximum-JS_malloc-bytes threshold
        // still in effect to cause periodical, and we hope hygienic,
        // last-ditch GCs from within the GC's allocator.
        JS_SetGCParameter(js_context, JSGCParamKey::JSGC_MAX_BYTES, u32::MAX);

        JS_SetNativeStackQuota(
            js_context,
            STACK_QUOTA,
            STACK_QUOTA - SYSTEM_CODE_BUFFER,
            STACK_QUOTA - SYSTEM_CODE_BUFFER - TRUSTED_SCRIPT_BUFFER,
        );

        CONTEXT.with(|context| {
            assert!(context.get().is_null());
            context.set(js_context);
        });

        InitSelfHostedCode(js_context, [0u64; 2], None);

        SetWarningReporter(js_context, Some(report_warning));

        Runtime {
            engine,
            _parent_child_count: parent.map(|p| p.children_of_parent),
            cx: js_context,
            outstanding_children: Arc::new(()),
        }
    }

    /// Returns the `JSRuntime` object.
    pub fn rt(&self) -> *mut JSRuntime {
        unsafe { JS_GetRuntime(self.cx) }
    }

    /// Returns the `JSContext` object.
    pub fn cx(&self) -> *mut JSContext {
        self.cx
    }

    pub fn evaluate_script(
        &self,
        glob: HandleObject,
        script: &str,
        filename: &str,
        line_num: u32,
        rval: MutableHandleValue,
    ) -> Result<(), ()> {
        debug!(
            "Evaluating script from {} with content {}",
            filename, script
        );

        let _ac = JSAutoRealm::new(self.cx(), glob.get());
        let options = unsafe { CompileOptionsWrapper::new(self.cx(), filename, line_num) };

        unsafe {
            let mut source = transform_str_to_source_text(&script);
            if !Evaluate2(self.cx(), options.ptr, &mut source, rval.into()) {
                debug!("...err!");
                maybe_resume_unwind();
                Err(())
            } else {
                // we could return the script result but then we'd have
                // to root it and so forth and, really, who cares?
                debug!("...ok!");
                Ok(())
            }
        }
    }
}

impl Drop for Runtime {
    fn drop(&mut self) {
        assert_eq!(
            Arc::strong_count(&self.outstanding_children),
            1,
            "This runtime still has live children."
        );
        unsafe {
            JS_DestroyContext(self.cx);

            CONTEXT.with(|context| {
                assert_eq!(context.get(), self.cx);
                context.set(ptr::null_mut());
            });
        }
    }
}

// Creates a C string literal `$str`.
macro_rules! c_str {
    ($str:expr) => {
        concat!($str, "\0").as_ptr() as *const ::std::os::raw::c_char
    };
}

/// Types that can be traced.
///
/// This trait is unsafe; if it is implemented incorrectly, the GC may end up collecting objects
/// that are still reachable.
pub unsafe trait Trace {
    unsafe fn trace(&self, trc: *mut JSTracer);
}

unsafe impl Trace for Heap<*mut JSFunction> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallFunctionTracer(trc, self as *const _ as *mut Self, c_str!("function"));
    }
}

unsafe impl Trace for Heap<*mut JSObject> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallObjectTracer(trc, self as *const _ as *mut Self, c_str!("object"));
    }
}

unsafe impl Trace for Heap<*mut JSScript> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallScriptTracer(trc, self as *const _ as *mut Self, c_str!("script"));
    }
}

unsafe impl Trace for Heap<*mut JSString> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallStringTracer(trc, self as *const _ as *mut Self, c_str!("string"));
    }
}

unsafe impl Trace for Heap<Value> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallValueTracer(trc, self as *const _ as *mut Self, c_str!("value"));
    }
}

unsafe impl Trace for Heap<jsid> {
    unsafe fn trace(&self, trc: *mut JSTracer) {
        CallIdTracer(trc, self as *const _ as *mut Self, c_str!("id"));
    }
}

/// Rust API for keeping a Rooted value in the context's root stack.
/// Example usage: `rooted!(in(cx) let x = UndefinedValue());`.
/// `RootedGuard::new` also works, but the macro is preferred.
pub struct RootedGuard<'a, T: 'a + RootKind + GCMethods> {
    root: &'a mut Rooted<T>,
}

impl<'a, T: 'a + RootKind + GCMethods> RootedGuard<'a, T> {
    pub fn new(cx: *mut JSContext, root: &'a mut Rooted<T>, initial: T) -> Self {
        root.ptr = initial;
        unsafe {
            root.add_to_root_stack(cx);
        }
        RootedGuard { root: root }
    }

    pub fn handle(&'a self) -> Handle<'a, T> {
        Handle::new(&self.root.ptr)
    }

    pub fn handle_mut(&mut self) -> MutableHandle<T> {
        unsafe { MutableHandle::from_marked_location(&mut self.root.ptr) }
    }

    pub fn get(&self) -> T
    where
        T: Copy,
    {
        self.root.ptr
    }

    pub fn set(&mut self, v: T) {
        self.root.ptr = v;
    }
}

impl<'a, T: 'a + RootKind + GCMethods> Deref for RootedGuard<'a, T> {
    type Target = T;
    fn deref(&self) -> &T {
        &self.root.ptr
    }
}

impl<'a, T: 'a + RootKind + GCMethods> DerefMut for RootedGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut T {
        &mut self.root.ptr
    }
}

impl<'a, T: 'a + RootKind + GCMethods> Drop for RootedGuard<'a, T> {
    fn drop(&mut self) {
        unsafe {
            self.root.ptr = T::initial();
            self.root.remove_from_root_stack();
        }
    }
}

#[macro_export]
macro_rules! rooted {
    (in($cx:expr) let $name:ident = $init:expr) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let $name = $crate::rust::RootedGuard::new($cx, &mut __root, $init);
    };
    (in($cx:expr) let mut $name:ident = $init:expr) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let mut $name = $crate::rust::RootedGuard::new($cx, &mut __root, $init);
    };
    (in($cx:expr) let $name:ident: $type:ty) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let $name = $crate::rust::RootedGuard::new(
            $cx,
            &mut __root,
            <$type as $crate::rust::GCMethods>::initial(),
        );
    };
    (in($cx:expr) let mut $name:ident: $type:ty) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let mut $name = $crate::rust::RootedGuard::new(
            $cx,
            &mut __root,
            <$type as $crate::rust::GCMethods>::initial(),
        );
    };
}

/// Similarly to `Trace` trait, it's used to specify tracing of various types
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

    pub fn root<'a>(&'a mut self, cx: *mut JSContext) -> CustomAutoRooterGuard<'a, T> {
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

#[macro_export]
macro_rules! auto_root {
    (in($cx:expr) let $name:ident = $init:expr) => {
        let mut __root = $crate::rust::CustomAutoRooter::new($init);
        let $name = __root.root($cx);
    };
    (in($cx:expr) let mut $name:ident = $init:expr) => {
        let mut __root = $crate::rust::CustomAutoRooter::new($init);
        let mut $name = __root.root($cx);
    };
}

#[derive(Clone, Copy)]
pub struct Handle<'a, T: 'a> {
    ptr: &'a T,
}

#[derive(Copy, Clone)]
pub struct MutableHandle<'a, T: 'a> {
    ptr: *mut T,
    anchor: PhantomData<&'a mut T>,
}

pub type HandleFunction<'a> = Handle<'a, *mut JSFunction>;
pub type HandleId<'a> = Handle<'a, jsid>;
pub type HandleObject<'a> = Handle<'a, *mut JSObject>;
pub type HandleScript<'a> = Handle<'a, *mut JSScript>;
pub type HandleString<'a> = Handle<'a, *mut JSString>;
pub type HandleSymbol<'a> = Handle<'a, *mut Symbol>;
pub type HandleValue<'a> = Handle<'a, Value>;
pub type MutableHandleFunction<'a> = MutableHandle<'a, *mut JSFunction>;
pub type MutableHandleId<'a> = MutableHandle<'a, jsid>;
pub type MutableHandleObject<'a> = MutableHandle<'a, *mut JSObject>;
pub type MutableHandleScript<'a> = MutableHandle<'a, *mut JSScript>;
pub type MutableHandleString<'a> = MutableHandle<'a, *mut JSString>;
pub type MutableHandleSymbol<'a> = MutableHandle<'a, *mut Symbol>;
pub type MutableHandleValue<'a> = MutableHandle<'a, Value>;

impl<'a, T> Handle<'a, T> {
    pub fn get(&self) -> T
    where
        T: Copy,
    {
        *self.ptr
    }

    fn new(ptr: &'a T) -> Self {
        Handle { ptr: ptr }
    }

    pub unsafe fn from_marked_location(ptr: *const T) -> Self {
        Handle::new(&*ptr)
    }

    pub unsafe fn from_raw(handle: RawHandle<T>) -> Self {
        Handle::from_marked_location(handle.ptr)
    }
}

impl<'a, T> IntoRawHandle for Handle<'a, T> {
    type Target = T;
    fn into_handle(self) -> RawHandle<T> {
        unsafe { RawHandle::from_marked_location(self.ptr) }
    }
}

impl<'a, T> IntoRawHandle for MutableHandle<'a, T> {
    type Target = T;
    fn into_handle(self) -> RawHandle<T> {
        unsafe { RawHandle::from_marked_location(self.ptr) }
    }
}

impl<'a, T> IntoRawMutableHandle for MutableHandle<'a, T> {
    fn into_handle_mut(self) -> RawMutableHandle<T> {
        unsafe { RawMutableHandle::from_marked_location(self.ptr) }
    }
}

impl<'a, T> Deref for Handle<'a, T> {
    type Target = T;

    fn deref(&self) -> &T {
        self.ptr
    }
}

impl<'a, T> MutableHandle<'a, T> {
    pub unsafe fn from_marked_location(ptr: *mut T) -> Self {
        MutableHandle::new(&mut *ptr)
    }

    pub unsafe fn from_raw(handle: RawMutableHandle<T>) -> Self {
        MutableHandle::from_marked_location(handle.ptr)
    }

    pub fn handle(&self) -> Handle<T> {
        unsafe { Handle::new(&*self.ptr) }
    }

    pub fn new(ptr: &'a mut T) -> Self {
        Self {
            ptr: ptr,
            anchor: PhantomData,
        }
    }

    pub fn get(&self) -> T
    where
        T: Copy,
    {
        unsafe { *self.ptr }
    }

    pub fn set(&mut self, v: T)
    where
        T: Copy,
    {
        unsafe { *self.ptr = v }
    }

    fn raw(&mut self) -> RawMutableHandle<T> {
        unsafe { RawMutableHandle::from_marked_location(self.ptr) }
    }
}

impl<'a, T> Deref for MutableHandle<'a, T> {
    type Target = T;

    fn deref(&self) -> &T {
        unsafe { &*self.ptr }
    }
}

impl<'a, T> DerefMut for MutableHandle<'a, T> {
    fn deref_mut(&mut self) -> &mut T {
        unsafe { &mut *self.ptr }
    }
}

impl HandleValue<'static> {
    pub fn null() -> Self {
        unsafe { Self::from_raw(RawHandleValue::null()) }
    }

    pub fn undefined() -> Self {
        unsafe { Self::from_raw(RawHandleValue::undefined()) }
    }
}

const ConstNullValue: *mut JSObject = 0 as *mut JSObject;

impl<'a> HandleObject<'a> {
    pub fn null() -> Self {
        unsafe { HandleObject::from_marked_location(&ConstNullValue) }
    }
}

const ChunkShift: usize = 20;
const ChunkSize: usize = 1 << ChunkShift;

#[cfg(target_pointer_width = "32")]
const ChunkLocationOffset: usize = ChunkSize - 2 * 4 - 8;

// ___________________________________________________________________________
// Wrappers around things in jsglue.cpp

pub struct RootedObjectVectorWrapper {
    pub ptr: *mut PersistentRootedObjectVector,
}

impl RootedObjectVectorWrapper {
    pub fn new(cx: *mut JSContext) -> RootedObjectVectorWrapper {
        RootedObjectVectorWrapper {
            ptr: unsafe { CreateRootedObjectVector(cx) },
        }
    }

    pub fn append(&self, obj: *mut JSObject) -> bool {
        unsafe { AppendToRootedObjectVector(self.ptr, obj) }
    }

    pub fn handle(&self) -> RawHandleObjectVector {
        RawHandleObjectVector {
            ptr: unsafe { GetObjectVectorAddress(self.ptr) },
        }
    }
}

impl Drop for RootedObjectVectorWrapper {
    fn drop(&mut self) {
        unsafe { DeleteRootedObjectVector(self.ptr) }
    }
}

pub struct CompileOptionsWrapper {
    pub ptr: *mut ReadOnlyCompileOptions,
}

impl CompileOptionsWrapper {
    pub unsafe fn new(cx: *mut JSContext, filename: &str, line: u32) -> Self {
        let filename_cstr = ffi::CString::new(filename.as_bytes()).unwrap();
        let ptr = NewCompileOptions(cx, filename_cstr.as_ptr(), line);
        assert!(!ptr.is_null());
        Self { ptr }
    }
}

impl Drop for CompileOptionsWrapper {
    fn drop(&mut self) {
        unsafe { DeleteCompileOptions(self.ptr) }
    }
}

pub struct Stencil {
    inner: already_AddRefed<CompilationStencil>,
}

/*unsafe impl Send for Stencil {}
unsafe impl Sync for Stencil {}*/

impl Drop for Stencil {
    fn drop(&mut self) {
        unsafe {
            StencilRelease(self.inner.mRawPtr);
        }
    }
}

impl Deref for Stencil {
    type Target = *mut CompilationStencil;

    fn deref(&self) -> &Self::Target {
        &self.inner.mRawPtr
    }
}

impl Stencil {
    pub fn is_null(&self) -> bool {
        self.inner.mRawPtr.is_null()
    }
}

pub unsafe fn FinishOffThreadStencil(
    cx: *mut JSContext,
    token: *mut OffThreadToken,
    storage: *mut InstantiationStorage,
) -> Stencil {
    let mut stencil = already_AddRefed {
        mRawPtr: std::ptr::null_mut(),
        _phantom_0: PhantomData,
    };
    crate::glue::FinishOffThreadStencil(cx, token, storage, &mut stencil);
    return Stencil { inner: stencil };
}

// ___________________________________________________________________________
// Fast inline converters

#[inline]
pub unsafe fn ToBoolean(v: HandleValue) -> bool {
    let val = *v.ptr;

    if val.is_boolean() {
        return val.to_boolean();
    }

    if val.is_int32() {
        return val.to_int32() != 0;
    }

    if val.is_null_or_undefined() {
        return false;
    }

    if val.is_double() {
        let d = val.to_double();
        return !d.is_nan() && d != 0f64;
    }

    if val.is_symbol() {
        return true;
    }

    ToBooleanSlow(v.into())
}

#[inline]
pub unsafe fn ToNumber(cx: *mut JSContext, v: HandleValue) -> Result<f64, ()> {
    let val = *v.ptr;
    if val.is_number() {
        return Ok(val.to_number());
    }

    let mut out = Default::default();
    if ToNumberSlow(cx, v.into_handle(), &mut out) {
        Ok(out)
    } else {
        Err(())
    }
}

#[inline]
unsafe fn convert_from_int32<T: Default + Copy>(
    cx: *mut JSContext,
    v: HandleValue,
    conv_fn: unsafe extern "C" fn(*mut JSContext, RawHandleValue, *mut T) -> bool,
) -> Result<T, ()> {
    let val = *v.ptr;
    if val.is_int32() {
        let intval: i64 = val.to_int32() as i64;
        // TODO: do something better here that works on big endian
        let intval = *(&intval as *const i64 as *const T);
        return Ok(intval);
    }

    let mut out = Default::default();
    if conv_fn(cx, v.into(), &mut out) {
        Ok(out)
    } else {
        Err(())
    }
}

#[inline]
pub unsafe fn ToInt32(cx: *mut JSContext, v: HandleValue) -> Result<i32, ()> {
    convert_from_int32::<i32>(cx, v, ToInt32Slow)
}

#[inline]
pub unsafe fn ToUint32(cx: *mut JSContext, v: HandleValue) -> Result<u32, ()> {
    convert_from_int32::<u32>(cx, v, ToUint32Slow)
}

#[inline]
pub unsafe fn ToUint16(cx: *mut JSContext, v: HandleValue) -> Result<u16, ()> {
    convert_from_int32::<u16>(cx, v, ToUint16Slow)
}

#[inline]
pub unsafe fn ToInt64(cx: *mut JSContext, v: HandleValue) -> Result<i64, ()> {
    convert_from_int32::<i64>(cx, v, ToInt64Slow)
}

#[inline]
pub unsafe fn ToUint64(cx: *mut JSContext, v: HandleValue) -> Result<u64, ()> {
    convert_from_int32::<u64>(cx, v, ToUint64Slow)
}

#[inline]
pub unsafe fn ToString(cx: *mut JSContext, v: HandleValue) -> *mut JSString {
    let val = *v.ptr;
    if val.is_string() {
        return val.to_string();
    }

    ToStringSlow(cx, v.into())
}

pub unsafe fn ToWindowProxyIfWindow(obj: *mut JSObject) -> *mut JSObject {
    if is_window(obj) {
        ToWindowProxyIfWindowSlow(obj)
    } else {
        obj
    }
}

pub unsafe extern "C" fn report_warning(_cx: *mut JSContext, report: *mut JSErrorReport) {
    fn latin1_to_string(bytes: &[u8]) -> String {
        bytes
            .iter()
            .map(|c| char::from_u32(*c as u32).unwrap())
            .collect()
    }

    let fnptr = (*report)._base.filename;
    let fname = if !fnptr.is_null() {
        let c_str = ffi::CStr::from_ptr(fnptr);
        latin1_to_string(c_str.to_bytes())
    } else {
        "none".to_string()
    };

    let lineno = (*report)._base.lineno;
    let column = (*report)._base.column;

    let msg_ptr = (*report)._base.message_.data_ as *const u8;
    let msg_len = (0usize..)
        .find(|&i| *msg_ptr.offset(i as isize) == 0)
        .unwrap();
    let msg_slice = slice::from_raw_parts(msg_ptr, msg_len);
    let msg = str::from_utf8_unchecked(msg_slice);

    warn!("Warning at {}:{}:{}: {}\n", fname, lineno, column, msg);
}

pub struct IdVector(*mut PersistentRootedIdVector);

impl IdVector {
    pub unsafe fn new(cx: *mut JSContext) -> IdVector {
        let vector = CreateRootedIdVector(cx);
        assert!(!vector.is_null());
        IdVector(vector)
    }

    pub fn handle_mut(&mut self) -> RawMutableHandleIdVector {
        RawMutableHandleIdVector {
            ptr: unsafe { GetIdVectorAddress(self.0) },
        }
    }
}

impl Drop for IdVector {
    fn drop(&mut self) {
        unsafe { DestroyRootedIdVector(self.0) }
    }
}

impl Deref for IdVector {
    type Target = [jsid];

    fn deref(&self) -> &[jsid] {
        unsafe {
            let mut length = 0;
            let pointer = SliceRootedIdVector(self.0, &mut length);
            slice::from_raw_parts(pointer, length)
        }
    }
}

/// Defines methods on `obj`. The last entry of `methods` must contain zeroed
/// memory.
///
/// # Failures
///
/// Returns `Err` on JSAPI failure.
///
/// # Panics
///
/// Panics if the last entry of `methods` does not contain zeroed memory.
///
/// # Safety
///
/// - `cx` must be valid.
/// - This function calls into unaudited C++ code.
pub unsafe fn define_methods(
    cx: *mut JSContext,
    obj: HandleObject,
    methods: &'static [JSFunctionSpec],
) -> Result<(), ()> {
    assert!({
        match methods.last() {
            Some(&JSFunctionSpec {
                name,
                call,
                nargs,
                flags,
                selfHostedName,
            }) => {
                name.string_.is_null()
                    && call.is_zeroed()
                    && nargs == 0
                    && flags == 0
                    && selfHostedName.is_null()
            }
            None => false,
        }
    });

    JS_DefineFunctions(cx, obj.into(), methods.as_ptr()).to_result()
}

/// Defines attributes on `obj`. The last entry of `properties` must contain
/// zeroed memory.
///
/// # Failures
///
/// Returns `Err` on JSAPI failure.
///
/// # Panics
///
/// Panics if the last entry of `properties` does not contain zeroed memory.
///
/// # Safety
///
/// - `cx` must be valid.
/// - This function calls into unaudited C++ code.
pub unsafe fn define_properties(
    cx: *mut JSContext,
    obj: HandleObject,
    properties: &'static [JSPropertySpec],
) -> Result<(), ()> {
    assert!({
        match properties.last() {
            Some(spec) => spec.is_zeroed(),
            None => false,
        }
    });

    JS_DefineProperties(cx, obj.into(), properties.as_ptr()).to_result()
}

static SIMPLE_GLOBAL_CLASS_OPS: JSClassOps = JSClassOps {
    addProperty: None,
    delProperty: None,
    enumerate: Some(JS_EnumerateStandardClasses),
    newEnumerate: None,
    resolve: Some(JS_ResolveStandardClass),
    mayResolve: Some(JS_MayResolveStandardClass),
    finalize: None,
    call: None,
    construct: None,
    trace: Some(JS_GlobalObjectTraceHook),
};

/// This is a simple `JSClass` for global objects, primarily intended for tests.
pub static SIMPLE_GLOBAL_CLASS: JSClass = JSClass {
    name: b"Global\0" as *const u8 as *const _,
    flags: JSCLASS_IS_GLOBAL
        | ((JSCLASS_GLOBAL_SLOT_COUNT & JSCLASS_RESERVED_SLOTS_MASK)
            << JSCLASS_RESERVED_SLOTS_SHIFT),
    cOps: &SIMPLE_GLOBAL_CLASS_OPS as *const JSClassOps,
    spec: ptr::null(),
    ext: ptr::null(),
    oOps: ptr::null(),
};

#[inline]
unsafe fn get_object_group(obj: *mut JSObject) -> *mut BaseShape {
    assert!(!obj.is_null());
    let obj = obj as *mut Object;
    (*(*obj).shape).base
}

#[inline]
pub unsafe fn get_object_class(obj: *mut JSObject) -> *const JSClass {
    (*get_object_group(obj)).clasp as *const _
}

#[inline]
pub unsafe fn get_object_realm(obj: *mut JSObject) -> *mut Realm {
    (*get_object_group(obj)).realm
}

#[inline]
pub unsafe fn get_context_realm(cx: *mut JSContext) -> *mut Realm {
    let cx = cx as *mut RootingContext;
    (*cx).realm_
}

#[inline]
pub fn is_dom_class(class: &JSClass) -> bool {
    class.flags & JSCLASS_IS_DOMJSCLASS != 0
}

#[inline]
pub unsafe fn is_dom_object(obj: *mut JSObject) -> bool {
    is_dom_class(&*get_object_class(obj))
}

#[inline]
pub unsafe fn is_window(obj: *mut JSObject) -> bool {
    (*get_object_class(obj)).flags & JSCLASS_IS_GLOBAL != 0 && IsWindowSlow(obj)
}

#[inline]
pub unsafe fn try_to_outerize(mut rval: MutableHandleValue) {
    let obj = rval.to_object();
    if is_window(obj) {
        let obj = ToWindowProxyIfWindowSlow(obj);
        assert!(!obj.is_null());
        rval.set(ObjectValue(&mut *obj));
    }
}

#[inline]
pub unsafe fn maybe_wrap_object_value(cx: *mut JSContext, rval: MutableHandleValue) {
    assert!(rval.is_object());
    let obj = rval.to_object();
    if get_object_realm(obj) != get_context_realm(cx) {
        assert!(JS_WrapValue(cx, rval.into()));
    } else if is_dom_object(obj) {
        try_to_outerize(rval);
    }
}

#[inline]
pub unsafe fn maybe_wrap_object_or_null_value(cx: *mut JSContext, rval: MutableHandleValue) {
    assert!(rval.is_object_or_null());
    if !rval.is_null() {
        maybe_wrap_object_value(cx, rval);
    }
}

#[inline]
pub unsafe fn maybe_wrap_value(cx: *mut JSContext, rval: MutableHandleValue) {
    if rval.is_string() {
        assert!(JS_WrapValue(cx, rval.into()));
    } else if rval.is_object() {
        maybe_wrap_object_value(cx, rval);
    }
}

/// Like `JSJitInfo::new_bitfield_1`, but usable in `const` contexts.
#[macro_export]
macro_rules! new_jsjitinfo_bitfield_1 {
    (
        $type_: expr,
        $aliasSet_: expr,
        $returnType_: expr,
        $isInfallible: expr,
        $isMovable: expr,
        $isEliminatable: expr,
        $isAlwaysInSlot: expr,
        $isLazilyCachedInSlot: expr,
        $isTypedMethod: expr,
        $slotIndex: expr,
    ) => {
        0 | (($type_ as u32) << 0u32)
            | (($aliasSet_ as u32) << 4u32)
            | (($returnType_ as u32) << 8u32)
            | (($isInfallible as u32) << 16u32)
            | (($isMovable as u32) << 17u32)
            | (($isEliminatable as u32) << 18u32)
            | (($isAlwaysInSlot as u32) << 19u32)
            | (($isLazilyCachedInSlot as u32) << 20u32)
            | (($isTypedMethod as u32) << 21u32)
            | (($slotIndex as u32) << 22u32)
    };
}

#[derive(Debug, Default)]
pub struct ScriptedCaller {
    pub filename: String,
    pub line: u32,
    pub col: u32,
}

pub unsafe fn describe_scripted_caller(cx: *mut JSContext) -> Result<ScriptedCaller, ()> {
    let mut buf = [0; 1024];
    let mut line = 0;
    let mut col = 0;
    if !DescribeScriptedCaller(cx, buf.as_mut_ptr(), buf.len(), &mut line, &mut col) {
        return Err(());
    }
    let filename = CStr::from_ptr((&buf) as *const _ as *const _);
    Ok(ScriptedCaller {
        filename: String::from_utf8_lossy(filename.to_bytes()).into_owned(),
        line,
        col,
    })
}

pub struct CapturedJSStack<'a> {
    cx: *mut JSContext,
    stack: RootedGuard<'a, *mut JSObject>,
}

impl<'a> CapturedJSStack<'a> {
    pub unsafe fn new(
        cx: *mut JSContext,
        mut guard: RootedGuard<'a, *mut JSObject>,
        max_frame_count: Option<u32>,
    ) -> Option<Self> {
        let ref mut stack_capture = MaybeUninit::uninit();
        match max_frame_count {
            None => JS_StackCapture_AllFrames(stack_capture.as_mut_ptr()),
            Some(count) => JS_StackCapture_MaxFrames(count, stack_capture.as_mut_ptr()),
        };
        let ref mut stack_capture = stack_capture.assume_init();

        if !CaptureCurrentStack(cx, guard.handle_mut().raw(), stack_capture) {
            None
        } else {
            Some(CapturedJSStack {
                cx: cx,
                stack: guard,
            })
        }
    }

    pub fn as_string(&self, indent: Option<usize>, format: StackFormat) -> Option<String> {
        unsafe {
            let stack_handle = self.stack.handle();
            rooted!(in(self.cx) let mut js_string = ptr::null_mut::<JSString>());
            let mut string_handle = js_string.handle_mut();

            if !BuildStackString(
                self.cx,
                ptr::null_mut(),
                stack_handle.into(),
                string_handle.raw(),
                indent.unwrap_or(0),
                format,
            ) {
                return None;
            }

            Some(jsstr_to_string(self.cx, string_handle.get()))
        }
    }
}

#[macro_export]
macro_rules! capture_stack {
    (in($cx:expr) let $name:ident = with max depth($max_frame_count:expr)) => {
        rooted!(in($cx) let mut __obj = ::std::ptr::null_mut());
        let $name = $crate::rust::CapturedJSStack::new($cx, __obj, Some($max_frame_count));
    };
    (in($cx:expr) let $name:ident ) => {
        rooted!(in($cx) let mut __obj = ::std::ptr::null_mut());
        let $name = $crate::rust::CapturedJSStack::new($cx, __obj, None);
    }
}

/** Wrappers for JSAPI methods that should NOT be used.
 *
 * The wrapped methods are identical except that they accept Handle and MutableHandle arguments
 * that include lifetimes instead.
 *
 * They require MutableHandles to implement Copy. All code should migrate to jsapi_wrapped instead.
 * */
pub mod wrappers {
    macro_rules! wrap {
        // The invocation of @inner has the following form:
        // @inner (input args) <> (accumulator) <> unparsed tokens
        // when `unparsed tokens == \eps`, accumulator contains the final result

        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: Handle<$gentype:ty>, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandle<$gentype:ty>, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: Handle, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandle, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleFunction , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleId , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleObject , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleScript , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleString , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleSymbol , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: HandleValue , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleFunction , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleId , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleObject , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleScript , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleString , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleSymbol , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: MutableHandleValue , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($acc:expr,)*) <> $arg:ident: $type:ty, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($acc,)* $arg,) <> $($rest)*);
        };
        (@inner ($module:tt: $func_name:ident ($($args:tt)*) -> $outtype:ty) <> ($($argexprs:expr,)*) <> ) => {
            #[inline]
            pub unsafe fn $func_name($($args)*) -> $outtype {
                $module::$func_name($($argexprs),*)
            }
        };
        ($module:tt: pub fn $func_name:ident($($args:tt)*) -> $outtype:ty) => {
            wrap!(@inner ($module: $func_name ($($args)*) -> $outtype) <> () <> $($args)* ,);
        };
        ($module:tt: pub fn $func_name:ident($($args:tt)*)) => {
            wrap!($module: pub fn $func_name($($args)*) -> ());
        }
    }

    use super::*;
    use glue;
    use jsapi;
    use jsapi::jsid;
    use jsapi::mozilla::Utf8Unit;
    use jsapi::CallArgs;
    use jsapi::CloneDataPolicy;
    use jsapi::CompartmentTransplantCallback;
    //use jsapi::DynamicImportStatus;
    use jsapi::ESClass;
    use jsapi::ExceptionStackBehavior;
    use jsapi::ForOfIterator;
    use jsapi::ForOfIterator_NonIterableBehavior;
    use jsapi::HandleIdVector;
    use jsapi::HandleObjectVector;
    use jsapi::InstantiateOptions;
    use jsapi::JSClass;
    use jsapi::JSErrorReport;
    use jsapi::JSExnType;
    use jsapi::JSFunctionSpec;
    use jsapi::JSFunctionSpecWithHelp;
    use jsapi::JSJitInfo;
    use jsapi::JSONWriteCallback;
    use jsapi::JSPrincipals;
    use jsapi::JSPropertySpec;
    use jsapi::JSPropertySpec_Name;
    use jsapi::JSProtoKey;
    use jsapi::JSScript;
    use jsapi::JSStructuredCloneData;
    use jsapi::JSType;
    use jsapi::ModuleErrorBehaviour;
    use jsapi::MutableHandleIdVector;
    use jsapi::PromiseState;
    use jsapi::PromiseUserInputEventHandlingState;
    use jsapi::ReadOnlyCompileOptions;
    use jsapi::ReadableStreamMode;
    use jsapi::ReadableStreamReaderMode;
    use jsapi::ReadableStreamUnderlyingSource;
    use jsapi::Realm;
    use jsapi::RefPtr;
    use jsapi::ScriptEnvironmentPreparer_Closure;
    use jsapi::SourceText;
    use jsapi::StackCapture;
    use jsapi::StructuredCloneScope;
    use jsapi::Symbol;
    use jsapi::SymbolCode;
    use jsapi::TranscodeBuffer;
    use jsapi::TwoByteChars;
    use jsapi::UniqueChars;
    use jsapi::Value;
    use jsapi::WasmModule;
    use jsapi::{ElementAdder, IsArrayAnswer, PropertyDescriptor};
    use jsapi::{JSContext, JSFunction, JSNative, JSObject, JSString};
    use jsapi::{JSStructuredCloneCallbacks, JSStructuredCloneReader, JSStructuredCloneWriter};
    use jsapi::{MallocSizeOf, ObjectOpResult, ObjectPrivateVisitor, TabSizes};
    use jsapi::{SavedFrameResult, SavedFrameSelfHosted};
    use std::os::raw::c_char;
    include!("jsapi_wrappers.in");
    include!("glue_wrappers.in");
}

/** Wrappers for JSAPI methods that accept lifetimed Handle and MutableHandle arguments.
 *
 * The wrapped methods are identical except that they accept Handle and MutableHandle arguments
 * that include lifetimes instead. Besides, they mutably borrow the mutable handles
 * instead of consuming/copying them.
 *
 * These wrappers are preferred, js::rust::wrappers should NOT be used.
 * */
pub mod jsapi_wrapped {
    macro_rules! wrap {
        // The invocation of @inner has the following form:
        // @inner (input args) <> (argument accumulator) <> (invocation accumulator) <> unparsed tokens
        // when `unparsed tokens == \eps`, accumulator contains the final result

        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: Handle<$gentype:ty>, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: Handle<$gentype> , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandle<$gentype:ty>, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandle<$gentype> , )  <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: Handle, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: Handle , )  <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandle, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandle , )  <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleFunction , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleFunction , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleId , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleId , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleObject , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleObject , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleScript , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleScript , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleString , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleString , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleSymbol , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleSymbol , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: HandleValue , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: HandleValue , ) <> ($($acc,)* $arg.into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleFunction , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleFunction , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleId , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleId , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleObject , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleObject , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleScript , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleScript , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleString , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleString , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleSymbol , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleSymbol , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <> ($($acc:expr,)*) <> $arg:ident: MutableHandleValue , $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: &mut MutableHandleValue , ) <> ($($acc,)* (*$arg).into(),) <> $($rest)*);
        };
        (@inner $saved:tt <> ($($declargs:tt)*) <>  ($($acc:expr,)*) <> $arg:ident: $type:ty, $($rest:tt)*) => {
            wrap!(@inner $saved <> ($($declargs)* $arg: $type,) <> ($($acc,)* $arg,) <> $($rest)*);
        };
        (@inner ($module:tt: $func_name:ident ($($args:tt)*) -> $outtype:ty) <> ($($declargs:tt)*) <> ($($argexprs:expr,)*) <> ) => {
            #[inline]
            pub unsafe fn $func_name($($declargs)*) -> $outtype {
                $module::$func_name($($argexprs),*)
            }
        };
        ($module:tt: pub fn $func_name:ident($($args:tt)*) -> $outtype:ty) => {
            wrap!(@inner ($module: $func_name ($($args)*) -> $outtype) <> () <> () <> $($args)* ,);
        };
        ($module:tt: pub fn $func_name:ident($($args:tt)*)) => {
            wrap!($module: pub fn $func_name($($args)*) -> ());
        }
    }

    use super::*;
    use glue;
    use jsapi;
    use jsapi::mozilla::Utf8Unit;
    use jsapi::CallArgs;
    use jsapi::CloneDataPolicy;
    use jsapi::CompartmentTransplantCallback;
    //use jsapi::DynamicImportStatus;
    use jsapi::ESClass;
    use jsapi::ExceptionStackBehavior;
    use jsapi::ForOfIterator;
    use jsapi::ForOfIterator_NonIterableBehavior;
    use jsapi::HandleIdVector;
    use jsapi::HandleObjectVector;
    use jsapi::InstantiateOptions;
    use jsapi::JSClass;
    use jsapi::JSErrorReport;
    use jsapi::JSExnType;
    use jsapi::JSFunctionSpec;
    use jsapi::JSFunctionSpecWithHelp;
    use jsapi::JSJitInfo;
    use jsapi::JSONWriteCallback;
    use jsapi::JSPrincipals;
    use jsapi::JSPropertySpec;
    use jsapi::JSPropertySpec_Name;
    use jsapi::JSProtoKey;
    use jsapi::JSScript;
    use jsapi::JSStructuredCloneData;
    use jsapi::JSType;
    use jsapi::ModuleErrorBehaviour;
    use jsapi::MutableHandleIdVector;
    use jsapi::PromiseState;
    use jsapi::PromiseUserInputEventHandlingState;
    use jsapi::ReadOnlyCompileOptions;
    use jsapi::ReadableStreamMode;
    use jsapi::ReadableStreamReaderMode;
    use jsapi::ReadableStreamUnderlyingSource;
    use jsapi::Realm;
    use jsapi::RefPtr;
    use jsapi::ScriptEnvironmentPreparer_Closure;
    use jsapi::SourceText;
    use jsapi::StackCapture;
    use jsapi::StructuredCloneScope;
    use jsapi::Symbol;
    use jsapi::SymbolCode;
    use jsapi::TranscodeBuffer;
    use jsapi::TwoByteChars;
    use jsapi::UniqueChars;
    use jsapi::Value;
    use jsapi::WasmModule;
    use jsapi::{ElementAdder, IsArrayAnswer, PropertyDescriptor};
    use jsapi::{JSContext, JSFunction, JSNative, JSObject, JSString};
    use jsapi::{JSStructuredCloneCallbacks, JSStructuredCloneReader, JSStructuredCloneWriter};
    use jsapi::{MallocSizeOf, ObjectOpResult, ObjectPrivateVisitor, TabSizes};
    use jsapi::{SavedFrameResult, SavedFrameSelfHosted};
    use std::os::raw::c_char;
    include!("jsapi_wrappers.in");
    include!("glue_wrappers.in");
}
