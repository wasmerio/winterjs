use jsapi::*;
use std::os::raw::{c_char, c_void};
use std::{mem, ptr};

pub enum Action {}
unsafe impl Sync for ProxyTraps {}

#[repr(C)]
#[derive(Copy, Clone)]
pub struct JobQueueTraps {
    pub getIncumbentGlobal:
        Option<unsafe extern "C" fn(queue: *const c_void, cx: *mut JSContext) -> *mut JSObject>,
    pub enqueuePromiseJob: Option<
        unsafe extern "C" fn(
            queue: *const c_void,
            cx: *mut JSContext,
            promise: HandleObject,
            job: HandleObject,
            allocationSite: HandleObject,
            incumbentGlobal: HandleObject,
        ) -> bool,
    >,
    pub empty: Option<unsafe extern "C" fn(queue: *const c_void) -> bool>,
}

impl Default for JobQueueTraps {
    fn default() -> JobQueueTraps {
        unsafe { mem::zeroed() }
    }
}

#[repr(C)]
#[derive(Copy, Clone, Default)]
pub struct ReadableStreamUnderlyingSourceTraps {
    pub requestData: Option<
        unsafe extern "C" fn(
            source: *const c_void,
            cx: *mut JSContext,
            stream: HandleObject,
            desiredSize: usize,
        ),
    >,
    pub writeIntoReadRequestBuffer: Option<
        unsafe extern "C" fn(
            source: *const c_void,
            cx: *mut JSContext,
            stream: HandleObject,
            chunk: HandleObject,
            length: usize,
            bytesWritten: *mut usize,
        ),
    >,
    pub cancel: Option<
        unsafe extern "C" fn(
            source: *const c_void,
            cx: *mut JSContext,
            stream: HandleObject,
            reason: HandleValue,
            resolve_to: *mut Value,
        ),
    >,
    pub onClosed: Option<
        unsafe extern "C" fn(source: *const c_void, cx: *mut JSContext, stream: HandleObject),
    >,
    pub onErrored: Option<
        unsafe extern "C" fn(
            source: *const c_void,
            cx: *mut JSContext,
            stream: HandleObject,
            reason: HandleValue,
        ),
    >,
    pub finalize: Option<unsafe extern "C" fn(source: *mut ReadableStreamUnderlyingSource)>,
}

#[repr(C)]
#[derive(Copy, Clone, Default)]
pub struct JSExternalStringCallbacksTraps {
    pub finalize: Option<unsafe extern "C" fn(*const c_void, *mut u16)>,
    pub sizeOfBuffer:
        Option<unsafe extern "C" fn(*const c_void, *const u16, MallocSizeOf) -> usize>,
}

