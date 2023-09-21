/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#define __STDC_LIMIT_MACROS
#include <stdint.h>

#include <type_traits>

#include "js-config.h"

#ifdef JS_DEBUG
// A hack for MFBT. Guard objects need this to work.
#  define DEBUG 1
#endif

#include "assert.h"
#include "js/BuildId.h"
#include "js/Class.h"
#include "js/Id.h"
#include "js/MemoryMetrics.h"
#include "js/Modules.h"  // include for JS::GetModulePrivate
#include "js/Principals.h"
#include "js/Promise.h"
#include "js/Proxy.h"
#include "js/ScalarType.h"
#include "js/Stream.h"
#include "js/StructuredClone.h"
#include "js/Wrapper.h"
#include "js/experimental/JitInfo.h"
#include "js/experimental/JSStencil.h"
#include "js/experimental/TypedData.h"
#include "js/friend/ErrorMessages.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include "mozilla/Unused.h"

typedef bool (*WantToMeasure)(JSObject* obj);
typedef size_t (*GetSize)(JSObject* obj);

WantToMeasure gWantToMeasure = nullptr;

struct JobQueueTraps {
  JSObject* (*getIncumbentGlobal)(const void* queue, JSContext* cx);
  bool (*enqueuePromiseJob)(const void* queue, JSContext* cx,
                            JS::HandleObject promise, JS::HandleObject job,
                            JS::HandleObject allocationSite,
                            JS::HandleObject incumbentGlobal) = 0;
  bool (*empty)(const void* queue);
};

class RustJobQueue : public JS::JobQueue {
  JobQueueTraps mTraps;
  const void* mQueue;

 public:
  RustJobQueue(const JobQueueTraps& aTraps, const void* aQueue)
      : mTraps(aTraps), mQueue(aQueue) {}

  virtual JSObject* getIncumbentGlobal(JSContext* cx) {
    return mTraps.getIncumbentGlobal(mQueue, cx);
  }

  virtual bool enqueuePromiseJob(JSContext* cx, JS::HandleObject promise,
                                 JS::HandleObject job,
                                 JS::HandleObject allocationSite,
                                 JS::HandleObject incumbentGlobal) {
    return mTraps.enqueuePromiseJob(mQueue, cx, promise, job, allocationSite,
                                    incumbentGlobal);
  }

  virtual bool empty() const { return mTraps.empty(mQueue); }

  virtual void runJobs(JSContext* cx) {
    MOZ_ASSERT(false, "runJobs should not be invoked");
  }

 private:
  virtual js::UniquePtr<SavedJobQueue> saveJobQueue(JSContext* cx) {
    MOZ_ASSERT(false, "saveJobQueue should not be invoked");
    return nullptr;
  }
};

struct ReadableStreamUnderlyingSourceTraps {
  void (*requestData)(const void* source, JSContext* cx, JS::HandleObject stream,
                      size_t desiredSize);
  void (*writeIntoReadRequestBuffer)(const void* source, JSContext* cx,
                                     JS::HandleObject stream, JS::HandleObject chunk,
                                     size_t length, size_t* bytesWritten);
  void (*cancel)(const void* source, JSContext* cx, JS::HandleObject stream,
                 JS::HandleValue reason, JS::Value* resolve_to);
  void (*onClosed)(const void* source, JSContext* cx, JS::HandleObject stream);
  void (*onErrored)(const void* source, JSContext* cx, JS::HandleObject stream,
                    JS::HandleValue reason);
  void (*finalize)(JS::ReadableStreamUnderlyingSource* source);
};

class RustReadableStreamUnderlyingSource
    : public JS::ReadableStreamUnderlyingSource {
  ReadableStreamUnderlyingSourceTraps mTraps;
  const void* mSource;

 public:
  RustReadableStreamUnderlyingSource(
      const ReadableStreamUnderlyingSourceTraps& aTraps, const void* aSource)
      : mTraps(aTraps), mSource(aSource) {}

  virtual void requestData(JSContext* cx, JS::HandleObject stream,
                           size_t desiredSize) {
    return mTraps.requestData(mSource, cx, stream, desiredSize);
  }

  virtual void writeIntoReadRequestBuffer(JSContext* cx,
                                          JS::HandleObject stream, JS::HandleObject chunk,
                                          size_t length, size_t* bytesWritten) {
	return mTraps.writeIntoReadRequestBuffer(mSource, cx, stream, chunk,
                                             length, bytesWritten);
  }

  virtual JS::Value cancel(JSContext* cx, JS::HandleObject stream,
                           JS::HandleValue reason) {
    JS::Value resolve_to;
    mTraps.cancel(mSource, cx, stream, reason, &resolve_to);
    return resolve_to;
  }

  virtual void onClosed(JSContext* cx, JS::HandleObject stream) {
    return mTraps.onClosed(mSource, cx, stream);
  }

  virtual void onErrored(JSContext* cx, JS::HandleObject stream,
                         JS::HandleValue reason) {
    return mTraps.onErrored(mSource, cx, stream, reason);
  }

  virtual void finalize() { return mTraps.finalize(this); }
};

struct JSExternalStringCallbacksTraps {
  void (*finalize)(const void* privateData, char16_t* chars);
  size_t (*sizeOfBuffer)(const void* privateData, const char16_t* chars,
                         mozilla::MallocSizeOf mallocSizeOf);
};

class RustJSExternalStringCallbacks final : public JSExternalStringCallbacks {
  JSExternalStringCallbacksTraps mTraps;
  void* privateData;

