/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use crate::jsapi::glue::JS_ForOfIteratorInit;
use crate::jsapi::glue::JS_ForOfIteratorNext;
use crate::jsapi::jsid;
use crate::jsapi::JSAutoRealm;
use crate::jsapi::JSContext;
use crate::jsapi::JSErrNum;
use crate::jsapi::JSFunctionSpec;
use crate::jsapi::JSJitGetterCallArgs;
use crate::jsapi::JSJitMethodCallArgs;
use crate::jsapi::JSJitSetterCallArgs;
use crate::jsapi::JSNativeWrapper;
use crate::jsapi::JSObject;
use crate::jsapi::JSPropertySpec;
use crate::jsapi::JSPropertySpec_Kind;
use crate::jsapi::JSPropertySpec_Name;
use crate::jsapi::JS;
use crate::jsgc::RootKind;
use crate::jsid::VoidId;
use crate::jsval::UndefinedValue;

use crate::jsapi::JS::{ObjectOpResult, ObjectOpResult_SpecialCodes};
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
    fn default() -> Self {
        VoidId()
    }
}

impl Default for JS::PropertyDescriptor {
    fn default() -> Self {
        JS::PropertyDescriptor {
            _bitfield_align_1: [],
            _bitfield_1: Default::default(),
            getter_: ptr::null_mut(),
            setter_: ptr::null_mut(),
            value_: UndefinedValue(),
        }
    }
}

impl Drop for JSAutoRealm {
    fn drop(&mut self) {
        unsafe {
            JS::LeaveRealm(self.cx_, self.oldRealm_);
        }
    }
}

impl<T> JS::Handle<T> {
    pub fn get(&self) -> T
    where
        T: Copy,
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
            ptr,
            _phantom_0: ::std::marker::PhantomData,
        }
    }

    pub fn handle(&self) -> JS::Handle<T> {
        unsafe { JS::Handle::from_marked_location(self.ptr as *const _) }
    }

    pub fn get(&self) -> T
    where
        T: Copy,
    {
        unsafe { *self.ptr }
    }

    pub fn set(&self, v: T)
    where
        T: Copy,
    {
        unsafe { *self.ptr = v }
    }
}

impl JS::HandleValue {
    pub fn null() -> JS::HandleValue {
        unsafe { JS::NullHandleValue }
    }

    pub fn undefined() -> JS::HandleValue {
        unsafe { JS::UndefinedHandleValue }
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
            elements_: values.as_ptr(),
        }
    }
}

const NULL_OBJECT: *mut JSObject = 0 as *mut JSObject;

impl JS::HandleObject {
    pub fn null() -> JS::HandleObject {
        unsafe { JS::HandleObject::from_marked_location(&NULL_OBJECT) }
    }
}

// ___________________________________________________________________________
// Implementations for various things in jsapi.rs

impl JSAutoRealm {
    pub fn new(cx: *mut JSContext, target: *mut JSObject) -> JSAutoRealm {
        JSAutoRealm {
            cx_: cx,
            oldRealm_: unsafe { JS::EnterRealm(cx, target) },
        }
    }
}

impl JS::AutoGCRooter {
    pub fn new_unrooted(kind: JS::AutoGCRooterKind) -> JS::AutoGCRooter {
        JS::AutoGCRooter {
            down: ptr::null_mut(),
            kind_: kind,
            stackTop: ptr::null_mut(),
        }
    }

