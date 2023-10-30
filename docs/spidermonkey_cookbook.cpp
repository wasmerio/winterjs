// Cookbook with various examples.
// Taken from https://github.com/mozilla-spidermonkey/spidermonkey-embedding-examples

#include <cassert>
#include <iostream>

#include <jsapi.h>

#include <mozilla/Unused.h>

#include <js/Array.h>
#include <js/CompilationAndEvaluation.h>
#include <js/Conversions.h>
#include <js/Initialization.h>
#include <js/Object.h>
#include <js/SourceText.h>
#include <js/ValueArray.h>

#include "boilerplate.h"

// This example program shows the SpiderMonkey JSAPI equivalent for a handful
// of common JavaScript idioms.

/**** BASICS ******************************************************************/

///// Working with Values //////////////////////////////////////////////////////

/* The basic, undifferentiated value type in the JSAPI is `JS::Value`.
 * To query whether a value has a particular type, use a correspondingly named
 * member testing function:
 *
 * // JavaScript
 * var isString = typeof v === "string";
 * var isNumber = typeof v === "number";
 * var isNull = v === null;
 * var isBoolean = typeof v === "boolean";
 * var isObject = typeof v === "object" && v !== null;
 * var isSymbol = typeof v === "symbol";
 * var isFunction = typeof v === "function";
 * var isUndefined = typeof v === "undefined";
 */
static void GetTypeOfValue(JSContext* cx, JS::HandleValue v) {
  bool isString = v.isString();
  bool isNumber = v.isNumber();
  bool isInt32 =
      v.isInt32();  // NOTE: Internal representation, not numeric value
  bool isNull = v.isNull();
  bool isBoolean = v.isBoolean();
  bool isObject =
      v.isObject();  // NOTE: not broken like typeof === "object" is :-)
  bool isSymbol = v.isSymbol();
  bool isFunction = v.isObject() && JS::IsCallable(&v.toObject());
  bool isUndefined = v.isUndefined();

  // Avoid compiler warnings
  mozilla::Unused << isString;
  mozilla::Unused << isNumber;
  mozilla::Unused << isInt32;
  mozilla::Unused << isNull;
  mozilla::Unused << isBoolean;
  mozilla::Unused << isObject;
  mozilla::Unused << isSymbol;
  mozilla::Unused << isFunction;
  mozilla::Unused << isUndefined;
}

/* To set a value use a correspondingly named member mutator function, or assign
 * the result of the correspondingly named standalone function:
 *
 * // JavaScript
 * var v;
 *
 * v = 0;
 * v = 0.5;
 * v = someString;
 * v = null;
 * v = undefined;
 * v = false;
 * v = {};
 * v = new Symbol(someString);
 */
static bool SetValue(JSContext* cx) {
  JS::RootedValue v(cx);
  JS::RootedString someString(cx, JS_NewStringCopyZ(cx, "my string"));
  if (!someString) return false;
  JS::RootedObject obj(cx, JS_NewPlainObject(cx));
  if (!obj) return false;
  JS::RootedSymbol symbol(cx, JS::NewSymbol(cx, someString));
  if (!symbol) return false;

  v.setInt32(0);
  v.setDouble(0.5);
  v.setNumber(0u);
  v.setNumber(0.5);
  v.setString(someString);
  v.setNull();
  v.setUndefined();
  v.setBoolean(false);
  v.setObject(*obj);
  v.setSymbol(symbol);

  // or:

  v = JS::Int32Value(0);
  v = JS::DoubleValue(0.5);
  v = JS::NumberValue(0);
  v = JS::NumberValue(0.5);
  v = JS::StringValue(someString);
  v = JS::NullValue();
  v = JS::UndefinedValue();
  v = JS::BooleanValue(false);
  v = JS::ObjectValue(*obj);
  v = JS::SymbolValue(symbol);

  return true;
}

///// Finding the global object ////////////////////////////////////////////////

/* Sometimes in a C++ function called from JavaScript, you will need to have
 * access to the global object.
 *
 * // JavaScript
 * var global = this;
 *
 * There is a function, JS::CurrentGlobalOrNull(cx), that makes a best guess,
 * and sometimes that is the best that can be done.
 * But in a JSNative the correct way to do this is:
 */