 public:
  RustJSExternalStringCallbacks(const JSExternalStringCallbacksTraps& aTraps,
                                void* privateData)
      : mTraps(aTraps), privateData(privateData) {}

  void finalize(char16_t* chars) const override {
    return mTraps.finalize(privateData, chars);
  }

  size_t sizeOfBuffer(const char16_t* chars,
                      mozilla::MallocSizeOf mallocSizeOf) const override {
    return mTraps.sizeOfBuffer(privateData, chars, mallocSizeOf);
  }
};

struct ProxyTraps {
  bool (*enter)(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
                js::BaseProxyHandler::Action action, bool* bp);

  bool (*getOwnPropertyDescriptor)(
      JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
      JS::MutableHandle<JS::PropertyDescriptor> desc, bool *isNone);
  bool (*defineProperty)(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
                         JS::Handle<JS::PropertyDescriptor> desc,
                         JS::ObjectOpResult& result);
  bool (*ownPropertyKeys)(JSContext* cx, JS::HandleObject proxy,
                          JS::MutableHandleIdVector props);
  bool (*delete_)(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
                  JS::ObjectOpResult& result);

  bool (*enumerate)(JSContext* cx, JS::HandleObject proxy,
                    JS::MutableHandleIdVector props);

  bool (*getPrototypeIfOrdinary)(JSContext* cx, JS::HandleObject proxy,
                                 bool* isOrdinary,
                                 JS::MutableHandleObject protop);
  bool (*getPrototype)(JSContext* cx, JS::HandleObject proxy,
                       JS::MutableHandleObject protop);
  bool (*setPrototype)(JSContext* cx, JS::HandleObject proxy,
                       JS::HandleObject proto, JS::ObjectOpResult& result);
  bool (*setImmutablePrototype)(JSContext* cx, JS::HandleObject proxy,
                                bool* succeeded);

  bool (*preventExtensions)(JSContext* cx, JS::HandleObject proxy,
                            JS::ObjectOpResult& result);

  bool (*isExtensible)(JSContext* cx, JS::HandleObject proxy, bool* succeeded);

  bool (*has)(JSContext* cx, JS::HandleObject proxy, JS::HandleId id, bool* bp);
  bool (*get)(JSContext* cx, JS::HandleObject proxy, JS::HandleValue receiver,
              JS::HandleId id, JS::MutableHandleValue vp);
  bool (*set)(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
              JS::HandleValue v, JS::HandleValue receiver,
              JS::ObjectOpResult& result);

  bool (*call)(JSContext* cx, JS::HandleObject proxy, const JS::CallArgs& args);
  bool (*construct)(JSContext* cx, JS::HandleObject proxy,
                    const JS::CallArgs& args);

  bool (*hasOwn)(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
                 bool* bp);
  bool (*getOwnEnumerablePropertyKeys)(JSContext* cx, JS::HandleObject proxy,
                                       JS::MutableHandleIdVector props);
  bool (*nativeCall)(JSContext* cx, JS::IsAcceptableThis test,
                     JS::NativeImpl impl, JS::CallArgs args);
  bool (*objectClassIs)(JS::HandleObject obj, js::ESClass classValue,
                        JSContext* cx);
  const char* (*className)(JSContext* cx, JS::HandleObject proxy);
  JSString* (*fun_toString)(JSContext* cx, JS::HandleObject proxy,
                            bool isToString);
  // bool (*regexp_toShared)(JSContext *cx, JS::HandleObject proxy, RegExpGuard
  // *g);
  bool (*boxedValue_unbox)(JSContext* cx, JS::HandleObject proxy,
                           JS::MutableHandleValue vp);
  bool (*defaultValue)(JSContext* cx, JS::HandleObject obj, JSType hint,
                       JS::MutableHandleValue vp);
  void (*trace)(JSTracer* trc, JSObject* proxy);
  void (*finalize)(JS::GCContext *cx, JSObject* proxy);
  size_t (*objectMoved)(JSObject* proxy, JSObject* old);

  bool (*isCallable)(JSObject* obj);
  bool (*isConstructor)(JSObject* obj);

  // getElements

  // weakmapKeyDelegate
  // isScripted
};

static int HandlerFamily;

