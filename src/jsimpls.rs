/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use jsapi::JS;
use jsapi::JSAutoRealm;
use jsapi::JSContext;
use jsapi::JSErrNum;
use jsapi::JSFunctionSpec;
use jsapi::JSJitGetterCallArgs;
use jsapi::JSJitMethodCallArgs;
use jsapi::JSJitSetterCallArgs;
use jsapi::JSNativeWrapper;
use jsapi::JSObject;
use jsapi::JSPropertySpec;
use jsapi::glue::JS_ForOfIteratorInit;
use jsapi::glue::JS_ForOfIteratorNext;
use jsapi::jsid;
use jsgc::RootKind;
use jsid::JSID_VOID;
use jsval::UndefinedValue;

#[cfg(feature = "debugmozjs")]
use jsapi::mozilla::detail::GuardObjectNotificationReceiver;

use std::ops::Deref;
use std::ops::DerefMut;
use std::os::raw::c_void;
use std::ptr;

impl<T> Deref for JS::Handle<T> {
    type Target = T;

    fn deref<'a>(&'a self) -> &'a T {
        unsafe { &*self.ptr }
    }
}

impl<T> Deref for JS::MutableHandle<T> {
    type Target = T;

    fn deref<'a>(&'a self) -> &'a T {
        unsafe { &*self.ptr }
    }
}

impl<T> DerefMut for JS::MutableHandle<T> {
    fn deref_mut<'a>(&'a mut self) -> &'a mut T {
        unsafe { &mut *self.ptr }
    }
}

impl Default for jsid {
    fn default() -> Self { JSID_VOID }
}

impl Default for JS::PropertyDescriptor {
    fn default() -> Self {
        JS::PropertyDescriptor {
            obj: ptr::null_mut(),
            attrs: 0,
            getter: None,
            setter: None,
            value: UndefinedValue()
        }
    }
}

impl Drop for JSAutoRealm {
    fn drop(&mut self) {
        unsafe { JS::LeaveRealm(self.cx_, self.oldRealm_); }
    }
}


impl<T> JS::Handle<T> {
    pub fn get(&self) -> T
        where T: Copy
    {
        unsafe { *self.ptr }
    }

    pub unsafe fn from_marked_location(ptr: *const T) -> JS::Handle<T> {
        JS::Handle {
            ptr: ptr as *mut T,
            _phantom_0: ::std::marker::PhantomData,
        }
    }
}

impl<T> JS::MutableHandle<T> {
    pub unsafe fn from_marked_location(ptr: *mut T) -> JS::MutableHandle<T> {
        JS::MutableHandle {
            ptr: ptr,
            _phantom_0: ::std::marker::PhantomData,
        }
    }

    pub fn handle(&self) -> JS::Handle<T> {
        unsafe {
            JS::Handle::from_marked_location(self.ptr as *const _)
        }
    }

    pub fn get(&self) -> T
        where T: Copy
    {
        unsafe { *self.ptr }
    }

    pub fn set(&self, v: T)
        where T: Copy
    {
        unsafe { *self.ptr = v }
    }
}

impl JS::HandleValue {
    pub fn null() -> JS::HandleValue {
        unsafe {
            JS::NullHandleValue
        }
    }

    pub fn undefined() -> JS::HandleValue {
        unsafe {
            JS::UndefinedHandleValue
        }
    }
}

impl JS::HandleValueArray {
    pub fn new() -> JS::HandleValueArray {
        JS::HandleValueArray {
            length_: 0,
            elements_: ptr::null(),
        }
    }

    pub unsafe fn from_rooted_slice(values: &[JS::Value]) -> JS::HandleValueArray {
        JS::HandleValueArray {
            length_: values.len(),
            elements_: values.as_ptr()
        }
    }
}

const NULL_OBJECT: *mut JSObject = 0 as *mut JSObject;

impl JS::HandleObject {
    pub fn null() -> JS::HandleObject {
        unsafe {
            JS::HandleObject::from_marked_location(&NULL_OBJECT)
        }
    }
}

// ___________________________________________________________________________
// Implementations for various things in jsapi.rs

impl JSAutoRealm {
    pub fn new(cx: *mut JSContext, target: *mut JSObject) -> JSAutoRealm {
        JSAutoRealm {
            cx_: cx,
            oldRealm_: unsafe { JS::EnterRealm(cx, target) },
            #[cfg(feature = "debugmozjs")]
            _mCheckNotUsedAsTemporary: GuardObjectNotificationReceiver {
                mStatementDone: false,
            }
        }
    }
}