static bool FindGlobalObject(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  JS::RootedObject global(cx, JS::GetNonCCWObjectGlobal(&args.callee()));
  if (!global) return false;

  // For comparison, here's how to do it with JS::CurrentGlobalOrNull():
  JS::RootedObject global2(cx, JS::CurrentGlobalOrNull(cx));

  if (global != global2) {
    JS_ReportErrorASCII(cx, "Globals did not agree");
    return false;
  }

  return true;
}

///// Defining a function //////////////////////////////////////////////////////

/* // JavaScript
 * function justForFun() {
 *     return null;
 * }
 *
 * To define many JSAPI functions at once, use JS_DefineFunctions().
 */
static bool JustForFun(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  args.rval().setNull();
  return true;
}

/* Add this to your JSContext setup code.
 * This makes your C++ function visible as a global function in JavaScript.
 */
static bool DefineGlobalFunction(JSContext* cx, JS::HandleObject global) {
  if (!JS_DefineFunction(cx, global, "justForFun", &JustForFun, 0, 0))
    return false;

  // Really, "if (!x) return false; else return true;" is bad style, just
  // "return x;" instead, but normally you might have other code between the
  // "return false" and "return true".
  return true;
}

///// Creating an array ////////////////////////////////////////////////////////

/* // JavaScript
 * var x = [];  // or "x = Array()", or "x = new Array"
 */
static bool CreateArray(JSContext* cx) {
  JS::RootedObject x(cx, JS::NewArrayObject(cx, 0));
  if (!x) return false;

  return true;
}

///// Creating an object ///////////////////////////////////////////////////////

/* // JavaScript
 * var x = {};  // or "x = Object()", or "x = new Object"
 */
static bool CreateObject(JSContext* cx) {
  JS::RootedObject x(cx, JS_NewPlainObject(cx));
  if (!x) return false;

  // or:
  x = JS_NewObject(cx, /* clasp = */ nullptr);
  if (!x) return false;

  return true;
}

///// Constructing an object with new //////////////////////////////////////////

/* // JavaScript
 * var person = new Person("Dave", 24);
 *
 * It looks so simple in JavaScript, but a JSAPI application has to do three
 * things here:
 *
 * - look up the constructor, Person
 * - prepare the arguments ("Dave", 24)
 * - call JS::Construct to simulate the new keyword
 */
static bool ConstructObjectWithNew(JSContext* cx, JS::HandleObject global) {
  // Step 1 - Get the value of `Person` and check that it is an object.
  JS::RootedValue constructor_val(cx);
  if (!JS_GetProperty(cx, global, "Person", &constructor_val)) return false;
  if (!constructor_val.isObject()) {
    JS_ReportErrorASCII(cx, "Person is not a constructor");
    return false;
  }
  JS::RootedObject constructor(cx, &constructor_val.toObject());

  // Step 2 - Set up the arguments.
  JS::RootedString name_str(cx, JS_NewStringCopyZ(cx, "Dave"));
  if (!name_str) return false;

  JS::RootedValueArray<2> args(cx);
  args[0].setString(name_str);
  args[1].setInt32(24);

  // Step 3 - Call `new Person(...args)`, passing the arguments.
  JS::RootedObject obj(cx);
  if (!JS::Construct(cx, constructor_val, args, &obj)) return false;
  if (!obj) return false;

  // (If your constructor doesn't take any arguments, you can skip the second
  // step and call step 3 like this:)
  if (!JS::Construct(cx, constructor_val, JS::HandleValueArray::empty(), &obj))
    return false;

  return true;
}

static bool PersonConstructor(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  JS::RootedObject newObject(cx, JS_NewPlainObject(cx));
  if (!newObject) return false;
  args.rval().setObject(*newObject);
  return true;
}

///// Calling a global JS function /////////////////////////////////////////////

/* // JavaScript
 * var r = foo();  // where f is a global function
 *
 * Suppose the script defines a global JavaScript
 * function foo() and we want to call it from C.
 */