#define DEFER_TO_TRAP_OR_BASE_CLASS(_base)                                    \
                                                                              \
  /* Standard internal methods. */                                            \
  virtual bool enumerate(JSContext* cx, JS::HandleObject proxy,               \
                         JS::MutableHandleIdVector props) const override {    \
    return mTraps.enumerate ? mTraps.enumerate(cx, proxy, props)              \
                            : _base::enumerate(cx, proxy, props);             \
  }                                                                           \
                                                                              \
  virtual bool has(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,    \
                   bool* bp) const override {                                 \
    return mTraps.has ? mTraps.has(cx, proxy, id, bp)                         \
                      : _base::has(cx, proxy, id, bp);                        \
  }                                                                           \
                                                                              \
  virtual bool get(JSContext* cx, JS::HandleObject proxy,                     \
                   JS::HandleValue receiver, JS::HandleId id,                 \
                   JS::MutableHandleValue vp) const override {                \
    return mTraps.get ? mTraps.get(cx, proxy, receiver, id, vp)               \
                      : _base::get(cx, proxy, receiver, id, vp);              \
  }                                                                           \
                                                                              \
  virtual bool set(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,    \
                   JS::HandleValue v, JS::HandleValue receiver,               \
                   JS::ObjectOpResult& result) const override {               \
    return mTraps.set ? mTraps.set(cx, proxy, id, v, receiver, result)        \
                      : _base::set(cx, proxy, id, v, receiver, result);       \
  }                                                                           \
                                                                              \
  virtual bool call(JSContext* cx, JS::HandleObject proxy,                    \
                    const JS::CallArgs& args) const override {                \
    return mTraps.call ? mTraps.call(cx, proxy, args)                         \
                       : _base::call(cx, proxy, args);                        \
  }                                                                           \
                                                                              \
  virtual bool construct(JSContext* cx, JS::HandleObject proxy,               \
                         const JS::CallArgs& args) const override {           \
    return mTraps.construct ? mTraps.construct(cx, proxy, args)               \
                            : _base::construct(cx, proxy, args);              \
  }                                                                           \
                                                                              \
  /* Spidermonkey extensions. */                                              \
  virtual bool hasOwn(JSContext* cx, JS::HandleObject proxy, JS::HandleId id, \
                      bool* bp) const override {                              \
    return mTraps.hasOwn ? mTraps.hasOwn(cx, proxy, id, bp)                   \
                         : _base::hasOwn(cx, proxy, id, bp);                  \
  }                                                                           \
                                                                              \
  virtual bool getOwnEnumerablePropertyKeys(                                  \
      JSContext* cx, JS::HandleObject proxy, JS::MutableHandleIdVector props) \
      const override {                                                        \
    return mTraps.getOwnEnumerablePropertyKeys                                \
               ? mTraps.getOwnEnumerablePropertyKeys(cx, proxy, props)        \
               : _base::getOwnEnumerablePropertyKeys(cx, proxy, props);       \
  }                                                                           \
                                                                              \
  virtual bool nativeCall(JSContext* cx, JS::IsAcceptableThis test,           \
                          JS::NativeImpl impl, const JS::CallArgs& args)      \
      const override {                                                        \
    return mTraps.nativeCall ? mTraps.nativeCall(cx, test, impl, args)        \
                             : _base::nativeCall(cx, test, impl, args);       \
  }                                                                           \
                                                                              \
  virtual const char* className(JSContext* cx, JS::HandleObject proxy)        \
      const override {                                                        \
    return mTraps.className ? mTraps.className(cx, proxy)                     \
                            : _base::className(cx, proxy);                    \
  }                                                                           \
                                                                              \
  virtual JSString* fun_toString(JSContext* cx, JS::HandleObject proxy,       \
                                 bool isToString) const override {            \
    return mTraps.fun_toString ? mTraps.fun_toString(cx, proxy, isToString)   \
                               : _base::fun_toString(cx, proxy, isToString);  \
  }                                                                           \
                                                                              \
  virtual bool boxedValue_unbox(JSContext* cx, JS::HandleObject proxy,        \
                                JS::MutableHandleValue vp) const override {   \
    return mTraps.boxedValue_unbox ? mTraps.boxedValue_unbox(cx, proxy, vp)   \
                                   : _base::boxedValue_unbox(cx, proxy, vp);  \
  }                                                                           \
                                                                              \
  virtual void trace(JSTracer* trc, JSObject* proxy) const override {         \
    mTraps.trace ? mTraps.trace(trc, proxy) : _base::trace(trc, proxy);       \
  }                                                                           \
                                                                              \
  virtual void finalize(JS::GCContext* context, JSObject* proxy) const override { \
    mTraps.finalize ? mTraps.finalize(context, proxy)                         \
                    : _base::finalize(context, proxy);                        \
  }                                                                           \
                                                                              \
  virtual size_t objectMoved(JSObject* proxy, JSObject* old) const override { \
    return mTraps.objectMoved ? mTraps.objectMoved(proxy, old)                \
                              : _base::objectMoved(proxy, old);               \
  }                                                                           \
                                                                              \
  virtual bool isCallable(JSObject* obj) const override {                     \
    return mTraps.isCallable ? mTraps.isCallable(obj)                         \
                             : _base::isCallable(obj);                        \
  }                                                                           \
                                                                              \
  virtual bool isConstructor(JSObject* obj) const override {                  \
    return mTraps.isConstructor ? mTraps.isConstructor(obj)                   \
                                : _base::isConstructor(obj);                  \
  }                                                                           \
                                                                              \
  virtual bool getPrototype(JSContext* cx, JS::HandleObject proxy,            \
                            JS::MutableHandleObject protop) const override {  \
    return mTraps.getPrototype ? mTraps.getPrototype(cx, proxy, protop)       \
                               : _base::getPrototype(cx, proxy, protop);      \
  }                                                                           \
                                                                              \
  virtual bool setPrototype(JSContext* cx, JS::HandleObject proxy,            \
                            JS::HandleObject proto,                           \
                            JS::ObjectOpResult& result) const override {      \
    return mTraps.setPrototype                                                \
               ? mTraps.setPrototype(cx, proxy, proto, result)                \
               : _base::setPrototype(cx, proxy, proto, result);               \
  }                                                                           \
                                                                              \
  virtual bool setImmutablePrototype(JSContext* cx, JS::HandleObject proxy,   \
                                     bool* succeeded) const override {        \
    return mTraps.setImmutablePrototype                                       \
               ? mTraps.setImmutablePrototype(cx, proxy, succeeded)           \
               : _base::setImmutablePrototype(cx, proxy, succeeded);          \
  }

class WrapperProxyHandler : public js::Wrapper {
  ProxyTraps mTraps;