impl JS::AutoGCRooter {
    pub fn new_unrooted(tag: JS::AutoGCRooter_Tag) -> JS::AutoGCRooter {
        JS::AutoGCRooter {
            down: ptr::null_mut(),
            tag_: tag,
            stackTop: ptr::null_mut(),
        }
    }

    pub unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext) {
        #[allow(non_snake_case)]
        let autoGCRooters: &mut _ = {
            let rooting_cx = cx as *mut JS::RootingContext;
            &mut (*rooting_cx).autoGCRooters_
        };
        self.stackTop = autoGCRooters;
        self.down = *autoGCRooters;

        assert!(*self.stackTop != self);
        *autoGCRooters = self;
    }

    pub unsafe fn remove_from_root_stack(&mut self) {
        assert!(*self.stackTop == self);
        // This hoop-jumping is needed because bindgen gives stackTop
        // the type *const *mut AutoGCRooter, so we need to make it
        // mutable before setting it.
        // https://github.com/rust-lang-nursery/rust-bindgen/issues/511
        #[allow(non_snake_case)]
        let autoGCRooters = &*self.stackTop as *const _ as *mut _;
        *autoGCRooters = self.down;
    }
}

impl JSJitMethodCallArgs {
    #[inline]
    pub fn get(&self, i: u32) -> JS::HandleValue {
        unsafe {
            if i < self.argc_ {
                JS::HandleValue::from_marked_location(self.argv_.offset(i as isize))
            } else {
                JS::UndefinedHandleValue
            }
        }
    }

    #[inline]
    pub fn index(&self, i: u32) -> JS::HandleValue {
        assert!(i < self.argc_);
        unsafe {
            JS::HandleValue::from_marked_location(self.argv_.offset(i as isize))
        }
    }

    #[inline]
    pub fn index_mut(&self, i: u32) -> JS::MutableHandleValue {
        assert!(i < self.argc_);
        unsafe {
            JS::MutableHandleValue::from_marked_location(self.argv_.offset(i as isize))
        }
    }

    #[inline]
    pub fn rval(&self) -> JS::MutableHandleValue {
        unsafe {
            JS::MutableHandleValue::from_marked_location(self.argv_.offset(-2))
        }
    }
}

impl JSJitGetterCallArgs {
    #[inline]
    pub fn rval(&self) -> JS::MutableHandleValue {
        self._base
    }
}

// XXX need to hack up bindgen to convert this better so we don't have
//     to duplicate so much code here
impl JS::CallArgs {
    #[inline]
    pub unsafe fn from_vp(vp: *mut JS::Value, argc: u32) -> JS::CallArgs {
        // For some reason, with debugmozjs, calling
        // JS_CallArgsFromVp(argc, vp)
        // produces a SEGV caused by the vp being overwritten by the argc.
        // TODO: debug this!
        JS::CallArgs {
            _bitfield_1: JS::CallArgs::new_bitfield_1(
                (*vp.offset(1)).is_magic(),
                false
            ),
            argc_: argc,
            argv_: vp.offset(2),
            #[cfg(not(feature = "debugmozjs"))]
            __bindgen_padding_0: [0, 0, 0],
            #[cfg(feature = "debugmozjs")]
            wantUsedRval_: JS::detail::IncludeUsedRval {
                usedRval_: false,
            },
        }
    }

    #[inline]
    pub fn index(&self, i: u32) -> JS::HandleValue {
        assert!(i < self.argc_);
        unsafe {
            JS::HandleValue::from_marked_location(self.argv_.offset(i as isize))
        }
    }

    #[inline]
    pub fn index_mut(&self, i: u32) -> JS::MutableHandleValue {
        assert!(i < self.argc_);
        unsafe {
            JS::MutableHandleValue::from_marked_location(self.argv_.offset(i as isize))
        }
    }

    #[inline]
    pub fn get(&self, i: u32) -> JS::HandleValue {
        unsafe {
            if i < self.argc_ {
                JS::HandleValue::from_marked_location(self.argv_.offset(i as isize))
            } else {
                JS::UndefinedHandleValue
            }
        }
    }

    #[inline]
    pub fn rval(&self) -> JS::MutableHandleValue {
        unsafe {
            JS::MutableHandleValue::from_marked_location(self.argv_.offset(-2))
        }
    }

    #[inline]
    pub fn thisv(&self) -> JS::HandleValue {
        unsafe {
            JS::HandleValue::from_marked_location(self.argv_.offset(-1))
        }
    }

    #[inline]
    pub fn calleev(&self) -> JS::HandleValue {
        unsafe {
            JS::HandleValue::from_marked_location(self.argv_.offset(-2))
        }
    }