static bool CallGlobalFunction(JSContext* cx, JS::HandleObject global) {
  JS::RootedValue r(cx);
  if (!JS_CallFunctionName(cx, global, "foo", JS::HandleValueArray::empty(),
                           &r)) {
    return false;
  }

  return true;
}

///// Calling a JS function via a local variable ///////////////////////////////

/* // JavaScript
 * var r = f();  // where f is a local variable
 *
 * Suppose f is a local C variable of type JS::Value.
 */
static bool CallLocalFunctionVariable(JSContext* cx, JS::HandleValue f) {
  JS::RootedValue r(cx);
  if (!JS_CallFunctionValue(cx, nullptr, f, JS::HandleValueArray::empty(), &r))
    return false;

  return true;
}

///// Returning an integer /////////////////////////////////////////////////////

/* // JavaScript
 * return 23;
 *
 * Warning: This only works for integers that fit in 32 bits.
 * Otherwise, use setNumber or setDouble (see the next example).
 */
static bool ReturnInteger(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  args.rval().setInt32(23);
  return true;
}

///// Returning a floating-point number ////////////////////////////////////////

/* // JavaScript
 * return 3.14159;
 */

static bool ReturnFloat(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  args.rval().setDouble(3.14159);
  return true;
}

/**** EXCEPTION HANDLING ******************************************************/

///// `throw` //////////////////////////////////////////////////////////////////

/* The most common idiom is to create a new Error object and throw that.
 * JS_ReportError{ASCII,Latin1,UTF8} does this. Note that JavaScript exceptions
 * are not the same thing as C++ exceptions. The JSAPI code also has to return
 * false to signal failure to the caller.
 *
 * // JavaScript
 * throw new Error("Failed to grow " + varietal + ": too many greenflies.");
 *
 * To internationalize your error messages, and to throw other error types, such
 * as SyntaxError or TypeError, use JS_ReportErrorNumber{ASCII,Latin1,UTF8}
 * instead.
 */
static bool ReportError(JSContext* cx, const char* varietal) {
  JS_ReportErrorASCII(cx, "Failed to grow %s: too many greenflies.", varietal);
  return false;
}

/* JavaScript also supports throwing any value at all, not just Error objects.
 * Use JS_SetPendingException to throw an arbitrary JS::Value from C/C++.
 *
 * // JavaScript
 * throw exc;
 */
static bool ThrowValue(JSContext* cx, JS::HandleValue exc) {
  JS_SetPendingException(cx, exc);
  return false;
}

/* When JS_ReportError creates a new Error object, it sets the fileName and
 * lineNumber properties to the line of JavaScript code currently at the top of
 * the stack. This is usually the line of code that called your native function,
 * so it's usually what you want. JSAPI code can override this by creating the
 * Error object directly and passing additional arguments to the constructor:
 *
 * // JavaScript
 * throw new Error(message, filename, lineno);
 *
 * An example use would be to pass the filename and line number in the C++ code
 * instead:
 *
 * return ThrowError(cx, global, message, __FILE__, __LINE__);
 */
static bool ThrowError(JSContext* cx, JS::HandleObject global,
                       const char* message, const char* filename,
                       int32_t lineno) {
  JS::RootedString messageStr(cx, JS_NewStringCopyZ(cx, message));
  if (!messageStr) return false;
  JS::RootedString filenameStr(cx, JS_NewStringCopyZ(cx, filename));
  if (!filenameStr) return false;

  JS::RootedValueArray<3> args(cx);
  args[0].setString(messageStr);
  args[1].setString(filenameStr);
  args[2].setInt32(lineno);
  JS::RootedValue exc(cx);
  // The JSAPI code here is actually simulating `throw Error(message)` without
  // the new, as new is a bit harder to simulate using the JSAPI. In this case,
  // unless the script has redefined Error, it amounts to the same thing.
  if (!JS_CallFunctionName(cx, global, "Error", args, &exc)) return false;

  JS_SetPendingException(cx, exc);
  return false;
}

#define THROW_ERROR(cx, global, message) \
  ThrowError(cx, global, message, __FILE__, __LINE__)

///// `catch` //////////////////////////////////////////////////////////////////

/* // JavaScript
 * try {
 *     // try some stuff here; for example:
 *     foo();
 *     bar();
 * } catch (exc) {
 *     // do error-handling stuff here
 * }
 */