 public:
  WrapperProxyHandler(const ProxyTraps& aTraps)
      : js::Wrapper(0), mTraps(aTraps) {}

  virtual bool finalizeInBackground(const JS::Value& priv) const override {
    return false;
  }

  DEFER_TO_TRAP_OR_BASE_CLASS(js::Wrapper)

  virtual bool getOwnPropertyDescriptor(
      JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
      JS::MutableHandle<mozilla::Maybe<JS::PropertyDescriptor>> desc) const override {
    if (mTraps.getOwnPropertyDescriptor) {
      JS::Rooted<JS::PropertyDescriptor> pd(cx);
      bool isNone = true;
      bool result = mTraps.getOwnPropertyDescriptor(cx, proxy, id, &pd, &isNone);
      if (isNone) {
        desc.set(mozilla::Nothing());
      } else {
        desc.set(mozilla::Some(pd.get()));
      }
      return result;
    }
    return js::Wrapper::getOwnPropertyDescriptor(cx, proxy, id, desc);
  }

  virtual bool defineProperty(JSContext* cx, JS::HandleObject proxy,
                              JS::HandleId id,
                              JS::Handle<JS::PropertyDescriptor> desc,
                              JS::ObjectOpResult& result) const override {
    return mTraps.defineProperty
               ? mTraps.defineProperty(cx, proxy, id, desc, result)
               : js::Wrapper::defineProperty(cx, proxy, id, desc, result);
  }

  virtual bool ownPropertyKeys(JSContext* cx, JS::HandleObject proxy,
                               JS::MutableHandleIdVector props) const override {
    return mTraps.ownPropertyKeys
               ? mTraps.ownPropertyKeys(cx, proxy, props)
               : js::Wrapper::ownPropertyKeys(cx, proxy, props);
  }

  virtual bool delete_(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
                       JS::ObjectOpResult& result) const override {
    return mTraps.delete_ ? mTraps.delete_(cx, proxy, id, result)
                          : js::Wrapper::delete_(cx, proxy, id, result);
  }

  virtual bool preventExtensions(JSContext* cx, JS::HandleObject proxy,
                                 JS::ObjectOpResult& result) const override {
    return mTraps.preventExtensions
               ? mTraps.preventExtensions(cx, proxy, result)
               : js::Wrapper::preventExtensions(cx, proxy, result);
  }

  virtual bool isExtensible(JSContext* cx, JS::HandleObject proxy,
                            bool* succeeded) const override {
    return mTraps.isExtensible
               ? mTraps.isExtensible(cx, proxy, succeeded)
               : js::Wrapper::isExtensible(cx, proxy, succeeded);
  }
};

class ForwardingProxyHandler : public js::BaseProxyHandler {
  ProxyTraps mTraps;
  const void* mExtra;

 public:
  ForwardingProxyHandler(const ProxyTraps& aTraps, const void* aExtra)
      : js::BaseProxyHandler(&HandlerFamily), mTraps(aTraps), mExtra(aExtra) {}

  const void* getExtra() const { return mExtra; }

  virtual bool finalizeInBackground(const JS::Value& priv) const override {
    return false;
  }

  DEFER_TO_TRAP_OR_BASE_CLASS(BaseProxyHandler)

  virtual bool getOwnPropertyDescriptor(
      JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
      JS::MutableHandle<mozilla::Maybe<JS::PropertyDescriptor>> desc) const override {
    JS::Rooted<JS::PropertyDescriptor> pd(cx);
    bool isNone = true;
    bool result = mTraps.getOwnPropertyDescriptor(cx, proxy, id, &pd, &isNone);
    if (isNone) {
      desc.set(mozilla::Nothing());
    } else {
      desc.set(mozilla::Some(pd.get()));
    }
    return result;
    return result;
  }

  virtual bool defineProperty(JSContext* cx, JS::HandleObject proxy,
                              JS::HandleId id,
                              JS::Handle<JS::PropertyDescriptor> desc,
                              JS::ObjectOpResult& result) const override {
    return mTraps.defineProperty(cx, proxy, id, desc, result);
  }

  virtual bool ownPropertyKeys(JSContext* cx, JS::HandleObject proxy,
                               JS::MutableHandleIdVector props) const override {
    return mTraps.ownPropertyKeys(cx, proxy, props);
  }

  virtual bool delete_(JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
                       JS::ObjectOpResult& result) const override {
    return mTraps.delete_(cx, proxy, id, result);
  }

  virtual bool getPrototypeIfOrdinary(
      JSContext* cx, JS::HandleObject proxy, bool* isOrdinary,
      JS::MutableHandleObject protop) const override {
    return mTraps.getPrototypeIfOrdinary(cx, proxy, isOrdinary, protop);
  }

  virtual bool preventExtensions(JSContext* cx, JS::HandleObject proxy,
                                 JS::ObjectOpResult& result) const override {
    return mTraps.preventExtensions(cx, proxy, result);
  }

  virtual bool isExtensible(JSContext* cx, JS::HandleObject proxy,
                            bool* succeeded) const override {
    return mTraps.isExtensible(cx, proxy, succeeded);
  }
};

class ServoDOMVisitor : public JS::ObjectPrivateVisitor {
 public:
  size_t sizeOfIncludingThis(nsISupports* aSupports) {
    JSObject* obj = (JSObject*)aSupports;
    size_t result = 0;

    if (get_size != nullptr && obj != nullptr) {
      result = (*get_size)(obj);
    }

    return result;
  }

  GetSize get_size;