#[repr(C)]
#[derive(Copy, Clone)]
pub struct ProxyTraps {
    pub enter: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            action: Action,
            bp: *mut bool,
        ) -> bool,
    >,
    pub getOwnPropertyDescriptor: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            desc: MutableHandle<PropertyDescriptor>,
            isNone: *mut bool,
        ) -> bool,
    >,
    pub defineProperty: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            desc: Handle<PropertyDescriptor>,
            result: *mut ObjectOpResult,
        ) -> bool,
    >,
    pub ownPropertyKeys: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            props: MutableHandleIdVector,
        ) -> bool,
    >,
    pub delete_: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            result: *mut ObjectOpResult,
        ) -> bool,
    >,
    pub enumerate: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            props: MutableHandleIdVector,
        ) -> bool,
    >,
    pub getPrototypeIfOrdinary: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            isOrdinary: *mut bool,
            protop: MutableHandleObject,
        ) -> bool,
    >,
    pub getPrototype: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            protop: MutableHandleObject,
        ) -> bool,
    >,
    pub setPrototype: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            proto: HandleObject,
            result: *mut ObjectOpResult,
        ) -> bool,
    >,
    pub setImmutablePrototype: Option<
        unsafe extern "C" fn(cx: *mut JSContext, proxy: HandleObject, succeeded: *mut bool) -> bool,
    >,
    pub preventExtensions: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            result: *mut ObjectOpResult,
        ) -> bool,
    >,
    pub isExtensible: Option<
        unsafe extern "C" fn(cx: *mut JSContext, proxy: HandleObject, succeeded: *mut bool) -> bool,
    >,
    pub has: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            bp: *mut bool,
        ) -> bool,
    >,
    pub get: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            receiver: HandleValue,
            id: HandleId,
            vp: MutableHandleValue,
        ) -> bool,
    >,
    pub set: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            v: HandleValue,
            receiver: HandleValue,
            result: *mut ObjectOpResult,
        ) -> bool,
    >,
    pub call: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            args: *const CallArgs,
        ) -> bool,
    >,
    pub construct: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            args: *const CallArgs,
        ) -> bool,
    >,
    pub hasOwn: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            id: HandleId,
            bp: *mut bool,
        ) -> bool,
    >,
    pub getOwnEnumerablePropertyKeys: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            props: MutableHandleIdVector,
        ) -> bool,
    >,
    pub nativeCall: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            test: IsAcceptableThis,
            _impl: NativeImpl,
            args: CallArgs,
        ) -> bool,
    >,
    pub objectClassIs: ::std::option::Option<
        unsafe extern "C" fn(obj: HandleObject, classValue: ESClass, cx: *mut JSContext) -> bool,
    >,
    pub className:
        Option<unsafe extern "C" fn(cx: *mut JSContext, proxy: HandleObject) -> *const i8>,
    pub fun_toString: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            isToString: bool,
        ) -> *mut JSString,
    >,
    pub boxedValue_unbox: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            proxy: HandleObject,
            vp: MutableHandleValue,
        ) -> bool,
    >,
    pub defaultValue: Option<
        unsafe extern "C" fn(
            cx: *mut JSContext,
            obj: HandleObject,
            hint: JSType,
            vp: MutableHandleValue,
        ) -> bool,
    >,
    pub trace: Option<unsafe extern "C" fn(trc: *mut JSTracer, proxy: *mut JSObject)>,
    pub finalize: Option<unsafe extern "C" fn(cx: *mut GCContext, proxy: *mut JSObject)>,
    pub objectMoved:
        Option<unsafe extern "C" fn(proxy: *mut JSObject, old: *mut JSObject) -> usize>,
    pub isCallable: Option<unsafe extern "C" fn(obj: *mut JSObject) -> bool>,
    pub isConstructor: Option<unsafe extern "C" fn(obj: *mut JSObject) -> bool>,
}

impl Default for ProxyTraps {
    fn default() -> ProxyTraps {
        unsafe { mem::zeroed() }
    }
}
#[repr(C)]
#[derive(Copy, Clone)]
pub struct WrapperProxyHandler {
    pub mTraps: ProxyTraps,
}

impl Default for WrapperProxyHandler {
    fn default() -> WrapperProxyHandler {
        unsafe { mem::zeroed() }
    }
}
#[repr(C)]
#[derive(Copy, Clone)]
pub struct ForwardingProxyHandler {
    pub mTraps: ProxyTraps,
    pub mExtra: *const c_void,
}

impl Default for ForwardingProxyHandler {
    fn default() -> ForwardingProxyHandler {
        ForwardingProxyHandler {
            mTraps: ProxyTraps::default(),
            mExtra: ptr::null(),
        }
    }
}

#[repr(C)]
#[derive(Copy, Clone)]
pub struct JSPrincipalsCallbacks {
    pub write: Option<
        unsafe extern "C" fn(
            *mut JSPrincipals,
            *mut JSContext,
            *mut JSStructuredCloneWriter,
        ) -> bool,
    >,
    pub isSystemOrAddonPrincipal: Option<unsafe extern "C" fn(*mut JSPrincipals) -> bool>,
}