static bool CatchError(JSContext* cx, JS::HandleObject global) {
  JS::RootedValue r(cx);
  // try some stuff here; for example:
  if (!JS_CallFunctionName(cx, global, "foo", JS::HandleValueArray::empty(),
                           &r))
    goto catch_block;  // instead of returning false
  if (!JS_CallFunctionName(cx, global, "bar", JS::HandleValueArray::empty(),
                           &r))
    goto catch_block;  // instead of returning false
  return true;

catch_block:
  JS::RootedValue exc(cx);
  if (!JS_GetPendingException(cx, &exc)) return false;
  JS_ClearPendingException(cx);
  // do error-handling stuff here
  return true;
}

///// `finally` ////////////////////////////////////////////////////////////////

/* // JavaScript
 * try {
 *    foo();
 *    bar();
 * } finally {
 *    cleanup();
 * }
 *
 * If your C/C++ cleanup code doesn't call back into the JSAPI, this is
 * straightforward:
 */
static bool FinallyBlock(JSContext* cx, JS::HandleObject global) {
  bool success = false;
  JS::RootedValue r(cx);

  if (!JS_CallFunctionName(cx, global, "foo", JS::HandleValueArray::empty(),
                           &r))
    goto finally_block;  // instead of returning false immediately
  if (!JS_CallFunctionName(cx, global, "bar", JS::HandleValueArray::empty(),
                           &r))
    goto finally_block;
  success = true;
  // Intentionally fall through to the finally block.

finally_block:
  /* cleanup(); */
  return success;
}

/* However, if cleanup() is actually a JavaScript function, there's a catch.
 * When an error occurs, the JSContext's pending exception is set. If this
 * happens in foo() or bar() in the above example, the pending exception will
 * still be set when you call cleanup(), which would be bad. To avoid this, your
 * JSAPI code implementing the finally block must:
 *
 * - save the old exception, if any
 * - clear the pending exception so that your cleanup code can run
 * - do your cleanup
 * - restore the old exception, if any
 * - return false if an exception occurred, so that the exception is propagated
 *   up.
 */
static bool ReentrantFinallyBlock(JSContext* cx, JS::HandleObject global) {
  bool success = false;
  JS::RootedValue r(cx);

  if (!JS_CallFunctionName(cx, global, "foo", JS::HandleValueArray::empty(),
                           &r))
    goto finally_block;  // instead of returning false immediately
  if (!JS_CallFunctionName(cx, global, "bar", JS::HandleValueArray::empty(),
                           &r))
    goto finally_block;
  success = true;
  // Intentionally fall through to the finally block.

finally_block:
  /* Temporarily set aside any exception currently pending.
   * It will be automatically restored when we return, unless we call
   * savedState.drop(). */
  JS::AutoSaveExceptionState savedState(cx);

  if (!JS_CallFunctionName(cx, global, "cleanup", JS::HandleValueArray::empty(),
                           &r)) {
    // The new error replaces the previous one, so discard the saved exception
    // state.
    savedState.drop();
    return false;
  }
  return success;
}

/**** OBJECT PROPERTIES *******************************************************/

///// Getting a property ///////////////////////////////////////////////////////

/* // JavaScript
 * var x = y.myprop;
 *
 * The JSAPI function that does this is JS_GetProperty. It requires a JSObject*
 * argument. Since JavaScript values are usually stored in JS::Value variables,
 * a cast or conversion is usually needed.
 *
 * In cases where it is certain that y is an object (that is, not a boolean,
 * number, string, null, or undefined), this is fairly straightforward. Use
 * JS::Value::toObject() to cast y to type JSObject*.
 */
static bool GetProperty(JSContext* cx, JS::HandleValue y) {
  JS::RootedValue x(cx);

  assert(y.isObject());
  JS::RootedObject yobj(cx, &y.toObject());
  if (!JS_GetProperty(cx, yobj, "myprop", &x)) return false;

  return true;
}

/* That code will crash if y is not an object. That's often unacceptable. An
 * alternative would be to simulate the behavior of the JavaScript . notation,
 * which will "work" but tends to silently hide errors (as for example would
 * JavaScript `var x = 4; return x.myprop;`).
 */