  ServoDOMVisitor(GetSize gs, GetISupportsFun getISupports)
      : ObjectPrivateVisitor(getISupports), get_size(gs) {}
};

struct JSPrincipalsCallbacks {
  bool (*write)(JSPrincipals*, JSContext* cx, JSStructuredCloneWriter* writer);
  bool (*isSystemOrAddonPrincipal)(JSPrincipals*);
};

class RustJSPrincipals final : public JSPrincipals {
  JSPrincipalsCallbacks callbacks;
  void* privateData;

 public:
  RustJSPrincipals(const JSPrincipalsCallbacks& callbacks, void* privateData)
      : JSPrincipals{}, callbacks{callbacks}, privateData{privateData} {}

  void* getPrivateData() const { return this->privateData; }

  bool write(JSContext* cx, JSStructuredCloneWriter* writer) override {
    return this->callbacks.write ? this->callbacks.write(this, cx, writer)
                                 : false;
  }

  bool isSystemOrAddonPrincipal() override {
    return this->callbacks.isSystemOrAddonPrincipal(this);
  }
};

bool ShouldMeasureObject(JSObject* obj, nsISupports** iface) {
  if (obj == nullptr) {
    return false;
  }

  bool want_to_measure = (*gWantToMeasure)(obj);

  if (want_to_measure) {
    *iface = (nsISupports*)obj;
    return true;
  }
  return false;
}