    #[inline]
    pub fn callee(&self) -> *mut JSObject {
        self.calleev().to_object()
    }

    #[inline]
    pub fn new_target(&self) -> JS::MutableHandleValue {
        assert!(self.constructing_());
        unsafe {
            JS::MutableHandleValue::from_marked_location(self.argv_.offset(self.argc_ as isize))
        }
    }
}

impl JSJitSetterCallArgs {
    #[inline]
    pub fn get(&self, i: u32) -> JS::HandleValue {
        assert!(i == 0);
        self._base.handle()
    }
}

impl JSFunctionSpec {
    pub const ZERO: Self = JSFunctionSpec {
        name: 0 as *const _,
        selfHostedName: 0 as *const _,
        flags: 0,
        nargs: 0,
        call: JSNativeWrapper::ZERO,
    };

    pub fn is_zeroed(&self) -> bool {
        self.name.is_null() &&
            self.selfHostedName.is_null() &&
            self.flags == 0 &&
            self.nargs == 0 &&
            self.call.is_zeroed()
    }
}

impl JSPropertySpec {
    pub const ZERO: Self = JSPropertySpec {
        name: 0 as *const _,
        flags: 0,
        __bindgen_anon_1: ::jsapi::JSPropertySpec__bindgen_ty_1 {
            accessors: ::jsapi::JSPropertySpec__bindgen_ty_1__bindgen_ty_1 {
                getter: ::jsapi::JSPropertySpec__bindgen_ty_1__bindgen_ty_1__bindgen_ty_1 {
                    native: JSNativeWrapper::ZERO,
                },
                setter: ::jsapi::JSPropertySpec__bindgen_ty_1__bindgen_ty_1__bindgen_ty_2 {
                    native: JSNativeWrapper::ZERO,
                },
            },
        },
    };

    pub fn is_zeroed(&self) -> bool {
        self.name.is_null() &&
            self.flags == 0 &&
            unsafe { self.__bindgen_anon_1.accessors.getter.native.is_zeroed() } &&
            unsafe { self.__bindgen_anon_1.accessors.setter.native.is_zeroed() }
    }
}

impl JSNativeWrapper {
    pub const ZERO: Self = JSNativeWrapper {
        info: 0 as *const _,
        op: None,
    };

    pub fn is_zeroed(&self) -> bool {
        self.op.is_none() &&
            self.info.is_null()
    }
}

impl<T> JS::Rooted<T> {
    pub fn new_unrooted() -> JS::Rooted<T> {
        JS::Rooted {
            stack: ::std::ptr::null_mut(),
            prev: ::std::ptr::null_mut(),
            ptr: unsafe { ::std::mem::zeroed() },
        }
    }

    unsafe fn get_rooting_context(cx: *mut JSContext) -> *mut JS::RootingContext {
        cx as *mut JS::RootingContext
    }

    unsafe fn get_root_stack(cx: *mut JSContext) -> *mut *mut JS::Rooted<*mut c_void>
        where T: RootKind
    {
        let kind = T::rootKind() as usize;
        let rooting_cx = Self::get_rooting_context(cx);
        &mut (*rooting_cx).stackRoots_[kind] as *mut _ as *mut _
    }

    pub unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext)
        where T: RootKind
    {
        let stack = Self::get_root_stack(cx);
        self.stack = stack;
        self.prev = *stack;

        *stack = self as *mut _ as usize as _;
    }

    pub unsafe fn remove_from_root_stack(&mut self) {
        assert!(*self.stack == self as *mut _ as usize as _);
        *self.stack = self.prev;
    }
}

impl JS::ObjectOpResult {
    /// Set this ObjectOpResult to true and return true.
    pub fn succeed(&mut self) -> bool {
        self.code_ = JS::ObjectOpResult_SpecialCodes::OkCode as usize;
        true
    }

    #[allow(non_snake_case)]
    pub fn failNoNamedSetter(&mut self) -> bool {
        assert!(self.code_ != JS::ObjectOpResult_SpecialCodes::OkCode as usize);
        self.code_ = JSErrNum::JSMSG_NO_NAMED_SETTER as usize;
        true
    }
}

impl JS::ForOfIterator {
    pub unsafe fn init(&mut self, iterable: JS::HandleValue, non_iterable_behavior: JS::ForOfIterator_NonIterableBehavior) -> bool {
        JS_ForOfIteratorInit(self, iterable, non_iterable_behavior)
    }

    pub unsafe fn next(&mut self, val: JS::MutableHandleValue, done: *mut bool) -> bool {
        JS_ForOfIteratorNext(self, val, done)
    }
}