static bool GetPropertySafe(JSContext* cx, JS::HandleObject global,
                            JS::HandleValue y) {
  JS::RootedObject yobj(cx);
  if (!JS_ValueToObject(cx, y, &yobj)) return false;

  JS::RootedValue x(cx);
  if (!JS_GetProperty(cx, yobj, "myprop", &x)) return false;

  return true;
}

///// Setting a property ///////////////////////////////////////////////////////

/* // JavaScript
 * y.myprop = x;
 *
 * See "Getting a property", above, concerning the case where y is not an
 * object.
 */
static bool SetProperty(JSContext* cx, JS::HandleValue y, JS::HandleValue x) {
  JS::RootedObject yobj(cx);
  if (!JS_ValueToObject(cx, y, &yobj)) return false;
  if (!JS_SetProperty(cx, yobj, "myprop", x)) return false;

  return true;
}

///// Checking for a property //////////////////////////////////////////////////

/* // JavaScript
 * if ("myprop" in y) {
 *     // then do something
 * }
 *
 * In the case where y is not an object, here we just proceed as if the property
 * did not exist. Compare "Getting a property", above.
 */
static bool CheckProperty(JSContext* cx, JS::HandleValue y) {
  bool found;

  if (!y.isObject()) {
    found = false;
  } else {
    JS::RootedObject yobj(cx, &y.toObject());
    if (!JS_HasProperty(cx, yobj, "myprop", &found)) return false;
  }
  if (found) {
    // then do something
  }

  return true;
}

///// Defining a constant property /////////////////////////////////////////////

/* This is the first of three examples involving the built-in function
 * Object.defineProperty(), which gives JavaScript code fine-grained control
 * over the behavior of individual properties of any object.
 *
 * You can use this function to create a constant property, one that can't be
 * overwritten or deleted. Specify writable: false to make the property
 * read-only and configurable: false to prevent it from being deleted or
 * redefined. The flag enumerable: true causes this property to be seen by
 * for-in loops.
 *
 * // JavaScript
 * Object.defineProperty(obj, "const_prop", {
 *     value: 123,
 *     writable: false,
 *     enumerable: true,
 *     configurable: false,
 * });
 *
 * The analogous JSAPI function is JS_DefineProperty. The property attribute
 * JSPROP_READONLY corresponds to writeable: false, JSPROP_ENUMERATE to
 * enumerable: true, and JSPROP_PERMANENT to configurable: false. To get the
 * opposite behavior for any of these settings, simply omit the property
 * attribute bits you don't want.
 */
static bool DefineConstantProperty(JSContext* cx, JS::HandleObject obj) {
  // You can pass the integer directly instead of creating a JS::Int32Value(),
  // as there are overloads for common types
  if (!JS_DefineProperty(
          cx, obj, "const-prop", 123,
          JSPROP_READONLY | JSPROP_ENUMERATE | JSPROP_PERMANENT)) {
    return false;
  }

  return true;
}

///// Defining a property with a getter and setter /////////////////////////////

/* Object.defineProperty() can be used to define properties in terms of two
 * accessor functions.
 *
 * // JavaScript
 * Object.defineProperty(obj, "getter_setter_prop", {
 *     get: GetPropFunc,
 *     set: SetPropFunc,
 *     enumerable: true,
 * });
 *
 * In the JSAPI version, GetPropFunc and SetPropFunc are C/C++ functions of type
 * JSNative.
 */
static bool GetPropFunc(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  args.rval().setInt32(42);
  return true;
}

static bool SetPropFunc(JSContext* cx, unsigned argc, JS::Value* vp) {
  return true;
}

static bool DefineGetterSetterProperty(JSContext* cx, JS::HandleObject obj) {
  if (!JS_DefineProperty(cx, obj, "getter_setter_prop", GetPropFunc,
                         SetPropFunc, JSPROP_ENUMERATE)) {
    return false;
  }

  return true;
}

///// Defining a read-only property with only a getter /////////////////////////

/* // JavaScript
 * Object.defineProperty(obj, "read_only_prop", {
 *     get: GetPropFunc,
 *     enumerable: true,
 * });
 *
 * In the JSAPI version, to signify that the property is read-only, pass nullptr
 * for the setter.
 */