extern "C" {
    pub fn CreateRustJSPrincipals(
        callbacks: *const JSPrincipalsCallbacks,
        private: *mut c_void,
    ) -> *mut JSPrincipals;
    pub fn DestroyRustJSPrincipals(principals: *const JSPrincipals);
    pub fn GetRustJSPrincipalsPrivate(principals: *const JSPrincipals) -> *mut c_void;
    pub fn InvokeGetOwnPropertyDescriptor(
        handler: *const c_void,
        cx: *mut JSContext,
        proxy: HandleObject,
        id: HandleId,
        desc: MutableHandle<PropertyDescriptor>,
        isNone: *mut bool,
    ) -> bool;
    pub fn InvokeHasOwn(
        handler: *const c_void,
        cx: *mut JSContext,
        proxy: HandleObject,
        id: HandleId,
        bp: *mut bool,
    ) -> bool;
    pub fn RUST_JS_NumberValue(d: f64, dest: *mut Value);
    pub fn RUST_FUNCTION_VALUE_TO_JITINFO(v: Value) -> *const JSJitInfo;
    pub fn CreateCallArgsFromVp(argc: u32, v: *mut Value) -> CallArgs;
    pub fn CallJitGetterOp(
        info: *const JSJitInfo,
        cx: *mut JSContext,
        thisObj: HandleObject,
        specializedThis: *mut c_void,
        argc: u32,
        vp: *mut Value,
    ) -> bool;
    pub fn CallJitSetterOp(
        info: *const JSJitInfo,
        cx: *mut JSContext,
        thisObj: HandleObject,
        specializedThis: *mut c_void,
        argc: u32,
        vp: *mut Value,
    ) -> bool;
    pub fn CallJitMethodOp(
        info: *const JSJitInfo,
        cx: *mut JSContext,
        thisObj: HandleObject,
        specializedThis: *mut c_void,
        argc: u32,
        vp: *mut Value,
    ) -> bool;
    pub fn CreateProxyHandler(aTraps: *const ProxyTraps, aExtra: *const c_void) -> *const c_void;
    pub fn CreateWrapperProxyHandler(aTraps: *const ProxyTraps) -> *const c_void;
    pub fn GetCrossCompartmentWrapper() -> *const c_void;
    pub fn GetSecurityWrapper() -> *const c_void;
    pub fn NewCompileOptions(
        aCx: *mut JSContext,
        aFile: *const c_char,
        aLine: u32,
    ) -> *mut ReadOnlyCompileOptions;
    pub fn DeleteCompileOptions(aOpts: *mut ReadOnlyCompileOptions);
    pub fn NewProxyObject(
        aCx: *mut JSContext,
        aHandler: *const c_void,
        aPriv: HandleValue,
        proto: *mut JSObject,
        classp: *const JSClass,
        aLazyProto: bool,
    ) -> *mut JSObject;
    pub fn WrapperNew(
        aCx: *mut JSContext,
        aObj: HandleObject,
        aHandler: *const c_void,
        aClass: *const JSClass,
        aSingleton: bool,
    ) -> *mut JSObject;

    pub fn NewWindowProxy(
        aCx: *mut JSContext,
        aObj: HandleObject,
        aHandler: *const c_void,
    ) -> *mut JSObject;
    pub fn GetWindowProxyClass() -> *const JSClass;
    pub fn GetProxyReservedSlot(obj: *mut JSObject, slot: u32, dest: *mut Value);
    pub fn GetProxyPrivate(obj: *mut JSObject, dest: *mut Value);
    pub fn SetProxyReservedSlot(obj: *mut JSObject, slot: u32, val: *const Value);
    pub fn SetProxyPrivate(obj: *mut JSObject, expando: *const Value);

    #[deprecated]
    pub fn RUST_JSID_IS_INT(id: HandleId) -> bool;
    #[deprecated]
    pub fn RUST_JSID_TO_INT(id: HandleId) -> i32;
    #[deprecated]
    pub fn int_to_jsid(i: i32, id: MutableHandleId);
    #[deprecated]
    pub fn RUST_JSID_IS_STRING(id: HandleId) -> bool;
    #[deprecated]
    pub fn RUST_JSID_TO_STRING(id: HandleId) -> *mut JSString;
    #[deprecated]
    pub fn RUST_SYMBOL_TO_JSID(sym: *mut Symbol, id: MutableHandleId);
    #[deprecated]
    pub fn RUST_JSID_IS_VOID(id: HandleId) -> bool;
    pub fn SetBuildId(buildId: *mut BuildIdCharVector, chars: *const u8, len: usize) -> bool;
    pub fn RUST_SET_JITINFO(func: *mut JSFunction, info: *const JSJitInfo);
    pub fn RUST_INTERNED_STRING_TO_JSID(
        cx: *mut JSContext,
        str: *mut JSString,
        id: MutableHandleId,
    );
    pub fn RUST_js_GetErrorMessage(
        userRef: *mut c_void,
        errorNumber: u32,
    ) -> *const JSErrorFormatString;
    pub fn IsProxyHandlerFamily(obj: *mut JSObject) -> u8;
    pub fn GetProxyHandlerExtra(obj: *mut JSObject) -> *const c_void;
    pub fn GetProxyHandler(obj: *mut JSObject) -> *const c_void;
    pub fn ReportError(aCx: *mut JSContext, aError: *const i8);
    pub fn IsWrapper(obj: *mut JSObject) -> bool;
    pub fn UnwrapObjectStatic(obj: *mut JSObject) -> *mut JSObject;
    pub fn UnwrapObjectDynamic(
        obj: *mut JSObject,
        cx: *mut JSContext,
        stopAtOuter: u8,
    ) -> *mut JSObject;
    pub fn UncheckedUnwrapObject(obj: *mut JSObject, stopAtOuter: u8) -> *mut JSObject;
    pub fn CreateRootedIdVector(cx: *mut JSContext) -> *mut PersistentRootedIdVector;
    pub fn GetIdVectorAddress(v: *mut PersistentRootedIdVector) -> *mut c_void;
    pub fn SliceRootedIdVector(
        v: *const PersistentRootedIdVector,
        length: *mut usize,
    ) -> *const jsid;
    pub fn AppendToIdVector(v: MutableHandleIdVector, id: HandleId) -> bool;
    pub fn DestroyRootedIdVector(v: *mut PersistentRootedIdVector);
    pub fn CreateRootedObjectVector(aCx: *mut JSContext) -> *mut PersistentRootedObjectVector;
    pub fn AppendToRootedObjectVector(
        v: *mut PersistentRootedObjectVector,
        obj: *mut JSObject,
    ) -> bool;
    pub fn GetObjectVectorAddress(v: *mut PersistentRootedObjectVector) -> *mut c_void;
    pub fn DeleteRootedObjectVector(v: *mut PersistentRootedObjectVector);
    pub fn CollectServoSizes(
        cx: *mut JSContext,
        sizes: *mut ServoSizes,
        get_size: Option<unsafe extern "C" fn(obj: *mut JSObject) -> usize>,
    ) -> bool;
    pub fn InitializeMemoryReporter(
        want_to_measure: Option<unsafe extern "C" fn(obj: *mut JSObject) -> bool>,
    );
    pub fn CallIdTracer(trc: *mut JSTracer, idp: *mut Heap<jsid>, name: *const c_char);
    pub fn CallValueTracer(trc: *mut JSTracer, valuep: *mut Heap<Value>, name: *const c_char);
    pub fn CallObjectTracer(
        trc: *mut JSTracer,
        objp: *mut Heap<*mut JSObject>,
        name: *const c_char,
    );
    pub fn CallStringTracer(
        trc: *mut JSTracer,
        strp: *mut Heap<*mut JSString>,
        name: *const c_char,
    );
    pub fn CallScriptTracer(
        trc: *mut JSTracer,
        scriptp: *mut Heap<*mut JSScript>,
        name: *const c_char,
    );
    pub fn CallFunctionTracer(
        trc: *mut JSTracer,
        funp: *mut Heap<*mut JSFunction>,
        name: *const c_char,
    );
    pub fn CallUnbarrieredObjectTracer(
        trc: *mut JSTracer,
        objp: *mut *mut JSObject,
        name: *const c_char,
    );
    pub fn CallObjectRootTracer(trc: *mut JSTracer, objp: *mut *mut JSObject, name: *const c_char);
    pub fn CallValueRootTracer(trc: *mut JSTracer, valp: *mut Value, name: *const c_char);
    pub fn GetProxyHandlerFamily() -> *const c_void;

    pub fn GetInt8ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut i8,
    );
    pub fn GetUint8ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut u8,
    );
    pub fn GetUint8ClampedArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut u8,
    );
    pub fn GetInt16ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut i16,
    );
    pub fn GetUint16ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut u16,
    );
    pub fn GetInt32ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut i32,
    );
    pub fn GetUint32ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut u32,
    );
    pub fn GetFloat32ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut f32,
    );
    pub fn GetFloat64ArrayLengthAndData(
        obj: *mut JSObject,
        length: *mut usize,
        isSharedMemory: *mut bool,
        data: *mut *mut f64,
    );

    pub fn NewJSAutoStructuredCloneBuffer(
        scope: StructuredCloneScope,
        callbacks: *const JSStructuredCloneCallbacks,
    ) -> *mut JSAutoStructuredCloneBuffer;
    pub fn DeleteJSAutoStructuredCloneBuffer(buf: *mut JSAutoStructuredCloneBuffer);
    pub fn GetLengthOfJSStructuredCloneData(data: *mut JSStructuredCloneData) -> usize;
    pub fn CopyJSStructuredCloneData(src: *const JSStructuredCloneData, dest: *mut u8);
    pub fn WriteBytesToJSStructuredCloneData(
        src: *const u8,
        len: usize,
        dest: *mut JSStructuredCloneData,
    );
    pub fn JS_ComputeThis(cx: *mut JSContext, vp: *mut Value, dest: *mut Value);
    pub fn JS_GetModuleHostDefinedField(module: *mut JSObject, dest: *mut Value);
    pub fn JS_GetPromiseResult(promise: HandleObject, dest: MutableHandleValue);
    pub fn JS_GetScriptPrivate(script: *mut JSScript, dest: MutableHandleValue);
    pub fn JS_GetModulePrivate(module: *mut JSObject, dest: MutableHandleValue);
    pub fn JS_THIS(cx: *mut JSContext, vp: *mut Value, dest: *mut Value);
    pub fn JS_GetNaNValue(cx: *mut JSContext, dest: *mut Value);
    pub fn JS_GetPositiveInfinityValue(cx: *mut JSContext, dest: *mut Value);
    pub fn JS_GetEmptyStringValue(cx: *mut JSContext, dest: *mut Value);
    pub fn JS_GetReservedSlot(obj: *mut JSObject, index: u32, dest: *mut Value);
    pub fn EncodeStringToUTF8(cx: *mut JSContext, str: HandleString, cb: fn(*const c_char));
    pub fn CreateJobQueue(traps: *const JobQueueTraps, queue: *const c_void) -> *mut JobQueue;
    pub fn DeleteJobQueue(queue: *mut JobQueue);
    pub fn CreateReadableStreamUnderlyingSource(
        traps: *const ReadableStreamUnderlyingSourceTraps,
        source: *const c_void,
    ) -> *mut ReadableStreamUnderlyingSource;
    pub fn DeleteReadableStreamUnderlyingSource(source: *mut ReadableStreamUnderlyingSource);
    pub fn CreateJSExternalStringCallbacks(
        traps: *const JSExternalStringCallbacksTraps,
        privateData: *const c_void,
    ) -> *mut JSExternalStringCallbacks;
    pub fn DeleteJSExternalStringCallbacks(callbacks: *mut JSExternalStringCallbacks);
    pub fn DispatchableRun(
        cx: *mut JSContext,
        ptr: *mut Dispatchable,
        mb: Dispatchable_MaybeShuttingDown,
    );
    pub fn StreamConsumerConsumeChunk(
        sc: *mut StreamConsumer,
        begin: *const u8,
        length: usize,
    ) -> bool;
    pub fn StreamConsumerStreamEnd(cx: *mut StreamConsumer);
    pub fn StreamConsumerStreamError(cx: *mut StreamConsumer, errorCode: usize);
    pub fn StreamConsumerNoteResponseURLs(
        sc: *mut StreamConsumer,
        maybeUrl: *const c_char,
        maybeSourceMapUrl: *const c_char,
    );
    pub fn DescribeScriptedCaller(
        cx: *mut JSContext,
        buffer: *mut u8,
        buflen: usize,
        line: *mut u32,
        col: *mut u32,
    ) -> bool;
    pub fn SetDataPropertyDescriptor(
        desc: MutableHandle<PropertyDescriptor>,
        value: HandleValue,
        attrs: u32,
    );
}