    pub unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext) {
        #[allow(non_snake_case)]
        let autoGCRooters: *mut _ = {
            let rooting_cx = cx as *mut JS::RootingContext;
            &mut (*rooting_cx).autoGCRooters_[self.kind_ as usize]
        };
        self.stackTop = autoGCRooters as *mut *mut _;
        self.down = *autoGCRooters as *mut _;

        assert!(*self.stackTop != self);
        *autoGCRooters = self as *mut _ as _;
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
        unsafe { JS::HandleValue::from_marked_location(self.argv_.offset(i as isize)) }
    }

    #[inline]
    pub fn index_mut(&self, i: u32) -> JS::MutableHandleValue {
        assert!(i < self.argc_);
        unsafe { JS::MutableHandleValue::from_marked_location(self.argv_.offset(i as isize)) }
    }

    #[inline]
    pub fn rval(&self) -> JS::MutableHandleValue {
        unsafe { JS::MutableHandleValue::from_marked_location(self.argv_.offset(-2)) }
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
            _bitfield_align_1: Default::default(),
            _bitfield_1: JS::CallArgs::new_bitfield_1((*vp.offset(1)).is_magic(), false),
            argc_: argc,
            argv_: vp.offset(2),
            #[cfg(not(feature = "debugmozjs"))]
            __bindgen_padding_0: [0, 0, 0],
            #[cfg(feature = "debugmozjs")]
            wantUsedRval_: JS::detail::IncludeUsedRval { usedRval_: false },
        }
    }

    #[inline]
    pub fn index(&self, i: u32) -> JS::HandleValue {
        assert!(i < self.argc_);
        unsafe { JS::HandleValue::from_marked_location(self.argv_.offset(i as isize)) }
    }

    #[inline]
    pub fn index_mut(&self, i: u32) -> JS::MutableHandleValue {
        assert!(i < self.argc_);
        unsafe { JS::MutableHandleValue::from_marked_location(self.argv_.offset(i as isize)) }
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
        unsafe { JS::MutableHandleValue::from_marked_location(self.argv_.offset(-2)) }
    }

    #[inline]
    pub fn thisv(&self) -> JS::HandleValue {
        unsafe { JS::HandleValue::from_marked_location(self.argv_.offset(-1)) }
    }

    #[inline]
    pub fn calleev(&self) -> JS::HandleValue {
        unsafe { JS::HandleValue::from_marked_location(self.argv_.offset(-2)) }
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
        name: JSPropertySpec_Name {
            string_: ptr::null(),
        },
        selfHostedName: 0 as *const _,
        flags: 0,
        nargs: 0,
        call: JSNativeWrapper::ZERO,
    };

    pub fn is_zeroed(&self) -> bool {
        (unsafe { self.name.string_.is_null() })
            && self.selfHostedName.is_null()
            && self.flags == 0
            && self.nargs == 0
            && self.call.is_zeroed()
    }
}

impl JSPropertySpec {
    pub const ZERO: Self = JSPropertySpec {
        name: JSPropertySpec_Name {
            string_: ptr::null(),
        },
        attributes_: 0,
        kind_: JSPropertySpec_Kind::NativeAccessor,
        u: crate::jsapi::JSPropertySpec_AccessorsOrValue {
            accessors: crate::jsapi::JSPropertySpec_AccessorsOrValue_Accessors {
                getter: crate::jsapi::JSPropertySpec_Accessor {
                    native: JSNativeWrapper::ZERO,
                },
                setter: crate::jsapi::JSPropertySpec_Accessor {
                    native: JSNativeWrapper::ZERO,
                },
            },
        },
    };

    /// https://searchfox.org/mozilla-central/rev/2bdaa395cb841b28f8ef74882a61df5efeedb42b/js/public/PropertySpec.h#305-307
    pub fn is_accessor(&self) -> bool {
        self.kind_ == JSPropertySpec_Kind::NativeAccessor
            || self.kind_ == JSPropertySpec_Kind::SelfHostedAccessor
    }

    pub fn is_zeroed(&self) -> bool {
        (unsafe { self.name.string_.is_null() })
            && self.attributes_ == 0
            && self.is_accessor()
            && unsafe { self.u.accessors.getter.native.is_zeroed() }
            && unsafe { self.u.accessors.setter.native.is_zeroed() }
    }
}

impl JSNativeWrapper {
    pub const ZERO: Self = JSNativeWrapper {
        info: 0 as *const _,
        op: None,
    };