static bool DefineReadOnlyProperty(JSContext* cx, JS::HandleObject obj) {
  if (!JS_DefineProperty(cx, obj, "read_only_prop", GetPropFunc,
                         nullptr, /* setter */
                         JSPROP_ENUMERATE)) {
    return false;
  }

  return true;
}

/**** WORKING WITH THE PROTOTYPE CHAIN ****************************************/

///// Defining a native read-only property on the String.prototype /////////////

/* // JavaScript
 * Object.defineProperty(String.prototype, "md5sum", {
 *     get: GetMD5Func,
 *     enumerable: true,
 * });
 *
 * The following trick couldn't work if someone has replaced the global String
 * object with something.
 */
static bool GetMD5Func(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  // Implement your MD5 hashing here...
  JSString* hashstr = JS_NewStringCopyZ(cx, "d41d8cd98f00b204e9800998ecf8427e");
  if (!hashstr) return false;
  args.rval().setString(hashstr);
  return true;
}

static bool ModifyStringPrototype(JSContext* cx, JS::HandleObject global) {
  JS::RootedValue val(cx);

  // Get the String constructor from the global object.
  if (!JS_GetProperty(cx, global, "String", &val)) return false;
  if (val.isPrimitive())
    return THROW_ERROR(cx, global, "String is not an object");
  JS::RootedObject string(cx, &val.toObject());

  // Get String.prototype.
  if (!JS_GetProperty(cx, string, "prototype", &val)) return false;
  if (val.isPrimitive())
    return THROW_ERROR(cx, global, "String.prototype is not an object");
  JS::RootedObject string_prototype(cx, &val.toObject());

  // ...and now we can add some new functionality to all strings.
  if (!JS_DefineProperty(cx, string_prototype, "md5sum", GetMD5Func, nullptr,
                         JSPROP_ENUMERATE)) {
    return false;
  }

  return true;
}

/**** Defining classes ********************************************************/

/* This defines a constructor function, a prototype object, and properties of
 * the prototype and of the constructor, all with one API call.
 *
 * Initialize a class by defining its constructor function, prototype, and
 * per-instance and per-class properties.
 * The latter are called "static" below by analogy to Java.
 * They are defined in the constructor object's scope, so that
 * `MyClass.myStaticProp` works along with `new MyClass()`.
 *
 * `JS_InitClass` takes a lot of arguments, but you can pass `nullptr` for
 * any of the last four if there are no such properties or methods.
 *
 * Note that you do not need to call `JS_InitClass` to make a new instance
 * of that class—otherwise there would be a chicken-and-egg problem making
 * the global object—but you should call `JS_InitClass` if you require a
 * constructor function for script authors to call via `new`, and/or a
 * class prototype object (`MyClass.prototype`) for authors to extend with
 * new properties at run time.
 * In general, if you want to support multiple instances that share
 * behavior, use `JS_InitClass`.
 *
 * // JavaScript:
 * class MyClass {
 *     constructor(a, b) {
 *         this._a = a;
 *         this._b = b;
 *     }
 *     get prop() { return 42; }
 *     method() { return this.a + this.b; }
 *     static get static_prop() { return 'static'; }
 *     static static_method(a, b) { return a + b; }
 * }
 */
static JSClass myClass = {"MyClass", JSCLASS_HAS_RESERVED_SLOTS(2), nullptr};

enum MyClassSlots { SlotA, SlotB };

static bool MyClassPropGetter(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  args.rval().setInt32(42);
  return true;
}

static bool MyClassMethod(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  JS::RootedObject thisObj(cx);
  if (!args.computeThis(cx, &thisObj)) return false;

  JS::RootedValue v_a(cx, JS::GetReservedSlot(thisObj, SlotA));
  JS::RootedValue v_b(cx, JS::GetReservedSlot(thisObj, SlotB));

  double a, b;
  if (!JS::ToNumber(cx, v_a, &a) || !JS::ToNumber(cx, v_b, &b)) return false;

  args.rval().setDouble(a + b);
  return true;
}