extern "C" {

JSPrincipals* CreateRustJSPrincipals(const JSPrincipalsCallbacks& callbacks,
                                     void* privateData) {
  return new RustJSPrincipals(callbacks, privateData);
}

void DestroyRustJSPrincipals(JSPrincipals* principals) {
  delete static_cast<RustJSPrincipals*>(principals);
}

void* GetRustJSPrincipalsPrivate(JSPrincipals* principals) {
  return principals
             ? static_cast<RustJSPrincipals*>(principals)->getPrivateData()
             : nullptr;
}

bool InvokeGetOwnPropertyDescriptor(
    const void* handler, JSContext* cx, JS::HandleObject proxy, JS::HandleId id,
    JS::MutableHandle<JS::PropertyDescriptor> desc, bool *isNone) {
  JS::Rooted<mozilla::Maybe<JS::PropertyDescriptor>> mpd(cx);
  bool result = static_cast<const ForwardingProxyHandler*>(handler)
      ->getOwnPropertyDescriptor(cx, proxy, id, &mpd);
  *isNone = mpd.isNothing();
  if (!*isNone) {
    desc.set(*mpd);
  }
  return result;
}

bool InvokeHasOwn(const void* handler, JSContext* cx, JS::HandleObject proxy,
                  JS::HandleId id, bool* bp) {
  return static_cast<const js::BaseProxyHandler*>(handler)->hasOwn(cx, proxy,
                                                                   id, bp);
}

void RUST_JS_NumberValue(double d, JS::Value* dest) {
  *dest = JS_NumberValue(d);
}

const JSJitInfo* RUST_FUNCTION_VALUE_TO_JITINFO(JS::Value v) {
  return FUNCTION_VALUE_TO_JITINFO(v);
}

JS::CallArgs CreateCallArgsFromVp(unsigned argc, JS::Value* vp) {
  return JS::CallArgsFromVp(argc, vp);
}

bool CallJitGetterOp(const JSJitInfo* info, JSContext* cx,
                     JS::HandleObject thisObj, void* specializedThis,
                     unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  return info->getter(cx, thisObj, specializedThis, JSJitGetterCallArgs(args));
}

bool CallJitSetterOp(const JSJitInfo* info, JSContext* cx,
                     JS::HandleObject thisObj, void* specializedThis,
                     unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  return info->setter(cx, thisObj, specializedThis, JSJitSetterCallArgs(args));
}

bool CallJitMethodOp(const JSJitInfo* info, JSContext* cx,
                     JS::HandleObject thisObj, void* specializedThis,
                     uint32_t argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  return info->method(cx, thisObj, specializedThis, JSJitMethodCallArgs(args));
}

const void* CreateProxyHandler(const ProxyTraps* aTraps, const void* aExtra) {
  return new ForwardingProxyHandler(*aTraps, aExtra);
}

const void* CreateWrapperProxyHandler(const ProxyTraps* aTraps) {
  return new WrapperProxyHandler(*aTraps);
}

const void* GetCrossCompartmentWrapper() {
  return &js::CrossCompartmentWrapper::singleton;
}

const void* GetSecurityWrapper() {
  return &js::CrossCompartmentSecurityWrapper::singleton;
}

void DeleteCompileOptions(JS::ReadOnlyCompileOptions* aOpts) {
  delete static_cast<JS::OwningCompileOptions*>(aOpts);
}

JS::ReadOnlyCompileOptions* NewCompileOptions(JSContext* aCx, const char* aFile,
                                              unsigned aLine) {
  JS::CompileOptions opts(aCx);
  opts.setFileAndLine(aFile, aLine);

  JS::OwningCompileOptions* owned = new JS::OwningCompileOptions(aCx);
  if (!owned) {
    return nullptr;
  }

  if (!owned->copy(aCx, opts)) {
    DeleteCompileOptions(owned);
    return nullptr;
  }

  return owned;
}

JSObject* NewProxyObject(JSContext* aCx, const void* aHandler,
                         JS::HandleValue aPriv, JSObject* proto,
                         const JSClass* aClass, bool aLazyProto) {
  js::ProxyOptions options;
  if (aClass) {
    options.setClass(aClass);
  }
  options.setLazyProto(aLazyProto);
  return js::NewProxyObject(aCx, (js::BaseProxyHandler*)aHandler, aPriv, proto,
                            options);
}

JSObject* WrapperNew(JSContext* aCx, JS::HandleObject aObj,
                     const void* aHandler, const JSClass* aClass) {
  js::WrapperOptions options;
  if (aClass) {
    options.setClass(aClass);
  }

  return js::Wrapper::New(aCx, aObj, (const js::Wrapper*)aHandler, options);
}

const JSClass WindowProxyClass = PROXY_CLASS_DEF(
    "Proxy", JSCLASS_HAS_RESERVED_SLOTS(1)); /* additional class flags */

const JSClass* GetWindowProxyClass() { return &WindowProxyClass; }

JSObject* NewWindowProxy(JSContext* aCx, JS::HandleObject aObj,
                         const void* aHandler) {
  return WrapperNew(aCx, aObj, aHandler, &WindowProxyClass);
}

void GetProxyReservedSlot(JSObject* obj, uint32_t slot, JS::Value* dest) {
  *dest = js::GetProxyReservedSlot(obj, slot);
}

void GetProxyPrivate(JSObject* obj, JS::Value* dest) {
  *dest = js::GetProxyPrivate(obj);
}

void SetProxyReservedSlot(JSObject* obj, uint32_t slot, const JS::Value* val) {
  js::SetProxyReservedSlot(obj, slot, *val);
}

void SetProxyPrivate(JSObject* obj, const JS::Value* expando) {
  js::SetProxyPrivate(obj, *expando);
}

bool RUST_JSID_IS_INT(JS::HandleId id) { return id.isInt(); }

void int_to_jsid(int32_t i, JS::MutableHandleId id) { id.set(jsid::Int(i)); }

int32_t RUST_JSID_TO_INT(JS::HandleId id) { return id.toInt(); }

bool RUST_JSID_IS_STRING(JS::HandleId id) { return id.isString(); }

JSString* RUST_JSID_TO_STRING(JS::HandleId id) { return id.toString(); }

void RUST_SYMBOL_TO_JSID(JS::Symbol* sym, JS::MutableHandleId id) {
  id.set(jsid::Symbol(sym));
}

bool RUST_JSID_IS_VOID(JS::HandleId id) { return id.isVoid(); }

bool SetBuildId(JS::BuildIdCharVector* buildId, const char* chars, size_t len) {
  buildId->clear();
  return buildId->append(chars, len);
}

void RUST_SET_JITINFO(JSFunction* func, const JSJitInfo* info) {
  SET_JITINFO(func, info);
}

void RUST_INTERNED_STRING_TO_JSID(JSContext* cx, JSString* str,
                                  JS::MutableHandleId id) {
  id.set(JS::PropertyKey::fromPinnedString(str));
}

const JSErrorFormatString* RUST_js_GetErrorMessage(void* userRef,
                                                   uint32_t errorNumber) {
  return js::GetErrorMessage(userRef, errorNumber);
}

bool IsProxyHandlerFamily(JSObject* obj) {
  auto family = js::GetProxyHandler(obj)->family();
  return family == &HandlerFamily;
}

const void* GetProxyHandlerFamily() { return &HandlerFamily; }

const void* GetProxyHandlerExtra(JSObject* obj) {
  const js::BaseProxyHandler* handler = js::GetProxyHandler(obj);
  assert(handler->family() == &HandlerFamily);
  return static_cast<const ForwardingProxyHandler*>(handler)->getExtra();
}

const void* GetProxyHandler(JSObject* obj) {
  const js::BaseProxyHandler* handler = js::GetProxyHandler(obj);
  assert(handler->family() == &HandlerFamily);
  return handler;
}

void ReportErrorASCII(JSContext* aCx, const char* aError) {
#ifdef DEBUG
  for (const char* p = aError; *p; ++p) {
    assert(*p != '%');
  }
#endif
  JS_ReportErrorASCII(aCx, "%s", aError);
}

void ReportErrorUTF8(JSContext* aCx, const char* aError) {
#ifdef DEBUG
  for (const char* p = aError; *p; ++p) {
    assert(*p != '%');
  }
#endif
  JS_ReportErrorUTF8(aCx, "%s", aError);
}

bool IsWrapper(JSObject* obj) { return js::IsWrapper(obj); }

JSObject* UnwrapObjectStatic(JSObject* obj) {
  return js::CheckedUnwrapStatic(obj);
}

JSObject* UnwrapObjectDynamic(JSObject* obj, JSContext* cx, bool stopAtWindowProxy) {
  return js::CheckedUnwrapDynamic(obj, cx, stopAtWindowProxy);
}

JSObject* UncheckedUnwrapObject(JSObject* obj, bool stopAtWindowProxy) {
  return js::UncheckedUnwrap(obj, stopAtWindowProxy);
}

JS::PersistentRootedIdVector* CreateRootedIdVector(JSContext* cx) {
  return new JS::PersistentRootedIdVector(cx);
}

void* GetIdVectorAddress(JS::PersistentRootedIdVector* v) {
  return v->address();
}

const jsid* SliceRootedIdVector(const JS::PersistentRootedIdVector* v,
                                size_t* length) {
  *length = v->length();
  return v->begin();
}

bool AppendToIdVector(JS::MutableHandleIdVector v, JS::HandleId id) {
  return v.append(id.get());
}

void DestroyRootedIdVector(JS::PersistentRootedIdVector* v) { delete v; }

JS::PersistentRootedObjectVector* CreateRootedObjectVector(JSContext* aCx) {
  JS::PersistentRootedObjectVector* vec =
      new JS::PersistentRootedObjectVector(aCx);
  return vec;
}

void* GetObjectVectorAddress(JS::PersistentRootedObjectVector* v) {
  return v->address();
}

bool AppendToRootedObjectVector(JS::PersistentRootedObjectVector* v,
                                JSObject* obj) {
  return v->append(obj);
}

void DeleteRootedObjectVector(JS::PersistentRootedObjectVector* v) { delete v; }

#if defined(__linux__)
#  include <malloc.h>
#elif defined(__APPLE__)
#  include <malloc/malloc.h>
#elif defined(__MINGW32__) || defined(__MINGW64__)
// nothing needed here
#elif defined(_MSC_VER)
// nothing needed here
#else
#  error "unsupported platform"
#endif

// SpiderMonkey-in-Rust currently uses system malloc, not jemalloc.
static size_t MallocSizeOf(const void* aPtr) {
#if defined(__linux__)
  return malloc_usable_size((void*)aPtr);
#elif defined(__APPLE__)
  return malloc_size((void*)aPtr);
#elif defined(__MINGW32__) || defined(__MINGW64__)
  return _msize((void*)aPtr);
#elif defined(_MSC_VER)
  return _msize((void*)aPtr);
#else
#  error "unsupported platform"
#endif
}

bool CollectServoSizes(JSContext* cx, JS::ServoSizes* sizes, GetSize gs) {
  mozilla::PodZero(sizes);

  ServoDOMVisitor sdv(gs, ShouldMeasureObject);

  return JS::AddServoSizeOf(cx, MallocSizeOf, &sdv, sizes);
}

void InitializeMemoryReporter(WantToMeasure wtm) { gWantToMeasure = wtm; }

// Expose templated functions for tracing

void CallValueTracer(JSTracer* trc, JS::Heap<JS::Value>* valuep,
                     const char* name) {
  JS::TraceEdge(trc, valuep, name);
}

void CallIdTracer(JSTracer* trc, JS::Heap<jsid>* idp, const char* name) {
  JS::TraceEdge(trc, idp, name);
}

void CallObjectTracer(JSTracer* trc, JS::Heap<JSObject*>* objp,
                      const char* name) {
  JS::TraceEdge(trc, objp, name);
}

void CallStringTracer(JSTracer* trc, JS::Heap<JSString*>* strp,
                      const char* name) {
  JS::TraceEdge(trc, strp, name);
}

void CallSymbolTracer(JSTracer* trc, JS::Heap<JS::Symbol*>* bip,
                      const char* name) {
  JS::TraceEdge(trc, bip, name);
}

void CallBigIntTracer(JSTracer* trc, JS::Heap<JS::BigInt*>* bip,
                      const char* name) {
  JS::TraceEdge(trc, bip, name);
}

void CallScriptTracer(JSTracer* trc, JS::Heap<JSScript*>* scriptp,
                      const char* name) {
  JS::TraceEdge(trc, scriptp, name);
}

void CallFunctionTracer(JSTracer* trc, JS::Heap<JSFunction*>* funp,
                        const char* name) {
  JS::TraceEdge(trc, funp, name);
}

void CallUnbarrieredObjectTracer(JSTracer* trc, JSObject** objp,
                                 const char* name) {
  js::UnsafeTraceManuallyBarrieredEdge(trc, objp, name);
}

void CallObjectRootTracer(JSTracer* trc, JSObject** objp, const char* name) {
  JS::TraceRoot(trc, objp, name);
}

void CallValueRootTracer(JSTracer* trc, JS::Value* valp, const char* name) {
  JS::TraceRoot(trc, valp, name);
}

bool IsDebugBuild() {
#ifdef JS_DEBUG
  return true;
#else
  return false;
#endif
}

#define JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Type, type)                    \
  void Get##Type##ArrayLengthAndData(JSObject* obj, size_t* length,       \
                                     bool* isSharedMemory, type** data) { \
    js::Get##Type##ArrayLengthAndData(obj, length, isSharedMemory, data); \
  }

JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Int8, int8_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Uint8, uint8_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Uint8Clamped, uint8_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Int16, int16_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Uint16, uint16_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Int32, int32_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Uint32, uint32_t)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Float32, float)
JS_DEFINE_DATA_AND_LENGTH_ACCESSOR(Float64, double)

#undef JS_DEFINE_DATA_AND_LENGTH_ACCESSOR

JSAutoStructuredCloneBuffer* NewJSAutoStructuredCloneBuffer(
    JS::StructuredCloneScope scope,
    const JSStructuredCloneCallbacks* callbacks) {
  return js_new<JSAutoStructuredCloneBuffer>(scope, callbacks, nullptr);
}

void DeleteJSAutoStructuredCloneBuffer(JSAutoStructuredCloneBuffer* buf) {
  js_delete(buf);
}

size_t GetLengthOfJSStructuredCloneData(JSStructuredCloneData* data) {
  assert(data != nullptr);
  return data->Size();
}

void CopyJSStructuredCloneData(JSStructuredCloneData* src, uint8_t* dest) {
  assert(src != nullptr);
  assert(dest != nullptr);

  size_t bytes_copied = 0;

  src->ForEachDataChunk([&](const char* aData, size_t aSize) {
    memcpy(dest + bytes_copied, aData, aSize);
    bytes_copied += aSize;
    return true;
  });
}

