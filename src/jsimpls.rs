/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use jsapi::js;
use jsapi::JS;
use jsapi::JSAutoCompartment;
use jsapi::JSContext;
use jsapi::JSErrNum;
use jsapi::JSID_VOID;
use jsapi::JSJitGetterCallArgs;
use jsapi::JSJitMethodCallArgs;
use jsapi::JSJitSetterCallArgs;
use jsapi::JSNativeWrapper;
use jsapi::JSObject;
use jsapi::JS_EnterCompartment;
use jsapi::JS_LeaveCompartment;
use jsapi::glue::JS_AsShadowZone;
use jsapi::glue::JS_CallArgsFromVp;
use jsapi::glue::JS_NewCompartmentOptions;
use jsapi::glue::JS_ForOfIteratorInit;
use jsapi::glue::JS_ForOfIteratorNext;
use jsapi::jsid;
use jsgc::RootKind;
use jsval::UndefinedValue;

#[cfg(feature = "debugmozjs")]
use jsapi::mozilla::detail::GuardObjectNotificationReceiver;

use std::ops::Deref;
use std::ops::DerefMut;
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
    fn default() -> Self { unsafe { JSID_VOID } }
}

impl Default for JS::CompartmentOptions {
    fn default() -> Self {
        unsafe { JS_NewCompartmentOptions() }
    }
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

impl Drop for JSAutoCompartment {
    fn drop(&mut self) {
        unsafe { JS_LeaveCompartment(self.cx_, self.oldCompartment_); }
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

impl JSAutoCompartment {
    pub fn new(cx: *mut JSContext, target: *mut JSObject) -> JSAutoCompartment {
        JSAutoCompartment {
            cx_: cx,
            oldCompartment_: unsafe { JS_EnterCompartment(cx, target) },
            #[cfg(feature = "debugmozjs")]
            _mCheckNotUsedAsTemporary: GuardObjectNotificationReceiver {
                mStatementDone: false,
            }
        }
    }
}

impl JS::AutoGCRooter {
    pub fn new_unrooted(tag: JS::AutoGCRooterTag) -> JS::AutoGCRooter {
        JS::AutoGCRooter {
            down: ptr::null(),
            tag_: tag as isize,
            stackTop: ptr::null(),
        }
    }

    pub unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext) {
        #[allow(non_snake_case)]
        let autoGCRooters: &mut _ = {
            let ctxfriend = cx as *mut js::ContextFriendFields;
            &mut (*ctxfriend).roots.autoGCRooters_
        };
        self.stackTop = autoGCRooters;
        self.down = *autoGCRooters;

        assert!(*self.stackTop != self);
        *autoGCRooters = self;
    }

    pub unsafe fn remove_from_root_stack(&mut self) {
        assert!(*self.stackTop == self);
        // This hoop-dancing is needed because bindgen gives stackTop
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

impl JSNativeWrapper {
    pub fn is_zeroed(&self) -> bool {
        let JSNativeWrapper { op, info } = *self;
        op.is_none() && info.is_null()
    }
}

impl<T> JS::Rooted<T> {
    pub fn new_unrooted() -> JS::Rooted<T> {
        JS::Rooted {
            stack: ::std::ptr::null_mut(),
            prev: ::std::ptr::null_mut(),
            ptr: unsafe { ::std::mem::zeroed() },
            _phantom_0: ::std::marker::PhantomData,
        }
    }

    pub unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext) where T: RootKind {
        let ctxfriend = cx as *mut js::ContextFriendFields;
        let zone = (*ctxfriend).zone_;
        let roots: *mut _ = if !zone.is_null() {
            let shadowed = &mut *JS_AsShadowZone(zone);
            &mut shadowed.stackRoots_
        } else {
            let rt = (*ctxfriend).runtime_;
            let rt = rt as *mut js::PerThreadDataFriendFields_RuntimeDummy;
            let main_thread = &mut (*rt).mainThread as *mut _;
            let main_thread = main_thread as *mut js::PerThreadDataFriendFields;
            &mut (*main_thread).roots.stackRoots_
        };

        let kind = T::rootKind() as usize;
        let stack = &mut (*roots)[kind] as *mut _ as *mut _;

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