static bool MyClassStaticPropGetter(JSContext* cx, unsigned argc,
                                    JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  JSString* str = JS_NewStringCopyZ(cx, "static");
  if (!str) return false;
  args.rval().setString(str);
  return true;
}

static bool MyClassStaticMethod(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "static_method", 2)) return false;

  double a, b;
  if (!JS::ToNumber(cx, args[0], &a) || !JS::ToNumber(cx, args[1], &b))
    return false;

  args.rval().setDouble(a + b);
  return true;
}

static JSPropertySpec MyClassProperties[] = {
    JS_PSG("prop", MyClassPropGetter, JSPROP_ENUMERATE), JS_PS_END};

static JSFunctionSpec MyClassMethods[] = {
    JS_FN("method", MyClassMethod, 0, JSPROP_ENUMERATE), JS_FS_END};

static JSPropertySpec MyClassStaticProperties[] = {
    JS_PSG("static_prop", MyClassStaticPropGetter, JSPROP_ENUMERATE),
    JS_PS_END};

static JSFunctionSpec MyClassStaticMethods[] = {
    JS_FN("static_method", MyClassStaticMethod, 2, JSPROP_ENUMERATE),
    JS_FS_END};

static bool MyClassConstructor(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "MyClass", 2)) return false;
  if (!args.isConstructing()) {
    JS_ReportErrorASCII(cx, "You must call this constructor with 'new'");
    return false;
  }
  JS::RootedObject thisObj(cx, JS_NewObjectForConstructor(cx, &myClass, args));
  if (!thisObj) return false;

  // Slightly different from the 'private' properties in the JS example, here
  // we use reserved slots to store the a and b values. These are not accessible
  // from JavaScript.
  JS::SetReservedSlot(thisObj, SlotA, args[0]);
  JS::SetReservedSlot(thisObj, SlotB, args[1]);

  args.rval().setObject(*thisObj);
  return true;
}

static bool DefineMyClass(JSContext* cx, JS::HandleObject global) {
  JS::RootedObject protoObj(
      cx, JS_InitClass(cx, global, nullptr, &myClass,
                       // native constructor function and min arg count
                       MyClassConstructor, 2,

                       // prototype object properties and methods -- these will
                       // be "inherited" by all instances through delegation up
                       // the instance's prototype link.
                       MyClassProperties, MyClassMethods,

                       // class constructor properties and methods
                       MyClassStaticProperties, MyClassStaticMethods));
  if (!protoObj) return false;

  // You can add anything else here to protoObj (which is available as
  // MyClass.prototype in JavaScript). For example, call JS_DefineProperty() to
  // add data properties to the prototype.

  return true;
}

/**** WANTED ******************************************************************/

/* Simulating `for` and `for...of`.
 * Actually outputting errors.
 * Create global variable __dirname to retrieve the current JavaScript file
 * name, like in NodeJS
 * Custom error reporter
 */

/**** BOILERPLATE *************************************************************/

static bool GenericJSNative(JSContext* cx, unsigned argc, JS::Value* vp) {
  return true;
}

static bool ThrowJSNative(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  JS::RootedObject global(cx, JS::GetNonCCWObjectGlobal(&args.callee()));
  if (!global) return false;
  return THROW_ERROR(cx, global, "Error message");
}

static JSFunctionSpec globalFunctions[] = {
    JS_FN("findGlobalObject", FindGlobalObject, 0, 0),
    JS_FN("Person", PersonConstructor, 2, JSFUN_CONSTRUCTOR),
    JS_FN("foo", GenericJSNative, 0, 0),
    JS_FN("returnInteger", ReturnInteger, 0, 0),
    JS_FN("returnFloat", ReturnFloat, 0, 0),
    JS_FN("bar", ThrowJSNative, 0, 0),
    JS_FN("cleanup", GenericJSNative, 0, 0),
    JS_FS_END};

static bool ExecuteCode(JSContext* cx, const char* code) {
  JS::CompileOptions options(cx);
  options.setFileAndLine("noname", 1);

  JS::SourceText<mozilla::Utf8Unit> source;
  if (!source.init(cx, code, strlen(code), JS::SourceOwnership::Borrowed)) {
    return false;
  }

  JS::RootedValue unused(cx);
  return JS::Evaluate(cx, options, source, &unused);
}