    pub fn is_zeroed(&self) -> bool {
        self.op.is_none() && self.info.is_null()
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
    where
        T: RootKind,
    {
        let kind = T::rootKind() as usize;
        let rooting_cx = Self::get_rooting_context(cx);
        &mut (*rooting_cx).stackRoots_[kind] as *mut _ as *mut _
    }

    pub unsafe fn add_to_root_stack(&mut self, cx: *mut JSContext)
    where
        T: RootKind,
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
    pub fn ok(&self) -> bool {
        assert_ne!(
            self.code_,
            JS::ObjectOpResult_SpecialCodes::Uninitialized as usize
        );
        self.code_ == JS::ObjectOpResult_SpecialCodes::OkCode as usize
    }

    /// Set this ObjectOpResult to true and return true.
    pub fn succeed(&mut self) -> bool {
        self.code_ = JS::ObjectOpResult_SpecialCodes::OkCode as usize;
        true
    }

    pub fn fail(&mut self, code: JSErrNum) -> bool {
        assert_ne!(
            code as usize,
            JS::ObjectOpResult_SpecialCodes::OkCode as usize
        );
        self.code_ = code as usize;
        true
    }

    pub fn fail_cant_redefine_prop(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_REDEFINE_PROP)
    }

    pub fn fail_read_only(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_READ_ONLY)
    }

    pub fn fail_getter_only(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_GETTER_ONLY)
    }

    pub fn fail_cant_delete(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_DELETE)
    }

    pub fn fail_cant_set_interposed(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_SET_INTERPOSED)
    }

    pub fn fail_cant_define_window_element(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_DEFINE_WINDOW_ELEMENT)
    }

    pub fn fail_cant_delete_window_element(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_DELETE_WINDOW_ELEMENT)
    }

    pub fn fail_cant_define_window_named_property(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_DEFINE_WINDOW_NAMED_PROPERTY)
    }

    pub fn fail_cant_delete_window_named_property(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_DELETE_WINDOW_NAMED_PROPERTY)
    }

    pub fn fail_cant_define_window_non_configurable(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_DEFINE_WINDOW_NC)
    }

    pub fn fail_cant_prevent_extensions(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_PREVENT_EXTENSIONS)
    }

    pub fn fail_cant_set_proto(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_CANT_SET_PROTO)
    }

    pub fn fail_no_named_setter(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_NO_NAMED_SETTER)
    }

    pub fn fail_no_indexed_setter(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_NO_INDEXED_SETTER)
    }

    pub fn fail_not_data_descriptor(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_NOT_DATA_DESCRIPTOR)
    }

    pub fn fail_invalid_descriptor(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_INVALID_DESCRIPTOR)
    }

    pub fn fail_bad_array_length(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_BAD_ARRAY_LENGTH)
    }

    pub fn fail_bad_index(&mut self) -> bool {
        self.fail(JSErrNum::JSMSG_BAD_INDEX)
    }

    pub fn failure_code(&self) -> u32 {
        assert!(!self.ok());
        self.code_ as u32
    }

    #[deprecated]
    #[allow(non_snake_case)]
    pub fn failNoNamedSetter(&mut self) -> bool {
        self.fail_no_named_setter()
    }
}

impl Default for ObjectOpResult {
    fn default() -> ObjectOpResult {
        ObjectOpResult {
            code_: ObjectOpResult_SpecialCodes::Uninitialized as usize,
        }
    }
}

impl JS::ForOfIterator {
    pub unsafe fn init(
        &mut self,
        iterable: JS::HandleValue,
        non_iterable_behavior: JS::ForOfIterator_NonIterableBehavior,
    ) -> bool {
        JS_ForOfIteratorInit(self, iterable, non_iterable_behavior)
    }

    pub unsafe fn next(&mut self, val: JS::MutableHandleValue, done: *mut bool) -> bool {
        JS_ForOfIteratorNext(self, val, done)
    }
}