bool WriteBytesToJSStructuredCloneData(const uint8_t* src, size_t len,
                                       JSStructuredCloneData* dest) {
  assert(src != nullptr);
  assert(dest != nullptr);

  return dest->AppendBytes(reinterpret_cast<const char*>(src), len);
}

// MSVC uses a different calling conventions for functions
// that return non-POD values. Unfortunately, this includes anything
// with a constructor, such as JS::Value, so we can't call these
// from Rust. These wrapper functions are only here to
// ensure the calling convention is right.
// https://docs.microsoft.com/en-us/cpp/build/return-values-cpp
// https://mozilla.logbot.info/jsapi/20180622#c14918658

void JS_GetPromiseResult(JS::HandleObject promise,
                         JS::MutableHandleValue dest) {
  dest.set(JS::GetPromiseResult(promise));
}

void JS_GetScriptPrivate(JSScript* script, JS::MutableHandleValue dest) {
  dest.set(JS::GetScriptPrivate(script));
}

void JS_GetModulePrivate(JSObject* module, JS::MutableHandleValue dest) {
  dest.set(JS::GetModulePrivate(module));
}

void JS_GetNaNValue(JSContext* cx, JS::Value* dest) { *dest = JS::NaNValue(); }

void JS_GetPositiveInfinityValue(JSContext* cx, JS::Value* dest) {
  *dest = JS::InfinityValue();
}

void JS_GetEmptyStringValue(JSContext* cx, JS::Value* dest) {
  *dest = JS_GetEmptyStringValue(cx);
}

void JS_GetReservedSlot(JSObject* obj, uint32_t index, JS::Value* dest) {
  *dest = JS::GetReservedSlot(obj, index);
}

// keep this in sync with EncodedStringCallback in glue.rs
typedef void (*EncodedStringCallback)(const char*);

void EncodeStringToUTF8(JSContext* cx, JS::HandleString str,
                        EncodedStringCallback cb) {
  JS::UniqueChars chars = JS_EncodeStringToUTF8(cx, str);
  cb(chars.get());
}

JSString* JS_ForgetStringLinearness(JSLinearString* str) {
  return JS_FORGET_STRING_LINEARNESS(str);
}

JS::JobQueue* CreateJobQueue(const JobQueueTraps* aTraps, const void* aQueue) {
  return new RustJobQueue(*aTraps, aQueue);
}

void DeleteJobQueue(JS::JobQueue* queue) { delete queue; }

JS::ReadableStreamUnderlyingSource* CreateReadableStreamUnderlyingSource(
    const ReadableStreamUnderlyingSourceTraps* aTraps, const void* aSource) {
  return new RustReadableStreamUnderlyingSource(*aTraps, aSource);
}

void DeleteReadableStreamUnderlyingSource(
    JS::ReadableStreamUnderlyingSource* source) {
  delete source;
}

JSExternalStringCallbacks* CreateJSExternalStringCallbacks(
    const JSExternalStringCallbacksTraps* aTraps, void* privateData) {
  return new RustJSExternalStringCallbacks(*aTraps, privateData);
}

void DeleteJSExternalStringCallbacks(JSExternalStringCallbacks* callbacks) {
  delete static_cast<RustJSExternalStringCallbacks*>(callbacks);
}

void DispatchableRun(JSContext* cx, JS::Dispatchable* ptr,
                     JS::Dispatchable::MaybeShuttingDown mb) {
  ptr->run(cx, mb);
}

bool StreamConsumerConsumeChunk(JS::StreamConsumer* sc, const uint8_t* begin,
                                size_t length) {
  return sc->consumeChunk(begin, length);
}

void StreamConsumerStreamEnd(JS::StreamConsumer* sc) { sc->streamEnd(); }

void StreamConsumerStreamError(JS::StreamConsumer* sc, size_t errorCode) {
  sc->streamError(errorCode);
}

void StreamConsumerNoteResponseURLs(JS::StreamConsumer* sc,
                                    const char* maybeUrl,
                                    const char* maybeSourceMapUrl) {
  sc->noteResponseURLs(maybeUrl, maybeSourceMapUrl);
}

bool DescribeScriptedCaller(JSContext* cx, char* buffer, size_t buflen,
                            uint32_t* line, uint32_t* col) {
  JS::AutoFilename filename;
  if (!JS::DescribeScriptedCaller(cx, &filename, line, col)) {
    return false;
  }
  strncpy(buffer, filename.get(), buflen);
  return true;
}

void SetDataPropertyDescriptor(
  JS::MutableHandle<JS::PropertyDescriptor> desc,
  JS::HandleValue value,
  uint32_t attrs
) {
  desc.set(JS::PropertyDescriptor::Data(value, attrs));
}

void SetAccessorPropertyDescriptor(
    JS::MutableHandle<JS::PropertyDescriptor> desc,
    JS::HandleObject getter,
    JS::HandleObject setter,
    uint32_t attrs
) {
  desc.set(JS::PropertyDescriptor::Accessor(getter, setter, attrs));
}

void FinishOffThreadStencil(
  JSContext* cx,
  JS::OffThreadToken* token,
  JS::InstantiationStorage* storage,
  already_AddRefed<JS::Stencil>* stencil
) {
  already_AddRefed<JS::Stencil> retval = JS::FinishOffThreadStencil(cx, token, storage);
  *stencil = std::move(retval);
}

}  // extern "C"