class AutoReportException {
  JSContext* m_cx;

 public:
  explicit AutoReportException(JSContext* cx) : m_cx(cx) {}

  ~AutoReportException(void) {
    if (!JS_IsExceptionPending(m_cx)) return;

    JS::RootedValue v_exn(m_cx);
    mozilla::Unused << JS_GetPendingException(m_cx, &v_exn);
    JS_ClearPendingException(m_cx);

    JS::RootedString message(m_cx, JS::ToString(m_cx, v_exn));
    if (!message) {
      std::cerr << "(could not convert thrown exception to string)\n";
    } else {
      JS::UniqueChars message_utf8(JS_EncodeStringToUTF8(m_cx, message));
      std::cerr << message_utf8.get() << '\n';
    }

    JS_ClearPendingException(m_cx);
  }
};

/* Execute each of the examples; many don't do anything but it's good to be able
 * to exercise the code to make sure it hasn't bitrotted. */
static bool RunCookbook(JSContext* cx) {
  JS::RootedObject global(cx, boilerplate::CreateGlobal(cx));
  if (!global) return false;

  JSAutoRealm ar(cx, global);

  // Define some helper methods on our new global.
  if (!JS_DefineFunctions(cx, global, globalFunctions)) return false;

  AutoReportException autoreport(cx);

  // Execute each of the JSAPI recipe functions we defined:

  JS::RootedValue v(cx, JS::NullValue());
  GetTypeOfValue(cx, v);
  if (!SetValue(cx)) return false;

  if (!DefineGlobalFunction(cx, global) || !CreateArray(cx) ||
      !CreateObject(cx) || !ConstructObjectWithNew(cx, global) ||
      !CallGlobalFunction(cx, global)) {
    return false;
  }

  JS::RootedValue f(cx);
  JSFunction* newFunction = JS_NewFunction(cx, JustForFun, 0, 0, "f");
  if (!newFunction) return false;
  f.setObject(*JS_GetFunctionObject(newFunction));

  if (!CallLocalFunctionVariable(cx, f)) return false;

  if (ReportError(cx, "cabernet sauvignon")) return false;
  JS_ClearPendingException(cx);

  JS::RootedValue exc(cx, JS::NumberValue(42));
  if (ThrowValue(cx, exc)) return false;
  JS_ClearPendingException(cx);

  if (THROW_ERROR(cx, global, "an error message")) return false;
  JS_ClearPendingException(cx);

  if (!CatchError(cx, global)) return false;

  if (FinallyBlock(cx, global)) return false;
  JS_ClearPendingException(cx);

  if (ReentrantFinallyBlock(cx, global)) return false;
  JS_ClearPendingException(cx);

  JS::RootedObject obj(cx, JS_NewPlainObject(cx));
  if (!obj) return false;
  JS::RootedValue v_obj(cx, JS::ObjectValue(*obj));
  JS::RootedValue v_prop(cx, JS::Int32Value(42));
  if (!SetProperty(cx, v_obj, v_prop)) return false;
  if (!CheckProperty(cx, v_obj)) return false;
  if (!GetProperty(cx, v_obj)) return false;
  if (!GetPropertySafe(cx, global, v_obj)) return false;
  if (!DefineConstantProperty(cx, obj)) return false;
  if (!DefineGetterSetterProperty(cx, obj)) return false;
  if (!DefineReadOnlyProperty(cx, obj)) return false;
  if (!ModifyStringPrototype(cx, global)) return false;

  if (!DefineMyClass(cx, global)) return false;
  if (!ExecuteCode(cx, R"js(
        const m = new MyClass(1, 2);
        m.method();
        m.prop;
        MyClass.static_prop;
        MyClass.static_method(2, 3);
      )js"))
    return false;

  // Also execute each of the JSNative functions we defined:
  return ExecuteCode(cx, R"js(
    justForFun();
    findGlobalObject();
    returnInteger();
    returnFloat();
    ''.md5sum
  )js");
}

int main(int argc, const char* argv[]) {
  if (!boilerplate::RunExample(RunCookbook)) return 1;
  return 0;
}
