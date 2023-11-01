(() => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __esm = (fn, res) => function __init() {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    };
    var __commonJS = (cb, mod) => function __require() {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
  
    // wrangler-modules-watch:wrangler:modules-watch
    var init_wrangler_modules_watch = __esm({
      "wrangler-modules-watch:wrangler:modules-watch"() {
        init_modules_watch_stub();
      }
    });
  
    // ../../../../.npm/_npx/c876b8d908efe3cd/node_modules/wrangler/templates/modules-watch-stub.js
    var init_modules_watch_stub = __esm({
      "../../../../.npm/_npx/c876b8d908efe3cd/node_modules/wrangler/templates/modules-watch-stub.js"() {
        init_wrangler_modules_watch();
      }
    });
  
    // node_modules/.pnpm/react@18.2.0/node_modules/react/cjs/react.development.js
    var require_react_development = __commonJS({
      "node_modules/.pnpm/react@18.2.0/node_modules/react/cjs/react.development.js"(exports, module) {
        "use strict";
        init_modules_watch_stub();
        if (true) {
          (function() {
            "use strict";
            if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
            }
            var ReactVersion = "18.2.0";
            var REACT_ELEMENT_TYPE = Symbol.for("react.element");
            var REACT_PORTAL_TYPE = Symbol.for("react.portal");
            var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
            var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
            var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
            var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
            var REACT_CONTEXT_TYPE = Symbol.for("react.context");
            var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
            var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
            var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
            var REACT_MEMO_TYPE = Symbol.for("react.memo");
            var REACT_LAZY_TYPE = Symbol.for("react.lazy");
            var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
            var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
            var FAUX_ITERATOR_SYMBOL = "@@iterator";
            function getIteratorFn(maybeIterable) {
              if (maybeIterable === null || typeof maybeIterable !== "object") {
                return null;
              }
              var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
              if (typeof maybeIterator === "function") {
                return maybeIterator;
              }
              return null;
            }
            var ReactCurrentDispatcher = {
              /**
               * @internal
               * @type {ReactComponent}
               */
              current: null
            };
            var ReactCurrentBatchConfig = {
              transition: null
            };
            var ReactCurrentActQueue = {
              current: null,
              // Used to reproduce behavior of `batchedUpdates` in legacy mode.
              isBatchingLegacy: false,
              didScheduleLegacyUpdate: false
            };
            var ReactCurrentOwner = {
              /**
               * @internal
               * @type {ReactComponent}
               */
              current: null
            };
            var ReactDebugCurrentFrame = {};
            var currentExtraStackFrame = null;
            function setExtraStackFrame(stack) {
              {
                currentExtraStackFrame = stack;
              }
            }
            {
              ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
                {
                  currentExtraStackFrame = stack;
                }
              };
              ReactDebugCurrentFrame.getCurrentStack = null;
              ReactDebugCurrentFrame.getStackAddendum = function() {
                var stack = "";
                if (currentExtraStackFrame) {
                  stack += currentExtraStackFrame;
                }
                var impl = ReactDebugCurrentFrame.getCurrentStack;
                if (impl) {
                  stack += impl() || "";
                }
                return stack;
              };
            }
            var enableScopeAPI = false;
            var enableCacheElement = false;
            var enableTransitionTracing = false;
            var enableLegacyHidden = false;
            var enableDebugTracing = false;
            var ReactSharedInternals = {
              ReactCurrentDispatcher,
              ReactCurrentBatchConfig,
              ReactCurrentOwner
            };
            {
              ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
              ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
            }
            function warn(format) {
              {
                {
                  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                  }
                  printWarning("warn", format, args);
                }
              }
            }
            function error(format) {
              {
                {
                  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                  }
                  printWarning("error", format, args);
                }
              }
            }
            function printWarning(level, format, args) {
              {
                var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
                var stack = ReactDebugCurrentFrame2.getStackAddendum();
                if (stack !== "") {
                  format += "%s";
                  args = args.concat([stack]);
                }
                var argsWithFormat = args.map(function(item) {
                  return String(item);
                });
                argsWithFormat.unshift("Warning: " + format);
                Function.prototype.apply.call(console[level], console, argsWithFormat);
              }
            }
            var didWarnStateUpdateForUnmountedComponent = {};
            function warnNoop(publicInstance, callerName) {
              {
                var _constructor = publicInstance.constructor;
                var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
                var warningKey = componentName + "." + callerName;
                if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
                  return;
                }
                error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, componentName);
                didWarnStateUpdateForUnmountedComponent[warningKey] = true;
              }
            }
            var ReactNoopUpdateQueue = {
              /**
               * Checks whether or not this composite component is mounted.
               * @param {ReactClass} publicInstance The instance we want to test.
               * @return {boolean} True if mounted, false otherwise.
               * @protected
               * @final
               */
              isMounted: function(publicInstance) {
                return false;
              },
              /**
               * Forces an update. This should only be invoked when it is known with
               * certainty that we are **not** in a DOM transaction.
               *
               * You may want to call this when you know that some deeper aspect of the
               * component's state has changed but `setState` was not called.
               *
               * This will not invoke `shouldComponentUpdate`, but it will invoke
               * `componentWillUpdate` and `componentDidUpdate`.
               *
               * @param {ReactClass} publicInstance The instance that should rerender.
               * @param {?function} callback Called after component is updated.
               * @param {?string} callerName name of the calling function in the public API.
               * @internal
               */
              enqueueForceUpdate: function(publicInstance, callback, callerName) {
                warnNoop(publicInstance, "forceUpdate");
              },
              /**
               * Replaces all of the state. Always use this or `setState` to mutate state.
               * You should treat `this.state` as immutable.
               *
               * There is no guarantee that `this.state` will be immediately updated, so
               * accessing `this.state` after calling this method may return the old value.
               *
               * @param {ReactClass} publicInstance The instance that should rerender.
               * @param {object} completeState Next state.
               * @param {?function} callback Called after component is updated.
               * @param {?string} callerName name of the calling function in the public API.
               * @internal
               */
              enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
                warnNoop(publicInstance, "replaceState");
              },
              /**
               * Sets a subset of the state. This only exists because _pendingState is
               * internal. This provides a merging strategy that is not available to deep
               * properties which is confusing. TODO: Expose pendingState or don't use it
               * during the merge.
               *
               * @param {ReactClass} publicInstance The instance that should rerender.
               * @param {object} partialState Next partial state to be merged with state.
               * @param {?function} callback Called after component is updated.
               * @param {?string} Name of the calling function in the public API.
               * @internal
               */
              enqueueSetState: function(publicInstance, partialState, callback, callerName) {
                warnNoop(publicInstance, "setState");
              }
            };
            var assign = Object.assign;
            var emptyObject = {};
            {
              Object.freeze(emptyObject);
            }
            function Component(props, context, updater) {
              this.props = props;
              this.context = context;
              this.refs = emptyObject;
              this.updater = updater || ReactNoopUpdateQueue;
            }
            Component.prototype.isReactComponent = {};
            Component.prototype.setState = function(partialState, callback) {
              if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null) {
                throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
              }
              this.updater.enqueueSetState(this, partialState, callback, "setState");
            };
            Component.prototype.forceUpdate = function(callback) {
              this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
            };
            {
              var deprecatedAPIs = {
                isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
                replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
              };
              var defineDeprecationWarning = function(methodName, info) {
                Object.defineProperty(Component.prototype, methodName, {
                  get: function() {
                    warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
                    return void 0;
                  }
                });
              };
              for (var fnName in deprecatedAPIs) {
                if (deprecatedAPIs.hasOwnProperty(fnName)) {
                  defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
                }
              }
            }
            function ComponentDummy() {
            }
            ComponentDummy.prototype = Component.prototype;
            function PureComponent(props, context, updater) {
              this.props = props;
              this.context = context;
              this.refs = emptyObject;
              this.updater = updater || ReactNoopUpdateQueue;
            }
            var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
            pureComponentPrototype.constructor = PureComponent;
            assign(pureComponentPrototype, Component.prototype);
            pureComponentPrototype.isPureReactComponent = true;
            function createRef() {
              var refObject = {
                current: null
              };
              {
                Object.seal(refObject);
              }
              return refObject;
            }
            var isArrayImpl = Array.isArray;
            function isArray(a) {
              return isArrayImpl(a);
            }
            function typeName(value) {
              {
                var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
                var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
                return type;
              }
            }
            function willCoercionThrow(value) {
              {
                try {
                  testStringCoercion(value);
                  return false;
                } catch (e) {
                  return true;
                }
              }
            }
            function testStringCoercion(value) {
              return "" + value;
            }
            function checkKeyStringCoercion(value) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            function getWrappedName(outerType, innerType, wrapperName) {
              var displayName = outerType.displayName;
              if (displayName) {
                return displayName;
              }
              var functionName = innerType.displayName || innerType.name || "";
              return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
            }
            function getContextName(type) {
              return type.displayName || "Context";
            }
            function getComponentNameFromType(type) {
              if (type == null) {
                return null;
              }
              {
                if (typeof type.tag === "number") {
                  error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
                }
              }
              if (typeof type === "function") {
                return type.displayName || type.name || null;
              }
              if (typeof type === "string") {
                return type;
              }
              switch (type) {
                case REACT_FRAGMENT_TYPE:
                  return "Fragment";
                case REACT_PORTAL_TYPE:
                  return "Portal";
                case REACT_PROFILER_TYPE:
                  return "Profiler";
                case REACT_STRICT_MODE_TYPE:
                  return "StrictMode";
                case REACT_SUSPENSE_TYPE:
                  return "Suspense";
                case REACT_SUSPENSE_LIST_TYPE:
                  return "SuspenseList";
              }
              if (typeof type === "object") {
                switch (type.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    var context = type;
                    return getContextName(context) + ".Consumer";
                  case REACT_PROVIDER_TYPE:
                    var provider = type;
                    return getContextName(provider._context) + ".Provider";
                  case REACT_FORWARD_REF_TYPE:
                    return getWrappedName(type, type.render, "ForwardRef");
                  case REACT_MEMO_TYPE:
                    var outerName = type.displayName || null;
                    if (outerName !== null) {
                      return outerName;
                    }
                    return getComponentNameFromType(type.type) || "Memo";
                  case REACT_LAZY_TYPE: {
                    var lazyComponent = type;
                    var payload = lazyComponent._payload;
                    var init = lazyComponent._init;
                    try {
                      return getComponentNameFromType(init(payload));
                    } catch (x) {
                      return null;
                    }
                  }
                }
              }
              return null;
            }
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            var RESERVED_PROPS = {
              key: true,
              ref: true,
              __self: true,
              __source: true
            };
            var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
            {
              didWarnAboutStringRefs = {};
            }
            function hasValidRef(config) {
              {
                if (hasOwnProperty.call(config, "ref")) {
                  var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
                  if (getter && getter.isReactWarning) {
                    return false;
                  }
                }
              }
              return config.ref !== void 0;
            }
            function hasValidKey(config) {
              {
                if (hasOwnProperty.call(config, "key")) {
                  var getter = Object.getOwnPropertyDescriptor(config, "key").get;
                  if (getter && getter.isReactWarning) {
                    return false;
                  }
                }
              }
              return config.key !== void 0;
            }
            function defineKeyPropWarningGetter(props, displayName) {
              var warnAboutAccessingKey = function() {
                {
                  if (!specialPropKeyWarningShown) {
                    specialPropKeyWarningShown = true;
                    error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
                  }
                }
              };
              warnAboutAccessingKey.isReactWarning = true;
              Object.defineProperty(props, "key", {
                get: warnAboutAccessingKey,
                configurable: true
              });
            }
            function defineRefPropWarningGetter(props, displayName) {
              var warnAboutAccessingRef = function() {
                {
                  if (!specialPropRefWarningShown) {
                    specialPropRefWarningShown = true;
                    error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
                  }
                }
              };
              warnAboutAccessingRef.isReactWarning = true;
              Object.defineProperty(props, "ref", {
                get: warnAboutAccessingRef,
                configurable: true
              });
            }
            function warnIfStringRefCannotBeAutoConverted(config) {
              {
                if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
                  var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
                  if (!didWarnAboutStringRefs[componentName]) {
                    error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                    didWarnAboutStringRefs[componentName] = true;
                  }
                }
              }
            }
            var ReactElement = function(type, key, ref, self, source, owner, props) {
              var element = {
                // This tag allows us to uniquely identify this as a React Element
                $$typeof: REACT_ELEMENT_TYPE,
                // Built-in properties that belong on the element
                type,
                key,
                ref,
                props,
                // Record the component responsible for creating this element.
                _owner: owner
              };
              {
                element._store = {};
                Object.defineProperty(element._store, "validated", {
                  configurable: false,
                  enumerable: false,
                  writable: true,
                  value: false
                });
                Object.defineProperty(element, "_self", {
                  configurable: false,
                  enumerable: false,
                  writable: false,
                  value: self
                });
                Object.defineProperty(element, "_source", {
                  configurable: false,
                  enumerable: false,
                  writable: false,
                  value: source
                });
                if (Object.freeze) {
                  Object.freeze(element.props);
                  Object.freeze(element);
                }
              }
              return element;
            };
            function createElement(type, config, children) {
              var propName;
              var props = {};
              var key = null;
              var ref = null;
              var self = null;
              var source = null;
              if (config != null) {
                if (hasValidRef(config)) {
                  ref = config.ref;
                  {
                    warnIfStringRefCannotBeAutoConverted(config);
                  }
                }
                if (hasValidKey(config)) {
                  {
                    checkKeyStringCoercion(config.key);
                  }
                  key = "" + config.key;
                }
                self = config.__self === void 0 ? null : config.__self;
                source = config.__source === void 0 ? null : config.__source;
                for (propName in config) {
                  if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                    props[propName] = config[propName];
                  }
                }
              }
              var childrenLength = arguments.length - 2;
              if (childrenLength === 1) {
                props.children = children;
              } else if (childrenLength > 1) {
                var childArray = Array(childrenLength);
                for (var i = 0; i < childrenLength; i++) {
                  childArray[i] = arguments[i + 2];
                }
                {
                  if (Object.freeze) {
                    Object.freeze(childArray);
                  }
                }
                props.children = childArray;
              }
              if (type && type.defaultProps) {
                var defaultProps = type.defaultProps;
                for (propName in defaultProps) {
                  if (props[propName] === void 0) {
                    props[propName] = defaultProps[propName];
                  }
                }
              }
              {
                if (key || ref) {
                  var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
                  if (key) {
                    defineKeyPropWarningGetter(props, displayName);
                  }
                  if (ref) {
                    defineRefPropWarningGetter(props, displayName);
                  }
                }
              }
              return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
            }
            function cloneAndReplaceKey(oldElement, newKey) {
              var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
              return newElement;
            }
            function cloneElement(element, config, children) {
              if (element === null || element === void 0) {
                throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
              }
              var propName;
              var props = assign({}, element.props);
              var key = element.key;
              var ref = element.ref;
              var self = element._self;
              var source = element._source;
              var owner = element._owner;
              if (config != null) {
                if (hasValidRef(config)) {
                  ref = config.ref;
                  owner = ReactCurrentOwner.current;
                }
                if (hasValidKey(config)) {
                  {
                    checkKeyStringCoercion(config.key);
                  }
                  key = "" + config.key;
                }
                var defaultProps;
                if (element.type && element.type.defaultProps) {
                  defaultProps = element.type.defaultProps;
                }
                for (propName in config) {
                  if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                    if (config[propName] === void 0 && defaultProps !== void 0) {
                      props[propName] = defaultProps[propName];
                    } else {
                      props[propName] = config[propName];
                    }
                  }
                }
              }
              var childrenLength = arguments.length - 2;
              if (childrenLength === 1) {
                props.children = children;
              } else if (childrenLength > 1) {
                var childArray = Array(childrenLength);
                for (var i = 0; i < childrenLength; i++) {
                  childArray[i] = arguments[i + 2];
                }
                props.children = childArray;
              }
              return ReactElement(element.type, key, ref, self, source, owner, props);
            }
            function isValidElement(object) {
              return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
            }
            var SEPARATOR = ".";
            var SUBSEPARATOR = ":";
            function escape(key) {
              var escapeRegex = /[=:]/g;
              var escaperLookup = {
                "=": "=0",
                ":": "=2"
              };
              var escapedString = key.replace(escapeRegex, function(match) {
                return escaperLookup[match];
              });
              return "$" + escapedString;
            }
            var didWarnAboutMaps = false;
            var userProvidedKeyEscapeRegex = /\/+/g;
            function escapeUserProvidedKey(text) {
              return text.replace(userProvidedKeyEscapeRegex, "$&/");
            }
            function getElementKey(element, index) {
              if (typeof element === "object" && element !== null && element.key != null) {
                {
                  checkKeyStringCoercion(element.key);
                }
                return escape("" + element.key);
              }
              return index.toString(36);
            }
            function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
              var type = typeof children;
              if (type === "undefined" || type === "boolean") {
                children = null;
              }
              var invokeCallback = false;
              if (children === null) {
                invokeCallback = true;
              } else {
                switch (type) {
                  case "string":
                  case "number":
                    invokeCallback = true;
                    break;
                  case "object":
                    switch (children.$$typeof) {
                      case REACT_ELEMENT_TYPE:
                      case REACT_PORTAL_TYPE:
                        invokeCallback = true;
                    }
                }
              }
              if (invokeCallback) {
                var _child = children;
                var mappedChild = callback(_child);
                var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
                if (isArray(mappedChild)) {
                  var escapedChildKey = "";
                  if (childKey != null) {
                    escapedChildKey = escapeUserProvidedKey(childKey) + "/";
                  }
                  mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                    return c;
                  });
                } else if (mappedChild != null) {
                  if (isValidElement(mappedChild)) {
                    {
                      if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
                        checkKeyStringCoercion(mappedChild.key);
                      }
                    }
                    mappedChild = cloneAndReplaceKey(
                      mappedChild,
                      // Keep both the (mapped) and old keys if they differ, just as
                      // traverseAllChildren used to do for objects as children
                      escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                      (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                        // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                        // eslint-disable-next-line react-internal/safe-string-coercion
                        escapeUserProvidedKey("" + mappedChild.key) + "/"
                      ) : "") + childKey
                    );
                  }
                  array.push(mappedChild);
                }
                return 1;
              }
              var child;
              var nextName;
              var subtreeCount = 0;
              var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
              if (isArray(children)) {
                for (var i = 0; i < children.length; i++) {
                  child = children[i];
                  nextName = nextNamePrefix + getElementKey(child, i);
                  subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
                }
              } else {
                var iteratorFn = getIteratorFn(children);
                if (typeof iteratorFn === "function") {
                  var iterableChildren = children;
                  {
                    if (iteratorFn === iterableChildren.entries) {
                      if (!didWarnAboutMaps) {
                        warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                      }
                      didWarnAboutMaps = true;
                    }
                  }
                  var iterator = iteratorFn.call(iterableChildren);
                  var step;
                  var ii = 0;
                  while (!(step = iterator.next()).done) {
                    child = step.value;
                    nextName = nextNamePrefix + getElementKey(child, ii++);
                    subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
                  }
                } else if (type === "object") {
                  var childrenString = String(children);
                  throw new Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
                }
              }
              return subtreeCount;
            }
            function mapChildren(children, func, context) {
              if (children == null) {
                return children;
              }
              var result = [];
              var count = 0;
              mapIntoArray(children, result, "", "", function(child) {
                return func.call(context, child, count++);
              });
              return result;
            }
            function countChildren(children) {
              var n = 0;
              mapChildren(children, function() {
                n++;
              });
              return n;
            }
            function forEachChildren(children, forEachFunc, forEachContext) {
              mapChildren(children, function() {
                forEachFunc.apply(this, arguments);
              }, forEachContext);
            }
            function toArray(children) {
              return mapChildren(children, function(child) {
                return child;
              }) || [];
            }
            function onlyChild(children) {
              if (!isValidElement(children)) {
                throw new Error("React.Children.only expected to receive a single React element child.");
              }
              return children;
            }
            function createContext(defaultValue) {
              var context = {
                $$typeof: REACT_CONTEXT_TYPE,
                // As a workaround to support multiple concurrent renderers, we categorize
                // some renderers as primary and others as secondary. We only expect
                // there to be two concurrent renderers at most: React Native (primary) and
                // Fabric (secondary); React DOM (primary) and React ART (secondary).
                // Secondary renderers store their context values on separate fields.
                _currentValue: defaultValue,
                _currentValue2: defaultValue,
                // Used to track how many concurrent renderers this context currently
                // supports within in a single renderer. Such as parallel server rendering.
                _threadCount: 0,
                // These are circular
                Provider: null,
                Consumer: null,
                // Add these to use same hidden class in VM as ServerContext
                _defaultValue: null,
                _globalName: null
              };
              context.Provider = {
                $$typeof: REACT_PROVIDER_TYPE,
                _context: context
              };
              var hasWarnedAboutUsingNestedContextConsumers = false;
              var hasWarnedAboutUsingConsumerProvider = false;
              var hasWarnedAboutDisplayNameOnConsumer = false;
              {
                var Consumer = {
                  $$typeof: REACT_CONTEXT_TYPE,
                  _context: context
                };
                Object.defineProperties(Consumer, {
                  Provider: {
                    get: function() {
                      if (!hasWarnedAboutUsingConsumerProvider) {
                        hasWarnedAboutUsingConsumerProvider = true;
                        error("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                      }
                      return context.Provider;
                    },
                    set: function(_Provider) {
                      context.Provider = _Provider;
                    }
                  },
                  _currentValue: {
                    get: function() {
                      return context._currentValue;
                    },
                    set: function(_currentValue) {
                      context._currentValue = _currentValue;
                    }
                  },
                  _currentValue2: {
                    get: function() {
                      return context._currentValue2;
                    },
                    set: function(_currentValue2) {
                      context._currentValue2 = _currentValue2;
                    }
                  },
                  _threadCount: {
                    get: function() {
                      return context._threadCount;
                    },
                    set: function(_threadCount) {
                      context._threadCount = _threadCount;
                    }
                  },
                  Consumer: {
                    get: function() {
                      if (!hasWarnedAboutUsingNestedContextConsumers) {
                        hasWarnedAboutUsingNestedContextConsumers = true;
                        error("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                      }
                      return context.Consumer;
                    }
                  },
                  displayName: {
                    get: function() {
                      return context.displayName;
                    },
                    set: function(displayName) {
                      if (!hasWarnedAboutDisplayNameOnConsumer) {
                        warn("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                        hasWarnedAboutDisplayNameOnConsumer = true;
                      }
                    }
                  }
                });
                context.Consumer = Consumer;
              }
              {
                context._currentRenderer = null;
                context._currentRenderer2 = null;
              }
              return context;
            }
            var Uninitialized = -1;
            var Pending = 0;
            var Resolved = 1;
            var Rejected = 2;
            function lazyInitializer(payload) {
              if (payload._status === Uninitialized) {
                var ctor = payload._result;
                var thenable = ctor();
                thenable.then(function(moduleObject2) {
                  if (payload._status === Pending || payload._status === Uninitialized) {
                    var resolved = payload;
                    resolved._status = Resolved;
                    resolved._result = moduleObject2;
                  }
                }, function(error2) {
                  if (payload._status === Pending || payload._status === Uninitialized) {
                    var rejected = payload;
                    rejected._status = Rejected;
                    rejected._result = error2;
                  }
                });
                if (payload._status === Uninitialized) {
                  var pending = payload;
                  pending._status = Pending;
                  pending._result = thenable;
                }
              }
              if (payload._status === Resolved) {
                var moduleObject = payload._result;
                {
                  if (moduleObject === void 0) {
                    error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", moduleObject);
                  }
                }
                {
                  if (!("default" in moduleObject)) {
                    error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
                  }
                }
                return moduleObject.default;
              } else {
                throw payload._result;
              }
            }
            function lazy(ctor) {
              var payload = {
                // We use these fields to store the result.
                _status: Uninitialized,
                _result: ctor
              };
              var lazyType = {
                $$typeof: REACT_LAZY_TYPE,
                _payload: payload,
                _init: lazyInitializer
              };
              {
                var defaultProps;
                var propTypes;
                Object.defineProperties(lazyType, {
                  defaultProps: {
                    configurable: true,
                    get: function() {
                      return defaultProps;
                    },
                    set: function(newDefaultProps) {
                      error("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                      defaultProps = newDefaultProps;
                      Object.defineProperty(lazyType, "defaultProps", {
                        enumerable: true
                      });
                    }
                  },
                  propTypes: {
                    configurable: true,
                    get: function() {
                      return propTypes;
                    },
                    set: function(newPropTypes) {
                      error("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                      propTypes = newPropTypes;
                      Object.defineProperty(lazyType, "propTypes", {
                        enumerable: true
                      });
                    }
                  }
                });
              }
              return lazyType;
            }
            function forwardRef(render) {
              {
                if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
                  error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
                } else if (typeof render !== "function") {
                  error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
                } else {
                  if (render.length !== 0 && render.length !== 2) {
                    error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
                  }
                }
                if (render != null) {
                  if (render.defaultProps != null || render.propTypes != null) {
                    error("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
                  }
                }
              }
              var elementType = {
                $$typeof: REACT_FORWARD_REF_TYPE,
                render
              };
              {
                var ownName;
                Object.defineProperty(elementType, "displayName", {
                  enumerable: false,
                  configurable: true,
                  get: function() {
                    return ownName;
                  },
                  set: function(name) {
                    ownName = name;
                    if (!render.name && !render.displayName) {
                      render.displayName = name;
                    }
                  }
                });
              }
              return elementType;
            }
            var REACT_MODULE_REFERENCE;
            {
              REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
            }
            function isValidElementType(type) {
              if (typeof type === "string" || typeof type === "function") {
                return true;
              }
              if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
                return true;
              }
              if (typeof type === "object" && type !== null) {
                if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
                // types supported by any Flight configuration anywhere since
                // we don't know which Flight build this will end up being used
                // with.
                type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
                  return true;
                }
              }
              return false;
            }
            function memo(type, compare) {
              {
                if (!isValidElementType(type)) {
                  error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
                }
              }
              var elementType = {
                $$typeof: REACT_MEMO_TYPE,
                type,
                compare: compare === void 0 ? null : compare
              };
              {
                var ownName;
                Object.defineProperty(elementType, "displayName", {
                  enumerable: false,
                  configurable: true,
                  get: function() {
                    return ownName;
                  },
                  set: function(name) {
                    ownName = name;
                    if (!type.name && !type.displayName) {
                      type.displayName = name;
                    }
                  }
                });
              }
              return elementType;
            }
            function resolveDispatcher() {
              var dispatcher = ReactCurrentDispatcher.current;
              {
                if (dispatcher === null) {
                  error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
                }
              }
              return dispatcher;
            }
            function useContext(Context) {
              var dispatcher = resolveDispatcher();
              {
                if (Context._context !== void 0) {
                  var realContext = Context._context;
                  if (realContext.Consumer === Context) {
                    error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
                  } else if (realContext.Provider === Context) {
                    error("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
                  }
                }
              }
              return dispatcher.useContext(Context);
            }
            function useState(initialState) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useState(initialState);
            }
            function useReducer(reducer, initialArg, init) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useReducer(reducer, initialArg, init);
            }
            function useRef(initialValue) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useRef(initialValue);
            }
            function useEffect(create, deps) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useEffect(create, deps);
            }
            function useInsertionEffect(create, deps) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useInsertionEffect(create, deps);
            }
            function useLayoutEffect(create, deps) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useLayoutEffect(create, deps);
            }
            function useCallback(callback, deps) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useCallback(callback, deps);
            }
            function useMemo(create, deps) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useMemo(create, deps);
            }
            function useImperativeHandle(ref, create, deps) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useImperativeHandle(ref, create, deps);
            }
            function useDebugValue(value, formatterFn) {
              {
                var dispatcher = resolveDispatcher();
                return dispatcher.useDebugValue(value, formatterFn);
              }
            }
            function useTransition() {
              var dispatcher = resolveDispatcher();
              return dispatcher.useTransition();
            }
            function useDeferredValue(value) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useDeferredValue(value);
            }
            function useId() {
              var dispatcher = resolveDispatcher();
              return dispatcher.useId();
            }
            function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
              var dispatcher = resolveDispatcher();
              return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
            }
            var disabledDepth = 0;
            var prevLog;
            var prevInfo;
            var prevWarn;
            var prevError;
            var prevGroup;
            var prevGroupCollapsed;
            var prevGroupEnd;
            function disabledLog() {
            }
            disabledLog.__reactDisabledLog = true;
            function disableLogs() {
              {
                if (disabledDepth === 0) {
                  prevLog = console.log;
                  prevInfo = console.info;
                  prevWarn = console.warn;
                  prevError = console.error;
                  prevGroup = console.group;
                  prevGroupCollapsed = console.groupCollapsed;
                  prevGroupEnd = console.groupEnd;
                  var props = {
                    configurable: true,
                    enumerable: true,
                    value: disabledLog,
                    writable: true
                  };
                  Object.defineProperties(console, {
                    info: props,
                    log: props,
                    warn: props,
                    error: props,
                    group: props,
                    groupCollapsed: props,
                    groupEnd: props
                  });
                }
                disabledDepth++;
              }
            }
            function reenableLogs() {
              {
                disabledDepth--;
                if (disabledDepth === 0) {
                  var props = {
                    configurable: true,
                    enumerable: true,
                    writable: true
                  };
                  Object.defineProperties(console, {
                    log: assign({}, props, {
                      value: prevLog
                    }),
                    info: assign({}, props, {
                      value: prevInfo
                    }),
                    warn: assign({}, props, {
                      value: prevWarn
                    }),
                    error: assign({}, props, {
                      value: prevError
                    }),
                    group: assign({}, props, {
                      value: prevGroup
                    }),
                    groupCollapsed: assign({}, props, {
                      value: prevGroupCollapsed
                    }),
                    groupEnd: assign({}, props, {
                      value: prevGroupEnd
                    })
                  });
                }
                if (disabledDepth < 0) {
                  error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
                }
              }
            }
            var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
            var prefix;
            function describeBuiltInComponentFrame(name, source, ownerFn) {
              {
                if (prefix === void 0) {
                  try {
                    throw Error();
                  } catch (x) {
                    var match = x.stack.trim().match(/\n( *(at )?)/);
                    prefix = match && match[1] || "";
                  }
                }
                return "\n" + prefix + name;
              }
            }
            var reentry = false;
            var componentFrameCache;
            {
              var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
              componentFrameCache = new PossiblyWeakMap();
            }
            function describeNativeComponentFrame(fn, construct) {
              if (!fn || reentry) {
                return "";
              }
              {
                var frame = componentFrameCache.get(fn);
                if (frame !== void 0) {
                  return frame;
                }
              }
              var control;
              reentry = true;
              var previousPrepareStackTrace = Error.prepareStackTrace;
              Error.prepareStackTrace = void 0;
              var previousDispatcher;
              {
                previousDispatcher = ReactCurrentDispatcher$1.current;
                ReactCurrentDispatcher$1.current = null;
                disableLogs();
              }
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  });
                  if (typeof Reflect === "object" && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x) {
                      control = x;
                    }
                    fn.call(Fake.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x) {
                    control = x;
                  }
                  fn();
                }
              } catch (sample) {
                if (sample && control && typeof sample.stack === "string") {
                  var sampleLines = sample.stack.split("\n");
                  var controlLines = control.stack.split("\n");
                  var s = sampleLines.length - 1;
                  var c = controlLines.length - 1;
                  while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                    c--;
                  }
                  for (; s >= 1 && c >= 0; s--, c--) {
                    if (sampleLines[s] !== controlLines[c]) {
                      if (s !== 1 || c !== 1) {
                        do {
                          s--;
                          c--;
                          if (c < 0 || sampleLines[s] !== controlLines[c]) {
                            var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                            if (fn.displayName && _frame.includes("<anonymous>")) {
                              _frame = _frame.replace("<anonymous>", fn.displayName);
                            }
                            {
                              if (typeof fn === "function") {
                                componentFrameCache.set(fn, _frame);
                              }
                            }
                            return _frame;
                          }
                        } while (s >= 1 && c >= 0);
                      }
                      break;
                    }
                  }
                }
              } finally {
                reentry = false;
                {
                  ReactCurrentDispatcher$1.current = previousDispatcher;
                  reenableLogs();
                }
                Error.prepareStackTrace = previousPrepareStackTrace;
              }
              var name = fn ? fn.displayName || fn.name : "";
              var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
              {
                if (typeof fn === "function") {
                  componentFrameCache.set(fn, syntheticFrame);
                }
              }
              return syntheticFrame;
            }
            function describeFunctionComponentFrame(fn, source, ownerFn) {
              {
                return describeNativeComponentFrame(fn, false);
              }
            }
            function shouldConstruct(Component2) {
              var prototype = Component2.prototype;
              return !!(prototype && prototype.isReactComponent);
            }
            function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
              if (type == null) {
                return "";
              }
              if (typeof type === "function") {
                {
                  return describeNativeComponentFrame(type, shouldConstruct(type));
                }
              }
              if (typeof type === "string") {
                return describeBuiltInComponentFrame(type);
              }
              switch (type) {
                case REACT_SUSPENSE_TYPE:
                  return describeBuiltInComponentFrame("Suspense");
                case REACT_SUSPENSE_LIST_TYPE:
                  return describeBuiltInComponentFrame("SuspenseList");
              }
              if (typeof type === "object") {
                switch (type.$$typeof) {
                  case REACT_FORWARD_REF_TYPE:
                    return describeFunctionComponentFrame(type.render);
                  case REACT_MEMO_TYPE:
                    return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
                  case REACT_LAZY_TYPE: {
                    var lazyComponent = type;
                    var payload = lazyComponent._payload;
                    var init = lazyComponent._init;
                    try {
                      return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                    } catch (x) {
                    }
                  }
                }
              }
              return "";
            }
            var loggedTypeFailures = {};
            var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
            function setCurrentlyValidatingElement(element) {
              {
                if (element) {
                  var owner = element._owner;
                  var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                  ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
                } else {
                  ReactDebugCurrentFrame$1.setExtraStackFrame(null);
                }
              }
            }
            function checkPropTypes(typeSpecs, values, location, componentName, element) {
              {
                var has = Function.call.bind(hasOwnProperty);
                for (var typeSpecName in typeSpecs) {
                  if (has(typeSpecs, typeSpecName)) {
                    var error$1 = void 0;
                    try {
                      if (typeof typeSpecs[typeSpecName] !== "function") {
                        var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                        err.name = "Invariant Violation";
                        throw err;
                      }
                      error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                    } catch (ex) {
                      error$1 = ex;
                    }
                    if (error$1 && !(error$1 instanceof Error)) {
                      setCurrentlyValidatingElement(element);
                      error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                      setCurrentlyValidatingElement(null);
                    }
                    if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                      loggedTypeFailures[error$1.message] = true;
                      setCurrentlyValidatingElement(element);
                      error("Failed %s type: %s", location, error$1.message);
                      setCurrentlyValidatingElement(null);
                    }
                  }
                }
              }
            }
            function setCurrentlyValidatingElement$1(element) {
              {
                if (element) {
                  var owner = element._owner;
                  var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                  setExtraStackFrame(stack);
                } else {
                  setExtraStackFrame(null);
                }
              }
            }
            var propTypesMisspellWarningShown;
            {
              propTypesMisspellWarningShown = false;
            }
            function getDeclarationErrorAddendum() {
              if (ReactCurrentOwner.current) {
                var name = getComponentNameFromType(ReactCurrentOwner.current.type);
                if (name) {
                  return "\n\nCheck the render method of `" + name + "`.";
                }
              }
              return "";
            }
            function getSourceInfoErrorAddendum(source) {
              if (source !== void 0) {
                var fileName = source.fileName.replace(/^.*[\\\/]/, "");
                var lineNumber = source.lineNumber;
                return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
              }
              return "";
            }
            function getSourceInfoErrorAddendumForProps(elementProps) {
              if (elementProps !== null && elementProps !== void 0) {
                return getSourceInfoErrorAddendum(elementProps.__source);
              }
              return "";
            }
            var ownerHasKeyUseWarning = {};
            function getCurrentComponentErrorInfo(parentType) {
              var info = getDeclarationErrorAddendum();
              if (!info) {
                var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
                if (parentName) {
                  info = "\n\nCheck the top-level render call using <" + parentName + ">.";
                }
              }
              return info;
            }
            function validateExplicitKey(element, parentType) {
              if (!element._store || element._store.validated || element.key != null) {
                return;
              }
              element._store.validated = true;
              var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
              if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
                return;
              }
              ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
              var childOwner = "";
              if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
                childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
              }
              {
                setCurrentlyValidatingElement$1(element);
                error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
                setCurrentlyValidatingElement$1(null);
              }
            }
            function validateChildKeys(node, parentType) {
              if (typeof node !== "object") {
                return;
              }
              if (isArray(node)) {
                for (var i = 0; i < node.length; i++) {
                  var child = node[i];
                  if (isValidElement(child)) {
                    validateExplicitKey(child, parentType);
                  }
                }
              } else if (isValidElement(node)) {
                if (node._store) {
                  node._store.validated = true;
                }
              } else if (node) {
                var iteratorFn = getIteratorFn(node);
                if (typeof iteratorFn === "function") {
                  if (iteratorFn !== node.entries) {
                    var iterator = iteratorFn.call(node);
                    var step;
                    while (!(step = iterator.next()).done) {
                      if (isValidElement(step.value)) {
                        validateExplicitKey(step.value, parentType);
                      }
                    }
                  }
                }
              }
            }
            function validatePropTypes(element) {
              {
                var type = element.type;
                if (type === null || type === void 0 || typeof type === "string") {
                  return;
                }
                var propTypes;
                if (typeof type === "function") {
                  propTypes = type.propTypes;
                } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
                // Inner props are checked in the reconciler.
                type.$$typeof === REACT_MEMO_TYPE)) {
                  propTypes = type.propTypes;
                } else {
                  return;
                }
                if (propTypes) {
                  var name = getComponentNameFromType(type);
                  checkPropTypes(propTypes, element.props, "prop", name, element);
                } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
                  propTypesMisspellWarningShown = true;
                  var _name = getComponentNameFromType(type);
                  error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
                }
                if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
                  error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
                }
              }
            }
            function validateFragmentProps(fragment) {
              {
                var keys = Object.keys(fragment.props);
                for (var i = 0; i < keys.length; i++) {
                  var key = keys[i];
                  if (key !== "children" && key !== "key") {
                    setCurrentlyValidatingElement$1(fragment);
                    error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                    setCurrentlyValidatingElement$1(null);
                    break;
                  }
                }
                if (fragment.ref !== null) {
                  setCurrentlyValidatingElement$1(fragment);
                  error("Invalid attribute `ref` supplied to `React.Fragment`.");
                  setCurrentlyValidatingElement$1(null);
                }
              }
            }
            function createElementWithValidation(type, props, children) {
              var validType = isValidElementType(type);
              if (!validType) {
                var info = "";
                if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                  info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
                }
                var sourceInfo = getSourceInfoErrorAddendumForProps(props);
                if (sourceInfo) {
                  info += sourceInfo;
                } else {
                  info += getDeclarationErrorAddendum();
                }
                var typeString;
                if (type === null) {
                  typeString = "null";
                } else if (isArray(type)) {
                  typeString = "array";
                } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
                  typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
                  info = " Did you accidentally export a JSX literal instead of a component?";
                } else {
                  typeString = typeof type;
                }
                {
                  error("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
                }
              }
              var element = createElement.apply(this, arguments);
              if (element == null) {
                return element;
              }
              if (validType) {
                for (var i = 2; i < arguments.length; i++) {
                  validateChildKeys(arguments[i], type);
                }
              }
              if (type === REACT_FRAGMENT_TYPE) {
                validateFragmentProps(element);
              } else {
                validatePropTypes(element);
              }
              return element;
            }
            var didWarnAboutDeprecatedCreateFactory = false;
            function createFactoryWithValidation(type) {
              var validatedFactory = createElementWithValidation.bind(null, type);
              validatedFactory.type = type;
              {
                if (!didWarnAboutDeprecatedCreateFactory) {
                  didWarnAboutDeprecatedCreateFactory = true;
                  warn("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
                }
                Object.defineProperty(validatedFactory, "type", {
                  enumerable: false,
                  get: function() {
                    warn("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                    Object.defineProperty(this, "type", {
                      value: type
                    });
                    return type;
                  }
                });
              }
              return validatedFactory;
            }
            function cloneElementWithValidation(element, props, children) {
              var newElement = cloneElement.apply(this, arguments);
              for (var i = 2; i < arguments.length; i++) {
                validateChildKeys(arguments[i], newElement.type);
              }
              validatePropTypes(newElement);
              return newElement;
            }
            function startTransition(scope, options) {
              var prevTransition = ReactCurrentBatchConfig.transition;
              ReactCurrentBatchConfig.transition = {};
              var currentTransition = ReactCurrentBatchConfig.transition;
              {
                ReactCurrentBatchConfig.transition._updatedFibers = /* @__PURE__ */ new Set();
              }
              try {
                scope();
              } finally {
                ReactCurrentBatchConfig.transition = prevTransition;
                {
                  if (prevTransition === null && currentTransition._updatedFibers) {
                    var updatedFibersCount = currentTransition._updatedFibers.size;
                    if (updatedFibersCount > 10) {
                      warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                    }
                    currentTransition._updatedFibers.clear();
                  }
                }
              }
            }
            var didWarnAboutMessageChannel = false;
            var enqueueTaskImpl = null;
            function enqueueTask(task) {
              if (enqueueTaskImpl === null) {
                try {
                  var requireString = ("require" + Math.random()).slice(0, 7);
                  var nodeRequire = module && module[requireString];
                  enqueueTaskImpl = nodeRequire.call(module, "timers").setImmediate;
                } catch (_err) {
                  enqueueTaskImpl = function(callback) {
                    {
                      if (didWarnAboutMessageChannel === false) {
                        didWarnAboutMessageChannel = true;
                        if (typeof MessageChannel === "undefined") {
                          error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning.");
                        }
                      }
                    }
                    var channel = new MessageChannel();
                    channel.port1.onmessage = callback;
                    channel.port2.postMessage(void 0);
                  };
                }
              }
              return enqueueTaskImpl(task);
            }
            var actScopeDepth = 0;
            var didWarnNoAwaitAct = false;
            function act(callback) {
              {
                var prevActScopeDepth = actScopeDepth;
                actScopeDepth++;
                if (ReactCurrentActQueue.current === null) {
                  ReactCurrentActQueue.current = [];
                }
                var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
                var result;
                try {
                  ReactCurrentActQueue.isBatchingLegacy = true;
                  result = callback();
                  if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
                    var queue = ReactCurrentActQueue.current;
                    if (queue !== null) {
                      ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                      flushActQueue(queue);
                    }
                  }
                } catch (error2) {
                  popActScope(prevActScopeDepth);
                  throw error2;
                } finally {
                  ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
                }
                if (result !== null && typeof result === "object" && typeof result.then === "function") {
                  var thenableResult = result;
                  var wasAwaited = false;
                  var thenable = {
                    then: function(resolve, reject) {
                      wasAwaited = true;
                      thenableResult.then(function(returnValue2) {
                        popActScope(prevActScopeDepth);
                        if (actScopeDepth === 0) {
                          recursivelyFlushAsyncActWork(returnValue2, resolve, reject);
                        } else {
                          resolve(returnValue2);
                        }
                      }, function(error2) {
                        popActScope(prevActScopeDepth);
                        reject(error2);
                      });
                    }
                  };
                  {
                    if (!didWarnNoAwaitAct && typeof Promise !== "undefined") {
                      Promise.resolve().then(function() {
                      }).then(function() {
                        if (!wasAwaited) {
                          didWarnNoAwaitAct = true;
                          error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);");
                        }
                      });
                    }
                  }
                  return thenable;
                } else {
                  var returnValue = result;
                  popActScope(prevActScopeDepth);
                  if (actScopeDepth === 0) {
                    var _queue = ReactCurrentActQueue.current;
                    if (_queue !== null) {
                      flushActQueue(_queue);
                      ReactCurrentActQueue.current = null;
                    }
                    var _thenable = {
                      then: function(resolve, reject) {
                        if (ReactCurrentActQueue.current === null) {
                          ReactCurrentActQueue.current = [];
                          recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                        } else {
                          resolve(returnValue);
                        }
                      }
                    };
                    return _thenable;
                  } else {
                    var _thenable2 = {
                      then: function(resolve, reject) {
                        resolve(returnValue);
                      }
                    };
                    return _thenable2;
                  }
                }
              }
            }
            function popActScope(prevActScopeDepth) {
              {
                if (prevActScopeDepth !== actScopeDepth - 1) {
                  error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
                }
                actScopeDepth = prevActScopeDepth;
              }
            }
            function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
              {
                var queue = ReactCurrentActQueue.current;
                if (queue !== null) {
                  try {
                    flushActQueue(queue);
                    enqueueTask(function() {
                      if (queue.length === 0) {
                        ReactCurrentActQueue.current = null;
                        resolve(returnValue);
                      } else {
                        recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                      }
                    });
                  } catch (error2) {
                    reject(error2);
                  }
                } else {
                  resolve(returnValue);
                }
              }
            }
            var isFlushing = false;
            function flushActQueue(queue) {
              {
                if (!isFlushing) {
                  isFlushing = true;
                  var i = 0;
                  try {
                    for (; i < queue.length; i++) {
                      var callback = queue[i];
                      do {
                        callback = callback(true);
                      } while (callback !== null);
                    }
                    queue.length = 0;
                  } catch (error2) {
                    queue = queue.slice(i + 1);
                    throw error2;
                  } finally {
                    isFlushing = false;
                  }
                }
              }
            }
            var createElement$1 = createElementWithValidation;
            var cloneElement$1 = cloneElementWithValidation;
            var createFactory = createFactoryWithValidation;
            var Children = {
              map: mapChildren,
              forEach: forEachChildren,
              count: countChildren,
              toArray,
              only: onlyChild
            };
            exports.Children = Children;
            exports.Component = Component;
            exports.Fragment = REACT_FRAGMENT_TYPE;
            exports.Profiler = REACT_PROFILER_TYPE;
            exports.PureComponent = PureComponent;
            exports.StrictMode = REACT_STRICT_MODE_TYPE;
            exports.Suspense = REACT_SUSPENSE_TYPE;
            exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
            exports.cloneElement = cloneElement$1;
            exports.createContext = createContext;
            exports.createElement = createElement$1;
            exports.createFactory = createFactory;
            exports.createRef = createRef;
            exports.forwardRef = forwardRef;
            exports.isValidElement = isValidElement;
            exports.lazy = lazy;
            exports.memo = memo;
            exports.startTransition = startTransition;
            exports.unstable_act = act;
            exports.useCallback = useCallback;
            exports.useContext = useContext;
            exports.useDebugValue = useDebugValue;
            exports.useDeferredValue = useDeferredValue;
            exports.useEffect = useEffect;
            exports.useId = useId;
            exports.useImperativeHandle = useImperativeHandle;
            exports.useInsertionEffect = useInsertionEffect;
            exports.useLayoutEffect = useLayoutEffect;
            exports.useMemo = useMemo;
            exports.useReducer = useReducer;
            exports.useRef = useRef;
            exports.useState = useState;
            exports.useSyncExternalStore = useSyncExternalStore;
            exports.useTransition = useTransition;
            exports.version = ReactVersion;
            if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
              __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
            }
          })();
        }
      }
    });
  
    // node_modules/.pnpm/react@18.2.0/node_modules/react/index.js
    var require_react = __commonJS({
      "node_modules/.pnpm/react@18.2.0/node_modules/react/index.js"(exports, module) {
        "use strict";
        init_modules_watch_stub();
        if (false) {
          module.exports = null;
        } else {
          module.exports = require_react_development();
        }
      }
    });
  
    // node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server-legacy.browser.development.js
    var require_react_dom_server_legacy_browser_development = __commonJS({
      "node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server-legacy.browser.development.js"(exports) {
        "use strict";
        init_modules_watch_stub();
        if (true) {
          (function() {
            "use strict";
            var React3 = require_react();
            var ReactVersion = "18.2.0";
            var ReactSharedInternals = React3.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
            function warn(format) {
              {
                {
                  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                  }
                  printWarning("warn", format, args);
                }
              }
            }
            function error(format) {
              {
                {
                  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                  }
                  printWarning("error", format, args);
                }
              }
            }
            function printWarning(level, format, args) {
              {
                var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
                var stack = ReactDebugCurrentFrame2.getStackAddendum();
                if (stack !== "") {
                  format += "%s";
                  args = args.concat([stack]);
                }
                var argsWithFormat = args.map(function(item) {
                  return String(item);
                });
                argsWithFormat.unshift("Warning: " + format);
                Function.prototype.apply.call(console[level], console, argsWithFormat);
              }
            }
            function scheduleWork(callback) {
              callback();
            }
            function beginWriting(destination) {
            }
            function writeChunk(destination, chunk) {
              writeChunkAndReturn(destination, chunk);
            }
            function writeChunkAndReturn(destination, chunk) {
              return destination.push(chunk);
            }
            function completeWriting(destination) {
            }
            function close(destination) {
              destination.push(null);
            }
            function stringToChunk(content) {
              return content;
            }
            function stringToPrecomputedChunk(content) {
              return content;
            }
            function closeWithError(destination, error2) {
              destination.destroy(error2);
            }
            function typeName(value) {
              {
                var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
                var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
                return type;
              }
            }
            function willCoercionThrow(value) {
              {
                try {
                  testStringCoercion(value);
                  return false;
                } catch (e) {
                  return true;
                }
              }
            }
            function testStringCoercion(value) {
              return "" + value;
            }
            function checkAttributeStringCoercion(value, attributeName) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided `%s` attribute is an unsupported type %s. This value must be coerced to a string before before using it here.", attributeName, typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            function checkCSSPropertyStringCoercion(value, propName) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided `%s` CSS property is an unsupported type %s. This value must be coerced to a string before before using it here.", propName, typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            function checkHtmlStringCoercion(value) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided HTML markup uses a value of unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            var RESERVED = 0;
            var STRING = 1;
            var BOOLEANISH_STRING = 2;
            var BOOLEAN = 3;
            var OVERLOADED_BOOLEAN = 4;
            var NUMERIC = 5;
            var POSITIVE_NUMERIC = 6;
            var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
            var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
            var VALID_ATTRIBUTE_NAME_REGEX = new RegExp("^[" + ATTRIBUTE_NAME_START_CHAR + "][" + ATTRIBUTE_NAME_CHAR + "]*$");
            var illegalAttributeNameCache = {};
            var validatedAttributeNameCache = {};
            function isAttributeNameSafe(attributeName) {
              if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
                return true;
              }
              if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
                return false;
              }
              if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
                validatedAttributeNameCache[attributeName] = true;
                return true;
              }
              illegalAttributeNameCache[attributeName] = true;
              {
                error("Invalid attribute name: `%s`", attributeName);
              }
              return false;
            }
            function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
              if (propertyInfo !== null && propertyInfo.type === RESERVED) {
                return false;
              }
              switch (typeof value) {
                case "function":
                case "symbol":
                  return true;
                case "boolean": {
                  if (isCustomComponentTag) {
                    return false;
                  }
                  if (propertyInfo !== null) {
                    return !propertyInfo.acceptsBooleans;
                  } else {
                    var prefix2 = name.toLowerCase().slice(0, 5);
                    return prefix2 !== "data-" && prefix2 !== "aria-";
                  }
                }
                default:
                  return false;
              }
            }
            function getPropertyInfo(name) {
              return properties.hasOwnProperty(name) ? properties[name] : null;
            }
            function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL2, removeEmptyString) {
              this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
              this.attributeName = attributeName;
              this.attributeNamespace = attributeNamespace;
              this.mustUseProperty = mustUseProperty;
              this.propertyName = name;
              this.type = type;
              this.sanitizeURL = sanitizeURL2;
              this.removeEmptyString = removeEmptyString;
            }
            var properties = {};
            var reservedProps = [
              "children",
              "dangerouslySetInnerHTML",
              // TODO: This prevents the assignment of defaultValue to regular
              // elements (not just inputs). Now that ReactDOMInput assigns to the
              // defaultValue property -- do we need this?
              "defaultValue",
              "defaultChecked",
              "innerHTML",
              "suppressContentEditableWarning",
              "suppressHydrationWarning",
              "style"
            ];
            reservedProps.forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                RESERVED,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(_ref) {
              var name = _ref[0], attributeName = _ref[1];
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEANISH_STRING,
                false,
                // mustUseProperty
                name.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEANISH_STRING,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "allowFullScreen",
              "async",
              // Note: there is a special case that prevents it from being written to the DOM
              // on the client side because the browsers are inconsistent. Instead we call focus().
              "autoFocus",
              "autoPlay",
              "controls",
              "default",
              "defer",
              "disabled",
              "disablePictureInPicture",
              "disableRemotePlayback",
              "formNoValidate",
              "hidden",
              "loop",
              "noModule",
              "noValidate",
              "open",
              "playsInline",
              "readOnly",
              "required",
              "reversed",
              "scoped",
              "seamless",
              // Microdata
              "itemScope"
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEAN,
                false,
                // mustUseProperty
                name.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "checked",
              // Note: `option.selected` is not updated if `select.multiple` is
              // disabled with `removeAttribute`. We have special logic for handling this.
              "multiple",
              "muted",
              "selected"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEAN,
                true,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "capture",
              "download"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                OVERLOADED_BOOLEAN,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "cols",
              "rows",
              "size",
              "span"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                POSITIVE_NUMERIC,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            ["rowSpan", "start"].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                NUMERIC,
                false,
                // mustUseProperty
                name.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            var CAMELIZE = /[\-\:]([a-z])/g;
            var capitalize = function(token) {
              return token[1].toUpperCase();
            };
            [
              "accent-height",
              "alignment-baseline",
              "arabic-form",
              "baseline-shift",
              "cap-height",
              "clip-path",
              "clip-rule",
              "color-interpolation",
              "color-interpolation-filters",
              "color-profile",
              "color-rendering",
              "dominant-baseline",
              "enable-background",
              "fill-opacity",
              "fill-rule",
              "flood-color",
              "flood-opacity",
              "font-family",
              "font-size",
              "font-size-adjust",
              "font-stretch",
              "font-style",
              "font-variant",
              "font-weight",
              "glyph-name",
              "glyph-orientation-horizontal",
              "glyph-orientation-vertical",
              "horiz-adv-x",
              "horiz-origin-x",
              "image-rendering",
              "letter-spacing",
              "lighting-color",
              "marker-end",
              "marker-mid",
              "marker-start",
              "overline-position",
              "overline-thickness",
              "paint-order",
              "panose-1",
              "pointer-events",
              "rendering-intent",
              "shape-rendering",
              "stop-color",
              "stop-opacity",
              "strikethrough-position",
              "strikethrough-thickness",
              "stroke-dasharray",
              "stroke-dashoffset",
              "stroke-linecap",
              "stroke-linejoin",
              "stroke-miterlimit",
              "stroke-opacity",
              "stroke-width",
              "text-anchor",
              "text-decoration",
              "text-rendering",
              "underline-position",
              "underline-thickness",
              "unicode-bidi",
              "unicode-range",
              "units-per-em",
              "v-alphabetic",
              "v-hanging",
              "v-ideographic",
              "v-mathematical",
              "vector-effect",
              "vert-adv-y",
              "vert-origin-x",
              "vert-origin-y",
              "word-spacing",
              "writing-mode",
              "xmlns:xlink",
              "x-height"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(attributeName) {
              var name = attributeName.replace(CAMELIZE, capitalize);
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "xlink:actuate",
              "xlink:arcrole",
              "xlink:role",
              "xlink:show",
              "xlink:title",
              "xlink:type"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(attributeName) {
              var name = attributeName.replace(CAMELIZE, capitalize);
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                "http://www.w3.org/1999/xlink",
                false,
                // sanitizeURL
                false
              );
            });
            [
              "xml:base",
              "xml:lang",
              "xml:space"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(attributeName) {
              var name = attributeName.replace(CAMELIZE, capitalize);
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                "http://www.w3.org/XML/1998/namespace",
                false,
                // sanitizeURL
                false
              );
            });
            ["tabIndex", "crossOrigin"].forEach(function(attributeName) {
              properties[attributeName] = new PropertyInfoRecord(
                attributeName,
                STRING,
                false,
                // mustUseProperty
                attributeName.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            var xlinkHref = "xlinkHref";
            properties[xlinkHref] = new PropertyInfoRecord(
              "xlinkHref",
              STRING,
              false,
              // mustUseProperty
              "xlink:href",
              "http://www.w3.org/1999/xlink",
              true,
              // sanitizeURL
              false
            );
            ["src", "href", "action", "formAction"].forEach(function(attributeName) {
              properties[attributeName] = new PropertyInfoRecord(
                attributeName,
                STRING,
                false,
                // mustUseProperty
                attributeName.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                true,
                // sanitizeURL
                true
              );
            });
            var isUnitlessNumber = {
              animationIterationCount: true,
              aspectRatio: true,
              borderImageOutset: true,
              borderImageSlice: true,
              borderImageWidth: true,
              boxFlex: true,
              boxFlexGroup: true,
              boxOrdinalGroup: true,
              columnCount: true,
              columns: true,
              flex: true,
              flexGrow: true,
              flexPositive: true,
              flexShrink: true,
              flexNegative: true,
              flexOrder: true,
              gridArea: true,
              gridRow: true,
              gridRowEnd: true,
              gridRowSpan: true,
              gridRowStart: true,
              gridColumn: true,
              gridColumnEnd: true,
              gridColumnSpan: true,
              gridColumnStart: true,
              fontWeight: true,
              lineClamp: true,
              lineHeight: true,
              opacity: true,
              order: true,
              orphans: true,
              tabSize: true,
              widows: true,
              zIndex: true,
              zoom: true,
              // SVG-related properties
              fillOpacity: true,
              floodOpacity: true,
              stopOpacity: true,
              strokeDasharray: true,
              strokeDashoffset: true,
              strokeMiterlimit: true,
              strokeOpacity: true,
              strokeWidth: true
            };
            function prefixKey(prefix2, key) {
              return prefix2 + key.charAt(0).toUpperCase() + key.substring(1);
            }
            var prefixes = ["Webkit", "ms", "Moz", "O"];
            Object.keys(isUnitlessNumber).forEach(function(prop) {
              prefixes.forEach(function(prefix2) {
                isUnitlessNumber[prefixKey(prefix2, prop)] = isUnitlessNumber[prop];
              });
            });
            var hasReadOnlyValue = {
              button: true,
              checkbox: true,
              image: true,
              hidden: true,
              radio: true,
              reset: true,
              submit: true
            };
            function checkControlledValueProps(tagName, props) {
              {
                if (!(hasReadOnlyValue[props.type] || props.onChange || props.onInput || props.readOnly || props.disabled || props.value == null)) {
                  error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");
                }
                if (!(props.onChange || props.readOnly || props.disabled || props.checked == null)) {
                  error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
                }
              }
            }
            function isCustomComponent(tagName, props) {
              if (tagName.indexOf("-") === -1) {
                return typeof props.is === "string";
              }
              switch (tagName) {
                case "annotation-xml":
                case "color-profile":
                case "font-face":
                case "font-face-src":
                case "font-face-uri":
                case "font-face-format":
                case "font-face-name":
                case "missing-glyph":
                  return false;
                default:
                  return true;
              }
            }
            var ariaProperties = {
              "aria-current": 0,
              // state
              "aria-description": 0,
              "aria-details": 0,
              "aria-disabled": 0,
              // state
              "aria-hidden": 0,
              // state
              "aria-invalid": 0,
              // state
              "aria-keyshortcuts": 0,
              "aria-label": 0,
              "aria-roledescription": 0,
              // Widget Attributes
              "aria-autocomplete": 0,
              "aria-checked": 0,
              "aria-expanded": 0,
              "aria-haspopup": 0,
              "aria-level": 0,
              "aria-modal": 0,
              "aria-multiline": 0,
              "aria-multiselectable": 0,
              "aria-orientation": 0,
              "aria-placeholder": 0,
              "aria-pressed": 0,
              "aria-readonly": 0,
              "aria-required": 0,
              "aria-selected": 0,
              "aria-sort": 0,
              "aria-valuemax": 0,
              "aria-valuemin": 0,
              "aria-valuenow": 0,
              "aria-valuetext": 0,
              // Live Region Attributes
              "aria-atomic": 0,
              "aria-busy": 0,
              "aria-live": 0,
              "aria-relevant": 0,
              // Drag-and-Drop Attributes
              "aria-dropeffect": 0,
              "aria-grabbed": 0,
              // Relationship Attributes
              "aria-activedescendant": 0,
              "aria-colcount": 0,
              "aria-colindex": 0,
              "aria-colspan": 0,
              "aria-controls": 0,
              "aria-describedby": 0,
              "aria-errormessage": 0,
              "aria-flowto": 0,
              "aria-labelledby": 0,
              "aria-owns": 0,
              "aria-posinset": 0,
              "aria-rowcount": 0,
              "aria-rowindex": 0,
              "aria-rowspan": 0,
              "aria-setsize": 0
            };
            var warnedProperties = {};
            var rARIA = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
            var rARIACamel = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");
            function validateProperty(tagName, name) {
              {
                if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
                  return true;
                }
                if (rARIACamel.test(name)) {
                  var ariaName = "aria-" + name.slice(4).toLowerCase();
                  var correctName = ariaProperties.hasOwnProperty(ariaName) ? ariaName : null;
                  if (correctName == null) {
                    error("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", name);
                    warnedProperties[name] = true;
                    return true;
                  }
                  if (name !== correctName) {
                    error("Invalid ARIA attribute `%s`. Did you mean `%s`?", name, correctName);
                    warnedProperties[name] = true;
                    return true;
                  }
                }
                if (rARIA.test(name)) {
                  var lowerCasedName = name.toLowerCase();
                  var standardName = ariaProperties.hasOwnProperty(lowerCasedName) ? lowerCasedName : null;
                  if (standardName == null) {
                    warnedProperties[name] = true;
                    return false;
                  }
                  if (name !== standardName) {
                    error("Unknown ARIA attribute `%s`. Did you mean `%s`?", name, standardName);
                    warnedProperties[name] = true;
                    return true;
                  }
                }
              }
              return true;
            }
            function warnInvalidARIAProps(type, props) {
              {
                var invalidProps = [];
                for (var key in props) {
                  var isValid = validateProperty(type, key);
                  if (!isValid) {
                    invalidProps.push(key);
                  }
                }
                var unknownPropString = invalidProps.map(function(prop) {
                  return "`" + prop + "`";
                }).join(", ");
                if (invalidProps.length === 1) {
                  error("Invalid aria prop %s on <%s> tag. For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
                } else if (invalidProps.length > 1) {
                  error("Invalid aria props %s on <%s> tag. For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
                }
              }
            }
            function validateProperties(type, props) {
              if (isCustomComponent(type, props)) {
                return;
              }
              warnInvalidARIAProps(type, props);
            }
            var didWarnValueNull = false;
            function validateProperties$1(type, props) {
              {
                if (type !== "input" && type !== "textarea" && type !== "select") {
                  return;
                }
                if (props != null && props.value === null && !didWarnValueNull) {
                  didWarnValueNull = true;
                  if (type === "select" && props.multiple) {
                    error("`value` prop on `%s` should not be null. Consider using an empty array when `multiple` is set to `true` to clear the component or `undefined` for uncontrolled components.", type);
                  } else {
                    error("`value` prop on `%s` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.", type);
                  }
                }
              }
            }
            var possibleStandardNames = {
              // HTML
              accept: "accept",
              acceptcharset: "acceptCharset",
              "accept-charset": "acceptCharset",
              accesskey: "accessKey",
              action: "action",
              allowfullscreen: "allowFullScreen",
              alt: "alt",
              as: "as",
              async: "async",
              autocapitalize: "autoCapitalize",
              autocomplete: "autoComplete",
              autocorrect: "autoCorrect",
              autofocus: "autoFocus",
              autoplay: "autoPlay",
              autosave: "autoSave",
              capture: "capture",
              cellpadding: "cellPadding",
              cellspacing: "cellSpacing",
              challenge: "challenge",
              charset: "charSet",
              checked: "checked",
              children: "children",
              cite: "cite",
              class: "className",
              classid: "classID",
              classname: "className",
              cols: "cols",
              colspan: "colSpan",
              content: "content",
              contenteditable: "contentEditable",
              contextmenu: "contextMenu",
              controls: "controls",
              controlslist: "controlsList",
              coords: "coords",
              crossorigin: "crossOrigin",
              dangerouslysetinnerhtml: "dangerouslySetInnerHTML",
              data: "data",
              datetime: "dateTime",
              default: "default",
              defaultchecked: "defaultChecked",
              defaultvalue: "defaultValue",
              defer: "defer",
              dir: "dir",
              disabled: "disabled",
              disablepictureinpicture: "disablePictureInPicture",
              disableremoteplayback: "disableRemotePlayback",
              download: "download",
              draggable: "draggable",
              enctype: "encType",
              enterkeyhint: "enterKeyHint",
              for: "htmlFor",
              form: "form",
              formmethod: "formMethod",
              formaction: "formAction",
              formenctype: "formEncType",
              formnovalidate: "formNoValidate",
              formtarget: "formTarget",
              frameborder: "frameBorder",
              headers: "headers",
              height: "height",
              hidden: "hidden",
              high: "high",
              href: "href",
              hreflang: "hrefLang",
              htmlfor: "htmlFor",
              httpequiv: "httpEquiv",
              "http-equiv": "httpEquiv",
              icon: "icon",
              id: "id",
              imagesizes: "imageSizes",
              imagesrcset: "imageSrcSet",
              innerhtml: "innerHTML",
              inputmode: "inputMode",
              integrity: "integrity",
              is: "is",
              itemid: "itemID",
              itemprop: "itemProp",
              itemref: "itemRef",
              itemscope: "itemScope",
              itemtype: "itemType",
              keyparams: "keyParams",
              keytype: "keyType",
              kind: "kind",
              label: "label",
              lang: "lang",
              list: "list",
              loop: "loop",
              low: "low",
              manifest: "manifest",
              marginwidth: "marginWidth",
              marginheight: "marginHeight",
              max: "max",
              maxlength: "maxLength",
              media: "media",
              mediagroup: "mediaGroup",
              method: "method",
              min: "min",
              minlength: "minLength",
              multiple: "multiple",
              muted: "muted",
              name: "name",
              nomodule: "noModule",
              nonce: "nonce",
              novalidate: "noValidate",
              open: "open",
              optimum: "optimum",
              pattern: "pattern",
              placeholder: "placeholder",
              playsinline: "playsInline",
              poster: "poster",
              preload: "preload",
              profile: "profile",
              radiogroup: "radioGroup",
              readonly: "readOnly",
              referrerpolicy: "referrerPolicy",
              rel: "rel",
              required: "required",
              reversed: "reversed",
              role: "role",
              rows: "rows",
              rowspan: "rowSpan",
              sandbox: "sandbox",
              scope: "scope",
              scoped: "scoped",
              scrolling: "scrolling",
              seamless: "seamless",
              selected: "selected",
              shape: "shape",
              size: "size",
              sizes: "sizes",
              span: "span",
              spellcheck: "spellCheck",
              src: "src",
              srcdoc: "srcDoc",
              srclang: "srcLang",
              srcset: "srcSet",
              start: "start",
              step: "step",
              style: "style",
              summary: "summary",
              tabindex: "tabIndex",
              target: "target",
              title: "title",
              type: "type",
              usemap: "useMap",
              value: "value",
              width: "width",
              wmode: "wmode",
              wrap: "wrap",
              // SVG
              about: "about",
              accentheight: "accentHeight",
              "accent-height": "accentHeight",
              accumulate: "accumulate",
              additive: "additive",
              alignmentbaseline: "alignmentBaseline",
              "alignment-baseline": "alignmentBaseline",
              allowreorder: "allowReorder",
              alphabetic: "alphabetic",
              amplitude: "amplitude",
              arabicform: "arabicForm",
              "arabic-form": "arabicForm",
              ascent: "ascent",
              attributename: "attributeName",
              attributetype: "attributeType",
              autoreverse: "autoReverse",
              azimuth: "azimuth",
              basefrequency: "baseFrequency",
              baselineshift: "baselineShift",
              "baseline-shift": "baselineShift",
              baseprofile: "baseProfile",
              bbox: "bbox",
              begin: "begin",
              bias: "bias",
              by: "by",
              calcmode: "calcMode",
              capheight: "capHeight",
              "cap-height": "capHeight",
              clip: "clip",
              clippath: "clipPath",
              "clip-path": "clipPath",
              clippathunits: "clipPathUnits",
              cliprule: "clipRule",
              "clip-rule": "clipRule",
              color: "color",
              colorinterpolation: "colorInterpolation",
              "color-interpolation": "colorInterpolation",
              colorinterpolationfilters: "colorInterpolationFilters",
              "color-interpolation-filters": "colorInterpolationFilters",
              colorprofile: "colorProfile",
              "color-profile": "colorProfile",
              colorrendering: "colorRendering",
              "color-rendering": "colorRendering",
              contentscripttype: "contentScriptType",
              contentstyletype: "contentStyleType",
              cursor: "cursor",
              cx: "cx",
              cy: "cy",
              d: "d",
              datatype: "datatype",
              decelerate: "decelerate",
              descent: "descent",
              diffuseconstant: "diffuseConstant",
              direction: "direction",
              display: "display",
              divisor: "divisor",
              dominantbaseline: "dominantBaseline",
              "dominant-baseline": "dominantBaseline",
              dur: "dur",
              dx: "dx",
              dy: "dy",
              edgemode: "edgeMode",
              elevation: "elevation",
              enablebackground: "enableBackground",
              "enable-background": "enableBackground",
              end: "end",
              exponent: "exponent",
              externalresourcesrequired: "externalResourcesRequired",
              fill: "fill",
              fillopacity: "fillOpacity",
              "fill-opacity": "fillOpacity",
              fillrule: "fillRule",
              "fill-rule": "fillRule",
              filter: "filter",
              filterres: "filterRes",
              filterunits: "filterUnits",
              floodopacity: "floodOpacity",
              "flood-opacity": "floodOpacity",
              floodcolor: "floodColor",
              "flood-color": "floodColor",
              focusable: "focusable",
              fontfamily: "fontFamily",
              "font-family": "fontFamily",
              fontsize: "fontSize",
              "font-size": "fontSize",
              fontsizeadjust: "fontSizeAdjust",
              "font-size-adjust": "fontSizeAdjust",
              fontstretch: "fontStretch",
              "font-stretch": "fontStretch",
              fontstyle: "fontStyle",
              "font-style": "fontStyle",
              fontvariant: "fontVariant",
              "font-variant": "fontVariant",
              fontweight: "fontWeight",
              "font-weight": "fontWeight",
              format: "format",
              from: "from",
              fx: "fx",
              fy: "fy",
              g1: "g1",
              g2: "g2",
              glyphname: "glyphName",
              "glyph-name": "glyphName",
              glyphorientationhorizontal: "glyphOrientationHorizontal",
              "glyph-orientation-horizontal": "glyphOrientationHorizontal",
              glyphorientationvertical: "glyphOrientationVertical",
              "glyph-orientation-vertical": "glyphOrientationVertical",
              glyphref: "glyphRef",
              gradienttransform: "gradientTransform",
              gradientunits: "gradientUnits",
              hanging: "hanging",
              horizadvx: "horizAdvX",
              "horiz-adv-x": "horizAdvX",
              horizoriginx: "horizOriginX",
              "horiz-origin-x": "horizOriginX",
              ideographic: "ideographic",
              imagerendering: "imageRendering",
              "image-rendering": "imageRendering",
              in2: "in2",
              in: "in",
              inlist: "inlist",
              intercept: "intercept",
              k1: "k1",
              k2: "k2",
              k3: "k3",
              k4: "k4",
              k: "k",
              kernelmatrix: "kernelMatrix",
              kernelunitlength: "kernelUnitLength",
              kerning: "kerning",
              keypoints: "keyPoints",
              keysplines: "keySplines",
              keytimes: "keyTimes",
              lengthadjust: "lengthAdjust",
              letterspacing: "letterSpacing",
              "letter-spacing": "letterSpacing",
              lightingcolor: "lightingColor",
              "lighting-color": "lightingColor",
              limitingconeangle: "limitingConeAngle",
              local: "local",
              markerend: "markerEnd",
              "marker-end": "markerEnd",
              markerheight: "markerHeight",
              markermid: "markerMid",
              "marker-mid": "markerMid",
              markerstart: "markerStart",
              "marker-start": "markerStart",
              markerunits: "markerUnits",
              markerwidth: "markerWidth",
              mask: "mask",
              maskcontentunits: "maskContentUnits",
              maskunits: "maskUnits",
              mathematical: "mathematical",
              mode: "mode",
              numoctaves: "numOctaves",
              offset: "offset",
              opacity: "opacity",
              operator: "operator",
              order: "order",
              orient: "orient",
              orientation: "orientation",
              origin: "origin",
              overflow: "overflow",
              overlineposition: "overlinePosition",
              "overline-position": "overlinePosition",
              overlinethickness: "overlineThickness",
              "overline-thickness": "overlineThickness",
              paintorder: "paintOrder",
              "paint-order": "paintOrder",
              panose1: "panose1",
              "panose-1": "panose1",
              pathlength: "pathLength",
              patterncontentunits: "patternContentUnits",
              patterntransform: "patternTransform",
              patternunits: "patternUnits",
              pointerevents: "pointerEvents",
              "pointer-events": "pointerEvents",
              points: "points",
              pointsatx: "pointsAtX",
              pointsaty: "pointsAtY",
              pointsatz: "pointsAtZ",
              prefix: "prefix",
              preservealpha: "preserveAlpha",
              preserveaspectratio: "preserveAspectRatio",
              primitiveunits: "primitiveUnits",
              property: "property",
              r: "r",
              radius: "radius",
              refx: "refX",
              refy: "refY",
              renderingintent: "renderingIntent",
              "rendering-intent": "renderingIntent",
              repeatcount: "repeatCount",
              repeatdur: "repeatDur",
              requiredextensions: "requiredExtensions",
              requiredfeatures: "requiredFeatures",
              resource: "resource",
              restart: "restart",
              result: "result",
              results: "results",
              rotate: "rotate",
              rx: "rx",
              ry: "ry",
              scale: "scale",
              security: "security",
              seed: "seed",
              shaperendering: "shapeRendering",
              "shape-rendering": "shapeRendering",
              slope: "slope",
              spacing: "spacing",
              specularconstant: "specularConstant",
              specularexponent: "specularExponent",
              speed: "speed",
              spreadmethod: "spreadMethod",
              startoffset: "startOffset",
              stddeviation: "stdDeviation",
              stemh: "stemh",
              stemv: "stemv",
              stitchtiles: "stitchTiles",
              stopcolor: "stopColor",
              "stop-color": "stopColor",
              stopopacity: "stopOpacity",
              "stop-opacity": "stopOpacity",
              strikethroughposition: "strikethroughPosition",
              "strikethrough-position": "strikethroughPosition",
              strikethroughthickness: "strikethroughThickness",
              "strikethrough-thickness": "strikethroughThickness",
              string: "string",
              stroke: "stroke",
              strokedasharray: "strokeDasharray",
              "stroke-dasharray": "strokeDasharray",
              strokedashoffset: "strokeDashoffset",
              "stroke-dashoffset": "strokeDashoffset",
              strokelinecap: "strokeLinecap",
              "stroke-linecap": "strokeLinecap",
              strokelinejoin: "strokeLinejoin",
              "stroke-linejoin": "strokeLinejoin",
              strokemiterlimit: "strokeMiterlimit",
              "stroke-miterlimit": "strokeMiterlimit",
              strokewidth: "strokeWidth",
              "stroke-width": "strokeWidth",
              strokeopacity: "strokeOpacity",
              "stroke-opacity": "strokeOpacity",
              suppresscontenteditablewarning: "suppressContentEditableWarning",
              suppresshydrationwarning: "suppressHydrationWarning",
              surfacescale: "surfaceScale",
              systemlanguage: "systemLanguage",
              tablevalues: "tableValues",
              targetx: "targetX",
              targety: "targetY",
              textanchor: "textAnchor",
              "text-anchor": "textAnchor",
              textdecoration: "textDecoration",
              "text-decoration": "textDecoration",
              textlength: "textLength",
              textrendering: "textRendering",
              "text-rendering": "textRendering",
              to: "to",
              transform: "transform",
              typeof: "typeof",
              u1: "u1",
              u2: "u2",
              underlineposition: "underlinePosition",
              "underline-position": "underlinePosition",
              underlinethickness: "underlineThickness",
              "underline-thickness": "underlineThickness",
              unicode: "unicode",
              unicodebidi: "unicodeBidi",
              "unicode-bidi": "unicodeBidi",
              unicoderange: "unicodeRange",
              "unicode-range": "unicodeRange",
              unitsperem: "unitsPerEm",
              "units-per-em": "unitsPerEm",
              unselectable: "unselectable",
              valphabetic: "vAlphabetic",
              "v-alphabetic": "vAlphabetic",
              values: "values",
              vectoreffect: "vectorEffect",
              "vector-effect": "vectorEffect",
              version: "version",
              vertadvy: "vertAdvY",
              "vert-adv-y": "vertAdvY",
              vertoriginx: "vertOriginX",
              "vert-origin-x": "vertOriginX",
              vertoriginy: "vertOriginY",
              "vert-origin-y": "vertOriginY",
              vhanging: "vHanging",
              "v-hanging": "vHanging",
              videographic: "vIdeographic",
              "v-ideographic": "vIdeographic",
              viewbox: "viewBox",
              viewtarget: "viewTarget",
              visibility: "visibility",
              vmathematical: "vMathematical",
              "v-mathematical": "vMathematical",
              vocab: "vocab",
              widths: "widths",
              wordspacing: "wordSpacing",
              "word-spacing": "wordSpacing",
              writingmode: "writingMode",
              "writing-mode": "writingMode",
              x1: "x1",
              x2: "x2",
              x: "x",
              xchannelselector: "xChannelSelector",
              xheight: "xHeight",
              "x-height": "xHeight",
              xlinkactuate: "xlinkActuate",
              "xlink:actuate": "xlinkActuate",
              xlinkarcrole: "xlinkArcrole",
              "xlink:arcrole": "xlinkArcrole",
              xlinkhref: "xlinkHref",
              "xlink:href": "xlinkHref",
              xlinkrole: "xlinkRole",
              "xlink:role": "xlinkRole",
              xlinkshow: "xlinkShow",
              "xlink:show": "xlinkShow",
              xlinktitle: "xlinkTitle",
              "xlink:title": "xlinkTitle",
              xlinktype: "xlinkType",
              "xlink:type": "xlinkType",
              xmlbase: "xmlBase",
              "xml:base": "xmlBase",
              xmllang: "xmlLang",
              "xml:lang": "xmlLang",
              xmlns: "xmlns",
              "xml:space": "xmlSpace",
              xmlnsxlink: "xmlnsXlink",
              "xmlns:xlink": "xmlnsXlink",
              xmlspace: "xmlSpace",
              y1: "y1",
              y2: "y2",
              y: "y",
              ychannelselector: "yChannelSelector",
              z: "z",
              zoomandpan: "zoomAndPan"
            };
            var validateProperty$1 = function() {
            };
            {
              var warnedProperties$1 = {};
              var EVENT_NAME_REGEX = /^on./;
              var INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
              var rARIA$1 = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
              var rARIACamel$1 = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");
              validateProperty$1 = function(tagName, name, value, eventRegistry) {
                if (hasOwnProperty.call(warnedProperties$1, name) && warnedProperties$1[name]) {
                  return true;
                }
                var lowerCasedName = name.toLowerCase();
                if (lowerCasedName === "onfocusin" || lowerCasedName === "onfocusout") {
                  error("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React.");
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (eventRegistry != null) {
                  var registrationNameDependencies = eventRegistry.registrationNameDependencies, possibleRegistrationNames = eventRegistry.possibleRegistrationNames;
                  if (registrationNameDependencies.hasOwnProperty(name)) {
                    return true;
                  }
                  var registrationName = possibleRegistrationNames.hasOwnProperty(lowerCasedName) ? possibleRegistrationNames[lowerCasedName] : null;
                  if (registrationName != null) {
                    error("Invalid event handler property `%s`. Did you mean `%s`?", name, registrationName);
                    warnedProperties$1[name] = true;
                    return true;
                  }
                  if (EVENT_NAME_REGEX.test(name)) {
                    error("Unknown event handler property `%s`. It will be ignored.", name);
                    warnedProperties$1[name] = true;
                    return true;
                  }
                } else if (EVENT_NAME_REGEX.test(name)) {
                  if (INVALID_EVENT_NAME_REGEX.test(name)) {
                    error("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", name);
                  }
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (rARIA$1.test(name) || rARIACamel$1.test(name)) {
                  return true;
                }
                if (lowerCasedName === "innerhtml") {
                  error("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`.");
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (lowerCasedName === "aria") {
                  error("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead.");
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (lowerCasedName === "is" && value !== null && value !== void 0 && typeof value !== "string") {
                  error("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof value);
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (typeof value === "number" && isNaN(value)) {
                  error("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", name);
                  warnedProperties$1[name] = true;
                  return true;
                }
                var propertyInfo = getPropertyInfo(name);
                var isReserved = propertyInfo !== null && propertyInfo.type === RESERVED;
                if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
                  var standardName = possibleStandardNames[lowerCasedName];
                  if (standardName !== name) {
                    error("Invalid DOM property `%s`. Did you mean `%s`?", name, standardName);
                    warnedProperties$1[name] = true;
                    return true;
                  }
                } else if (!isReserved && name !== lowerCasedName) {
                  error("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", name, lowerCasedName);
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (typeof value === "boolean" && shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
                  if (value) {
                    error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', value, name, name, value, name);
                  } else {
                    error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', value, name, name, value, name, name, name);
                  }
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (isReserved) {
                  return true;
                }
                if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
                  warnedProperties$1[name] = true;
                  return false;
                }
                if ((value === "false" || value === "true") && propertyInfo !== null && propertyInfo.type === BOOLEAN) {
                  error("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", value, name, value === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', name, value);
                  warnedProperties$1[name] = true;
                  return true;
                }
                return true;
              };
            }
            var warnUnknownProperties = function(type, props, eventRegistry) {
              {
                var unknownProps = [];
                for (var key in props) {
                  var isValid = validateProperty$1(type, key, props[key], eventRegistry);
                  if (!isValid) {
                    unknownProps.push(key);
                  }
                }
                var unknownPropString = unknownProps.map(function(prop) {
                  return "`" + prop + "`";
                }).join(", ");
                if (unknownProps.length === 1) {
                  error("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://reactjs.org/link/attribute-behavior ", unknownPropString, type);
                } else if (unknownProps.length > 1) {
                  error("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://reactjs.org/link/attribute-behavior ", unknownPropString, type);
                }
              }
            };
            function validateProperties$2(type, props, eventRegistry) {
              if (isCustomComponent(type, props)) {
                return;
              }
              warnUnknownProperties(type, props, eventRegistry);
            }
            var warnValidStyle = function() {
            };
            {
              var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
              var msPattern = /^-ms-/;
              var hyphenPattern = /-(.)/g;
              var badStyleValueWithSemicolonPattern = /;\s*$/;
              var warnedStyleNames = {};
              var warnedStyleValues = {};
              var warnedForNaNValue = false;
              var warnedForInfinityValue = false;
              var camelize = function(string) {
                return string.replace(hyphenPattern, function(_, character) {
                  return character.toUpperCase();
                });
              };
              var warnHyphenatedStyleName = function(name) {
                if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
                  return;
                }
                warnedStyleNames[name] = true;
                error(
                  "Unsupported style property %s. Did you mean %s?",
                  name,
                  // As Andi Smith suggests
                  // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
                  // is converted to lowercase `ms`.
                  camelize(name.replace(msPattern, "ms-"))
                );
              };
              var warnBadVendoredStyleName = function(name) {
                if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
                  return;
                }
                warnedStyleNames[name] = true;
                error("Unsupported vendor-prefixed style property %s. Did you mean %s?", name, name.charAt(0).toUpperCase() + name.slice(1));
              };
              var warnStyleValueWithSemicolon = function(name, value) {
                if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
                  return;
                }
                warnedStyleValues[value] = true;
                error(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, name, value.replace(badStyleValueWithSemicolonPattern, ""));
              };
              var warnStyleValueIsNaN = function(name, value) {
                if (warnedForNaNValue) {
                  return;
                }
                warnedForNaNValue = true;
                error("`NaN` is an invalid value for the `%s` css style property.", name);
              };
              var warnStyleValueIsInfinity = function(name, value) {
                if (warnedForInfinityValue) {
                  return;
                }
                warnedForInfinityValue = true;
                error("`Infinity` is an invalid value for the `%s` css style property.", name);
              };
              warnValidStyle = function(name, value) {
                if (name.indexOf("-") > -1) {
                  warnHyphenatedStyleName(name);
                } else if (badVendoredStyleNamePattern.test(name)) {
                  warnBadVendoredStyleName(name);
                } else if (badStyleValueWithSemicolonPattern.test(value)) {
                  warnStyleValueWithSemicolon(name, value);
                }
                if (typeof value === "number") {
                  if (isNaN(value)) {
                    warnStyleValueIsNaN(name, value);
                  } else if (!isFinite(value)) {
                    warnStyleValueIsInfinity(name, value);
                  }
                }
              };
            }
            var warnValidStyle$1 = warnValidStyle;
            var matchHtmlRegExp = /["'&<>]/;
            function escapeHtml(string) {
              {
                checkHtmlStringCoercion(string);
              }
              var str = "" + string;
              var match = matchHtmlRegExp.exec(str);
              if (!match) {
                return str;
              }
              var escape;
              var html = "";
              var index;
              var lastIndex = 0;
              for (index = match.index; index < str.length; index++) {
                switch (str.charCodeAt(index)) {
                  case 34:
                    escape = "&quot;";
                    break;
                  case 38:
                    escape = "&amp;";
                    break;
                  case 39:
                    escape = "&#x27;";
                    break;
                  case 60:
                    escape = "&lt;";
                    break;
                  case 62:
                    escape = "&gt;";
                    break;
                  default:
                    continue;
                }
                if (lastIndex !== index) {
                  html += str.substring(lastIndex, index);
                }
                lastIndex = index + 1;
                html += escape;
              }
              return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
            }
            function escapeTextForBrowser(text) {
              if (typeof text === "boolean" || typeof text === "number") {
                return "" + text;
              }
              return escapeHtml(text);
            }
            var uppercasePattern = /([A-Z])/g;
            var msPattern$1 = /^ms-/;
            function hyphenateStyleName(name) {
              return name.replace(uppercasePattern, "-$1").toLowerCase().replace(msPattern$1, "-ms-");
            }
            var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;
            var didWarn = false;
            function sanitizeURL(url) {
              {
                if (!didWarn && isJavaScriptProtocol.test(url)) {
                  didWarn = true;
                  error("A future version of React will block javascript: URLs as a security precaution. Use event handlers instead if you can. If you need to generate unsafe HTML try using dangerouslySetInnerHTML instead. React was passed %s.", JSON.stringify(url));
                }
              }
            }
            var isArrayImpl = Array.isArray;
            function isArray(a) {
              return isArrayImpl(a);
            }
            var startInlineScript = stringToPrecomputedChunk("<script>");
            var endInlineScript = stringToPrecomputedChunk("<\/script>");
            var startScriptSrc = stringToPrecomputedChunk('<script src="');
            var startModuleSrc = stringToPrecomputedChunk('<script type="module" src="');
            var endAsyncScript = stringToPrecomputedChunk('" async=""><\/script>');
            function escapeBootstrapScriptContent(scriptText) {
              {
                checkHtmlStringCoercion(scriptText);
              }
              return ("" + scriptText).replace(scriptRegex, scriptReplacer);
            }
            var scriptRegex = /(<\/|<)(s)(cript)/gi;
            var scriptReplacer = function(match, prefix2, s, suffix) {
              return "" + prefix2 + (s === "s" ? "\\u0073" : "\\u0053") + suffix;
            };
            function createResponseState(identifierPrefix, nonce, bootstrapScriptContent, bootstrapScripts, bootstrapModules) {
              var idPrefix = identifierPrefix === void 0 ? "" : identifierPrefix;
              var inlineScriptWithNonce = nonce === void 0 ? startInlineScript : stringToPrecomputedChunk('<script nonce="' + escapeTextForBrowser(nonce) + '">');
              var bootstrapChunks = [];
              if (bootstrapScriptContent !== void 0) {
                bootstrapChunks.push(inlineScriptWithNonce, stringToChunk(escapeBootstrapScriptContent(bootstrapScriptContent)), endInlineScript);
              }
              if (bootstrapScripts !== void 0) {
                for (var i = 0; i < bootstrapScripts.length; i++) {
                  bootstrapChunks.push(startScriptSrc, stringToChunk(escapeTextForBrowser(bootstrapScripts[i])), endAsyncScript);
                }
              }
              if (bootstrapModules !== void 0) {
                for (var _i = 0; _i < bootstrapModules.length; _i++) {
                  bootstrapChunks.push(startModuleSrc, stringToChunk(escapeTextForBrowser(bootstrapModules[_i])), endAsyncScript);
                }
              }
              return {
                bootstrapChunks,
                startInlineScript: inlineScriptWithNonce,
                placeholderPrefix: stringToPrecomputedChunk(idPrefix + "P:"),
                segmentPrefix: stringToPrecomputedChunk(idPrefix + "S:"),
                boundaryPrefix: idPrefix + "B:",
                idPrefix,
                nextSuspenseID: 0,
                sentCompleteSegmentFunction: false,
                sentCompleteBoundaryFunction: false,
                sentClientRenderFunction: false
              };
            }
            var ROOT_HTML_MODE = 0;
            var HTML_MODE = 1;
            var SVG_MODE = 2;
            var MATHML_MODE = 3;
            var HTML_TABLE_MODE = 4;
            var HTML_TABLE_BODY_MODE = 5;
            var HTML_TABLE_ROW_MODE = 6;
            var HTML_COLGROUP_MODE = 7;
            function createFormatContext(insertionMode, selectedValue) {
              return {
                insertionMode,
                selectedValue
              };
            }
            function getChildFormatContext(parentContext, type, props) {
              switch (type) {
                case "select":
                  return createFormatContext(HTML_MODE, props.value != null ? props.value : props.defaultValue);
                case "svg":
                  return createFormatContext(SVG_MODE, null);
                case "math":
                  return createFormatContext(MATHML_MODE, null);
                case "foreignObject":
                  return createFormatContext(HTML_MODE, null);
                case "table":
                  return createFormatContext(HTML_TABLE_MODE, null);
                case "thead":
                case "tbody":
                case "tfoot":
                  return createFormatContext(HTML_TABLE_BODY_MODE, null);
                case "colgroup":
                  return createFormatContext(HTML_COLGROUP_MODE, null);
                case "tr":
                  return createFormatContext(HTML_TABLE_ROW_MODE, null);
              }
              if (parentContext.insertionMode >= HTML_TABLE_MODE) {
                return createFormatContext(HTML_MODE, null);
              }
              if (parentContext.insertionMode === ROOT_HTML_MODE) {
                return createFormatContext(HTML_MODE, null);
              }
              return parentContext;
            }
            var UNINITIALIZED_SUSPENSE_BOUNDARY_ID = null;
            function assignSuspenseBoundaryID(responseState) {
              var generatedID = responseState.nextSuspenseID++;
              return stringToPrecomputedChunk(responseState.boundaryPrefix + generatedID.toString(16));
            }
            function makeId(responseState, treeId, localId) {
              var idPrefix = responseState.idPrefix;
              var id = ":" + idPrefix + "R" + treeId;
              if (localId > 0) {
                id += "H" + localId.toString(32);
              }
              return id + ":";
            }
            function encodeHTMLTextNode(text) {
              return escapeTextForBrowser(text);
            }
            var textSeparator = stringToPrecomputedChunk("<!-- -->");
            function pushTextInstance(target, text, responseState, textEmbedded) {
              if (text === "") {
                return textEmbedded;
              }
              if (textEmbedded) {
                target.push(textSeparator);
              }
              target.push(stringToChunk(encodeHTMLTextNode(text)));
              return true;
            }
            function pushSegmentFinale(target, responseState, lastPushedText, textEmbedded) {
              if (lastPushedText && textEmbedded) {
                target.push(textSeparator);
              }
            }
            var styleNameCache = /* @__PURE__ */ new Map();
            function processStyleName(styleName) {
              var chunk = styleNameCache.get(styleName);
              if (chunk !== void 0) {
                return chunk;
              }
              var result = stringToPrecomputedChunk(escapeTextForBrowser(hyphenateStyleName(styleName)));
              styleNameCache.set(styleName, result);
              return result;
            }
            var styleAttributeStart = stringToPrecomputedChunk(' style="');
            var styleAssign = stringToPrecomputedChunk(":");
            var styleSeparator = stringToPrecomputedChunk(";");
            function pushStyle(target, responseState, style) {
              if (typeof style !== "object") {
                throw new Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
              }
              var isFirst = true;
              for (var styleName in style) {
                if (!hasOwnProperty.call(style, styleName)) {
                  continue;
                }
                var styleValue = style[styleName];
                if (styleValue == null || typeof styleValue === "boolean" || styleValue === "") {
                  continue;
                }
                var nameChunk = void 0;
                var valueChunk = void 0;
                var isCustomProperty = styleName.indexOf("--") === 0;
                if (isCustomProperty) {
                  nameChunk = stringToChunk(escapeTextForBrowser(styleName));
                  {
                    checkCSSPropertyStringCoercion(styleValue, styleName);
                  }
                  valueChunk = stringToChunk(escapeTextForBrowser(("" + styleValue).trim()));
                } else {
                  {
                    warnValidStyle$1(styleName, styleValue);
                  }
                  nameChunk = processStyleName(styleName);
                  if (typeof styleValue === "number") {
                    if (styleValue !== 0 && !hasOwnProperty.call(isUnitlessNumber, styleName)) {
                      valueChunk = stringToChunk(styleValue + "px");
                    } else {
                      valueChunk = stringToChunk("" + styleValue);
                    }
                  } else {
                    {
                      checkCSSPropertyStringCoercion(styleValue, styleName);
                    }
                    valueChunk = stringToChunk(escapeTextForBrowser(("" + styleValue).trim()));
                  }
                }
                if (isFirst) {
                  isFirst = false;
                  target.push(styleAttributeStart, nameChunk, styleAssign, valueChunk);
                } else {
                  target.push(styleSeparator, nameChunk, styleAssign, valueChunk);
                }
              }
              if (!isFirst) {
                target.push(attributeEnd);
              }
            }
            var attributeSeparator = stringToPrecomputedChunk(" ");
            var attributeAssign = stringToPrecomputedChunk('="');
            var attributeEnd = stringToPrecomputedChunk('"');
            var attributeEmptyString = stringToPrecomputedChunk('=""');
            function pushAttribute(target, responseState, name, value) {
              switch (name) {
                case "style": {
                  pushStyle(target, responseState, value);
                  return;
                }
                case "defaultValue":
                case "defaultChecked":
                case "innerHTML":
                case "suppressContentEditableWarning":
                case "suppressHydrationWarning":
                  return;
              }
              if (
                // shouldIgnoreAttribute
                // We have already filtered out null/undefined and reserved words.
                name.length > 2 && (name[0] === "o" || name[0] === "O") && (name[1] === "n" || name[1] === "N")
              ) {
                return;
              }
              var propertyInfo = getPropertyInfo(name);
              if (propertyInfo !== null) {
                switch (typeof value) {
                  case "function":
                  case "symbol":
                    return;
                  case "boolean": {
                    if (!propertyInfo.acceptsBooleans) {
                      return;
                    }
                  }
                }
                var attributeName = propertyInfo.attributeName;
                var attributeNameChunk = stringToChunk(attributeName);
                switch (propertyInfo.type) {
                  case BOOLEAN:
                    if (value) {
                      target.push(attributeSeparator, attributeNameChunk, attributeEmptyString);
                    }
                    return;
                  case OVERLOADED_BOOLEAN:
                    if (value === true) {
                      target.push(attributeSeparator, attributeNameChunk, attributeEmptyString);
                    } else if (value === false)
                      ;
                    else {
                      target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                    }
                    return;
                  case NUMERIC:
                    if (!isNaN(value)) {
                      target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                    }
                    break;
                  case POSITIVE_NUMERIC:
                    if (!isNaN(value) && value >= 1) {
                      target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                    }
                    break;
                  default:
                    if (propertyInfo.sanitizeURL) {
                      {
                        checkAttributeStringCoercion(value, attributeName);
                      }
                      value = "" + value;
                      sanitizeURL(value);
                    }
                    target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                }
              } else if (isAttributeNameSafe(name)) {
                switch (typeof value) {
                  case "function":
                  case "symbol":
                    return;
                  case "boolean": {
                    var prefix2 = name.toLowerCase().slice(0, 5);
                    if (prefix2 !== "data-" && prefix2 !== "aria-") {
                      return;
                    }
                  }
                }
                target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
              }
            }
            var endOfStartTag = stringToPrecomputedChunk(">");
            var endOfStartTagSelfClosing = stringToPrecomputedChunk("/>");
            function pushInnerHTML(target, innerHTML, children) {
              if (innerHTML != null) {
                if (children != null) {
                  throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
                }
                if (typeof innerHTML !== "object" || !("__html" in innerHTML)) {
                  throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.");
                }
                var html = innerHTML.__html;
                if (html !== null && html !== void 0) {
                  {
                    checkHtmlStringCoercion(html);
                  }
                  target.push(stringToChunk("" + html));
                }
              }
            }
            var didWarnDefaultInputValue = false;
            var didWarnDefaultChecked = false;
            var didWarnDefaultSelectValue = false;
            var didWarnDefaultTextareaValue = false;
            var didWarnInvalidOptionChildren = false;
            var didWarnInvalidOptionInnerHTML = false;
            var didWarnSelectedSetOnOption = false;
            function checkSelectProp(props, propName) {
              {
                var value = props[propName];
                if (value != null) {
                  var array = isArray(value);
                  if (props.multiple && !array) {
                    error("The `%s` prop supplied to <select> must be an array if `multiple` is true.", propName);
                  } else if (!props.multiple && array) {
                    error("The `%s` prop supplied to <select> must be a scalar value if `multiple` is false.", propName);
                  }
                }
              }
            }
            function pushStartSelect(target, props, responseState) {
              {
                checkControlledValueProps("select", props);
                checkSelectProp(props, "value");
                checkSelectProp(props, "defaultValue");
                if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnDefaultSelectValue) {
                  error("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://reactjs.org/link/controlled-components");
                  didWarnDefaultSelectValue = true;
                }
              }
              target.push(startChunkForTag("select"));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    case "defaultValue":
                    case "value":
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              return children;
            }
            function flattenOptionChildren(children) {
              var content = "";
              React3.Children.forEach(children, function(child) {
                if (child == null) {
                  return;
                }
                content += child;
                {
                  if (!didWarnInvalidOptionChildren && typeof child !== "string" && typeof child !== "number") {
                    didWarnInvalidOptionChildren = true;
                    error("Cannot infer the option value of complex children. Pass a `value` prop or use a plain string as children to <option>.");
                  }
                }
              });
              return content;
            }
            var selectedMarkerAttribute = stringToPrecomputedChunk(' selected=""');
            function pushStartOption(target, props, responseState, formatContext) {
              var selectedValue = formatContext.selectedValue;
              target.push(startChunkForTag("option"));
              var children = null;
              var value = null;
              var selected = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "selected":
                      selected = propValue;
                      {
                        if (!didWarnSelectedSetOnOption) {
                          error("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>.");
                          didWarnSelectedSetOnOption = true;
                        }
                      }
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    case "value":
                      value = propValue;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              if (selectedValue != null) {
                var stringValue;
                if (value !== null) {
                  {
                    checkAttributeStringCoercion(value, "value");
                  }
                  stringValue = "" + value;
                } else {
                  {
                    if (innerHTML !== null) {
                      if (!didWarnInvalidOptionInnerHTML) {
                        didWarnInvalidOptionInnerHTML = true;
                        error("Pass a `value` prop if you set dangerouslyInnerHTML so React knows which value should be selected.");
                      }
                    }
                  }
                  stringValue = flattenOptionChildren(children);
                }
                if (isArray(selectedValue)) {
                  for (var i = 0; i < selectedValue.length; i++) {
                    {
                      checkAttributeStringCoercion(selectedValue[i], "value");
                    }
                    var v = "" + selectedValue[i];
                    if (v === stringValue) {
                      target.push(selectedMarkerAttribute);
                      break;
                    }
                  }
                } else {
                  {
                    checkAttributeStringCoercion(selectedValue, "select.value");
                  }
                  if ("" + selectedValue === stringValue) {
                    target.push(selectedMarkerAttribute);
                  }
                }
              } else if (selected) {
                target.push(selectedMarkerAttribute);
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              return children;
            }
            function pushInput(target, props, responseState) {
              {
                checkControlledValueProps("input", props);
                if (props.checked !== void 0 && props.defaultChecked !== void 0 && !didWarnDefaultChecked) {
                  error("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://reactjs.org/link/controlled-components", "A component", props.type);
                  didWarnDefaultChecked = true;
                }
                if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnDefaultInputValue) {
                  error("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://reactjs.org/link/controlled-components", "A component", props.type);
                  didWarnDefaultInputValue = true;
                }
              }
              target.push(startChunkForTag("input"));
              var value = null;
              var defaultValue = null;
              var checked = null;
              var defaultChecked = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw new Error("input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
                    case "defaultChecked":
                      defaultChecked = propValue;
                      break;
                    case "defaultValue":
                      defaultValue = propValue;
                      break;
                    case "checked":
                      checked = propValue;
                      break;
                    case "value":
                      value = propValue;
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              if (checked !== null) {
                pushAttribute(target, responseState, "checked", checked);
              } else if (defaultChecked !== null) {
                pushAttribute(target, responseState, "checked", defaultChecked);
              }
              if (value !== null) {
                pushAttribute(target, responseState, "value", value);
              } else if (defaultValue !== null) {
                pushAttribute(target, responseState, "value", defaultValue);
              }
              target.push(endOfStartTagSelfClosing);
              return null;
            }
            function pushStartTextArea(target, props, responseState) {
              {
                checkControlledValueProps("textarea", props);
                if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnDefaultTextareaValue) {
                  error("Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://reactjs.org/link/controlled-components");
                  didWarnDefaultTextareaValue = true;
                }
              }
              target.push(startChunkForTag("textarea"));
              var value = null;
              var defaultValue = null;
              var children = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "value":
                      value = propValue;
                      break;
                    case "defaultValue":
                      defaultValue = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      throw new Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              if (value === null && defaultValue !== null) {
                value = defaultValue;
              }
              target.push(endOfStartTag);
              if (children != null) {
                {
                  error("Use the `defaultValue` or `value` props instead of setting children on <textarea>.");
                }
                if (value != null) {
                  throw new Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
                }
                if (isArray(children)) {
                  if (children.length > 1) {
                    throw new Error("<textarea> can only have at most one child.");
                  }
                  {
                    checkHtmlStringCoercion(children[0]);
                  }
                  value = "" + children[0];
                }
                {
                  checkHtmlStringCoercion(children);
                }
                value = "" + children;
              }
              if (typeof value === "string" && value[0] === "\n") {
                target.push(leadingNewline);
              }
              if (value !== null) {
                {
                  checkAttributeStringCoercion(value, "value");
                }
                target.push(stringToChunk(encodeHTMLTextNode("" + value)));
              }
              return null;
            }
            function pushSelfClosing(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw new Error(tag + " is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTagSelfClosing);
              return null;
            }
            function pushStartMenuItem(target, props, responseState) {
              target.push(startChunkForTag("menuitem"));
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw new Error("menuitems cannot have `children` nor `dangerouslySetInnerHTML`.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              return null;
            }
            function pushStartTitle(target, props, responseState) {
              target.push(startChunkForTag("title"));
              var children = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      throw new Error("`dangerouslySetInnerHTML` does not make sense on <title>.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              {
                var child = Array.isArray(children) && children.length < 2 ? children[0] || null : children;
                if (Array.isArray(children) && children.length > 1) {
                  error("A title element received an array with more than 1 element as children. In browsers title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering");
                } else if (child != null && child.$$typeof != null) {
                  error("A title element received a React element for children. In the browser title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering");
                } else if (child != null && typeof child !== "string" && typeof child !== "number") {
                  error("A title element received a value that was not a string or number for children. In the browser title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering");
                }
              }
              return children;
            }
            function pushStartGenericElement(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              if (typeof children === "string") {
                target.push(stringToChunk(encodeHTMLTextNode(children)));
                return null;
              }
              return children;
            }
            function pushStartCustomElement(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    case "style":
                      pushStyle(target, responseState, propValue);
                      break;
                    case "suppressContentEditableWarning":
                    case "suppressHydrationWarning":
                      break;
                    default:
                      if (isAttributeNameSafe(propKey) && typeof propValue !== "function" && typeof propValue !== "symbol") {
                        target.push(attributeSeparator, stringToChunk(propKey), attributeAssign, stringToChunk(escapeTextForBrowser(propValue)), attributeEnd);
                      }
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              return children;
            }
            var leadingNewline = stringToPrecomputedChunk("\n");
            function pushStartPreformattedElement(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              if (innerHTML != null) {
                if (children != null) {
                  throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
                }
                if (typeof innerHTML !== "object" || !("__html" in innerHTML)) {
                  throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.");
                }
                var html = innerHTML.__html;
                if (html !== null && html !== void 0) {
                  if (typeof html === "string" && html.length > 0 && html[0] === "\n") {
                    target.push(leadingNewline, stringToChunk(html));
                  } else {
                    {
                      checkHtmlStringCoercion(html);
                    }
                    target.push(stringToChunk("" + html));
                  }
                }
              }
              if (typeof children === "string" && children[0] === "\n") {
                target.push(leadingNewline);
              }
              return children;
            }
            var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/;
            var validatedTagCache = /* @__PURE__ */ new Map();
            function startChunkForTag(tag) {
              var tagStartChunk = validatedTagCache.get(tag);
              if (tagStartChunk === void 0) {
                if (!VALID_TAG_REGEX.test(tag)) {
                  throw new Error("Invalid tag: " + tag);
                }
                tagStartChunk = stringToPrecomputedChunk("<" + tag);
                validatedTagCache.set(tag, tagStartChunk);
              }
              return tagStartChunk;
            }
            var DOCTYPE = stringToPrecomputedChunk("<!DOCTYPE html>");
            function pushStartInstance(target, type, props, responseState, formatContext) {
              {
                validateProperties(type, props);
                validateProperties$1(type, props);
                validateProperties$2(type, props, null);
                if (!props.suppressContentEditableWarning && props.contentEditable && props.children != null) {
                  error("A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional.");
                }
                if (formatContext.insertionMode !== SVG_MODE && formatContext.insertionMode !== MATHML_MODE) {
                  if (type.indexOf("-") === -1 && typeof props.is !== "string" && type.toLowerCase() !== type) {
                    error("<%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.", type);
                  }
                }
              }
              switch (type) {
                case "select":
                  return pushStartSelect(target, props, responseState);
                case "option":
                  return pushStartOption(target, props, responseState, formatContext);
                case "textarea":
                  return pushStartTextArea(target, props, responseState);
                case "input":
                  return pushInput(target, props, responseState);
                case "menuitem":
                  return pushStartMenuItem(target, props, responseState);
                case "title":
                  return pushStartTitle(target, props, responseState);
                case "listing":
                case "pre": {
                  return pushStartPreformattedElement(target, props, type, responseState);
                }
                case "area":
                case "base":
                case "br":
                case "col":
                case "embed":
                case "hr":
                case "img":
                case "keygen":
                case "link":
                case "meta":
                case "param":
                case "source":
                case "track":
                case "wbr": {
                  return pushSelfClosing(target, props, type, responseState);
                }
                case "annotation-xml":
                case "color-profile":
                case "font-face":
                case "font-face-src":
                case "font-face-uri":
                case "font-face-format":
                case "font-face-name":
                case "missing-glyph": {
                  return pushStartGenericElement(target, props, type, responseState);
                }
                case "html": {
                  if (formatContext.insertionMode === ROOT_HTML_MODE) {
                    target.push(DOCTYPE);
                  }
                  return pushStartGenericElement(target, props, type, responseState);
                }
                default: {
                  if (type.indexOf("-") === -1 && typeof props.is !== "string") {
                    return pushStartGenericElement(target, props, type, responseState);
                  } else {
                    return pushStartCustomElement(target, props, type, responseState);
                  }
                }
              }
            }
            var endTag1 = stringToPrecomputedChunk("</");
            var endTag2 = stringToPrecomputedChunk(">");
            function pushEndInstance(target, type, props) {
              switch (type) {
                case "area":
                case "base":
                case "br":
                case "col":
                case "embed":
                case "hr":
                case "img":
                case "input":
                case "keygen":
                case "link":
                case "meta":
                case "param":
                case "source":
                case "track":
                case "wbr": {
                  break;
                }
                default: {
                  target.push(endTag1, stringToChunk(type), endTag2);
                }
              }
            }
            function writeCompletedRoot(destination, responseState) {
              var bootstrapChunks = responseState.bootstrapChunks;
              var i = 0;
              for (; i < bootstrapChunks.length - 1; i++) {
                writeChunk(destination, bootstrapChunks[i]);
              }
              if (i < bootstrapChunks.length) {
                return writeChunkAndReturn(destination, bootstrapChunks[i]);
              }
              return true;
            }
            var placeholder1 = stringToPrecomputedChunk('<template id="');
            var placeholder2 = stringToPrecomputedChunk('"></template>');
            function writePlaceholder(destination, responseState, id) {
              writeChunk(destination, placeholder1);
              writeChunk(destination, responseState.placeholderPrefix);
              var formattedID = stringToChunk(id.toString(16));
              writeChunk(destination, formattedID);
              return writeChunkAndReturn(destination, placeholder2);
            }
            var startCompletedSuspenseBoundary = stringToPrecomputedChunk("<!--$-->");
            var startPendingSuspenseBoundary1 = stringToPrecomputedChunk('<!--$?--><template id="');
            var startPendingSuspenseBoundary2 = stringToPrecomputedChunk('"></template>');
            var startClientRenderedSuspenseBoundary = stringToPrecomputedChunk("<!--$!-->");
            var endSuspenseBoundary = stringToPrecomputedChunk("<!--/$-->");
            var clientRenderedSuspenseBoundaryError1 = stringToPrecomputedChunk("<template");
            var clientRenderedSuspenseBoundaryErrorAttrInterstitial = stringToPrecomputedChunk('"');
            var clientRenderedSuspenseBoundaryError1A = stringToPrecomputedChunk(' data-dgst="');
            var clientRenderedSuspenseBoundaryError1B = stringToPrecomputedChunk(' data-msg="');
            var clientRenderedSuspenseBoundaryError1C = stringToPrecomputedChunk(' data-stck="');
            var clientRenderedSuspenseBoundaryError2 = stringToPrecomputedChunk("></template>");
            function writeStartCompletedSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
            }
            function writeStartPendingSuspenseBoundary(destination, responseState, id) {
              writeChunk(destination, startPendingSuspenseBoundary1);
              if (id === null) {
                throw new Error("An ID must have been assigned before we can complete the boundary.");
              }
              writeChunk(destination, id);
              return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
            }
            function writeStartClientRenderedSuspenseBoundary(destination, responseState, errorDigest, errorMesssage, errorComponentStack) {
              var result;
              result = writeChunkAndReturn(destination, startClientRenderedSuspenseBoundary);
              writeChunk(destination, clientRenderedSuspenseBoundaryError1);
              if (errorDigest) {
                writeChunk(destination, clientRenderedSuspenseBoundaryError1A);
                writeChunk(destination, stringToChunk(escapeTextForBrowser(errorDigest)));
                writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
              }
              {
                if (errorMesssage) {
                  writeChunk(destination, clientRenderedSuspenseBoundaryError1B);
                  writeChunk(destination, stringToChunk(escapeTextForBrowser(errorMesssage)));
                  writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
                }
                if (errorComponentStack) {
                  writeChunk(destination, clientRenderedSuspenseBoundaryError1C);
                  writeChunk(destination, stringToChunk(escapeTextForBrowser(errorComponentStack)));
                  writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
                }
              }
              result = writeChunkAndReturn(destination, clientRenderedSuspenseBoundaryError2);
              return result;
            }
            function writeEndCompletedSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, endSuspenseBoundary);
            }
            function writeEndPendingSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, endSuspenseBoundary);
            }
            function writeEndClientRenderedSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, endSuspenseBoundary);
            }
            var startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
            var startSegmentHTML2 = stringToPrecomputedChunk('">');
            var endSegmentHTML = stringToPrecomputedChunk("</div>");
            var startSegmentSVG = stringToPrecomputedChunk('<svg aria-hidden="true" style="display:none" id="');
            var startSegmentSVG2 = stringToPrecomputedChunk('">');
            var endSegmentSVG = stringToPrecomputedChunk("</svg>");
            var startSegmentMathML = stringToPrecomputedChunk('<math aria-hidden="true" style="display:none" id="');
            var startSegmentMathML2 = stringToPrecomputedChunk('">');
            var endSegmentMathML = stringToPrecomputedChunk("</math>");
            var startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
            var startSegmentTable2 = stringToPrecomputedChunk('">');
            var endSegmentTable = stringToPrecomputedChunk("</table>");
            var startSegmentTableBody = stringToPrecomputedChunk('<table hidden><tbody id="');
            var startSegmentTableBody2 = stringToPrecomputedChunk('">');
            var endSegmentTableBody = stringToPrecomputedChunk("</tbody></table>");
            var startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
            var startSegmentTableRow2 = stringToPrecomputedChunk('">');
            var endSegmentTableRow = stringToPrecomputedChunk("</tr></table>");
            var startSegmentColGroup = stringToPrecomputedChunk('<table hidden><colgroup id="');
            var startSegmentColGroup2 = stringToPrecomputedChunk('">');
            var endSegmentColGroup = stringToPrecomputedChunk("</colgroup></table>");
            function writeStartSegment(destination, responseState, formatContext, id) {
              switch (formatContext.insertionMode) {
                case ROOT_HTML_MODE:
                case HTML_MODE: {
                  writeChunk(destination, startSegmentHTML);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentHTML2);
                }
                case SVG_MODE: {
                  writeChunk(destination, startSegmentSVG);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentSVG2);
                }
                case MATHML_MODE: {
                  writeChunk(destination, startSegmentMathML);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentMathML2);
                }
                case HTML_TABLE_MODE: {
                  writeChunk(destination, startSegmentTable);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentTable2);
                }
                case HTML_TABLE_BODY_MODE: {
                  writeChunk(destination, startSegmentTableBody);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentTableBody2);
                }
                case HTML_TABLE_ROW_MODE: {
                  writeChunk(destination, startSegmentTableRow);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentTableRow2);
                }
                case HTML_COLGROUP_MODE: {
                  writeChunk(destination, startSegmentColGroup);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentColGroup2);
                }
                default: {
                  throw new Error("Unknown insertion mode. This is a bug in React.");
                }
              }
            }
            function writeEndSegment(destination, formatContext) {
              switch (formatContext.insertionMode) {
                case ROOT_HTML_MODE:
                case HTML_MODE: {
                  return writeChunkAndReturn(destination, endSegmentHTML);
                }
                case SVG_MODE: {
                  return writeChunkAndReturn(destination, endSegmentSVG);
                }
                case MATHML_MODE: {
                  return writeChunkAndReturn(destination, endSegmentMathML);
                }
                case HTML_TABLE_MODE: {
                  return writeChunkAndReturn(destination, endSegmentTable);
                }
                case HTML_TABLE_BODY_MODE: {
                  return writeChunkAndReturn(destination, endSegmentTableBody);
                }
                case HTML_TABLE_ROW_MODE: {
                  return writeChunkAndReturn(destination, endSegmentTableRow);
                }
                case HTML_COLGROUP_MODE: {
                  return writeChunkAndReturn(destination, endSegmentColGroup);
                }
                default: {
                  throw new Error("Unknown insertion mode. This is a bug in React.");
                }
              }
            }
            var completeSegmentFunction = "function $RS(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)}";
            var completeBoundaryFunction = 'function $RC(a,b){a=document.getElementById(a);b=document.getElementById(b);b.parentNode.removeChild(b);if(a){a=a.previousSibling;var f=a.parentNode,c=a.nextSibling,e=0;do{if(c&&8===c.nodeType){var d=c.data;if("/$"===d)if(0===e)break;else e--;else"$"!==d&&"$?"!==d&&"$!"!==d||e++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;b.firstChild;)f.insertBefore(b.firstChild,c);a.data="$";a._reactRetry&&a._reactRetry()}}';
            var clientRenderFunction = 'function $RX(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())}';
            var completeSegmentScript1Full = stringToPrecomputedChunk(completeSegmentFunction + ';$RS("');
            var completeSegmentScript1Partial = stringToPrecomputedChunk('$RS("');
            var completeSegmentScript2 = stringToPrecomputedChunk('","');
            var completeSegmentScript3 = stringToPrecomputedChunk('")<\/script>');
            function writeCompletedSegmentInstruction(destination, responseState, contentSegmentID) {
              writeChunk(destination, responseState.startInlineScript);
              if (!responseState.sentCompleteSegmentFunction) {
                responseState.sentCompleteSegmentFunction = true;
                writeChunk(destination, completeSegmentScript1Full);
              } else {
                writeChunk(destination, completeSegmentScript1Partial);
              }
              writeChunk(destination, responseState.segmentPrefix);
              var formattedID = stringToChunk(contentSegmentID.toString(16));
              writeChunk(destination, formattedID);
              writeChunk(destination, completeSegmentScript2);
              writeChunk(destination, responseState.placeholderPrefix);
              writeChunk(destination, formattedID);
              return writeChunkAndReturn(destination, completeSegmentScript3);
            }
            var completeBoundaryScript1Full = stringToPrecomputedChunk(completeBoundaryFunction + ';$RC("');
            var completeBoundaryScript1Partial = stringToPrecomputedChunk('$RC("');
            var completeBoundaryScript2 = stringToPrecomputedChunk('","');
            var completeBoundaryScript3 = stringToPrecomputedChunk('")<\/script>');
            function writeCompletedBoundaryInstruction(destination, responseState, boundaryID, contentSegmentID) {
              writeChunk(destination, responseState.startInlineScript);
              if (!responseState.sentCompleteBoundaryFunction) {
                responseState.sentCompleteBoundaryFunction = true;
                writeChunk(destination, completeBoundaryScript1Full);
              } else {
                writeChunk(destination, completeBoundaryScript1Partial);
              }
              if (boundaryID === null) {
                throw new Error("An ID must have been assigned before we can complete the boundary.");
              }
              var formattedContentID = stringToChunk(contentSegmentID.toString(16));
              writeChunk(destination, boundaryID);
              writeChunk(destination, completeBoundaryScript2);
              writeChunk(destination, responseState.segmentPrefix);
              writeChunk(destination, formattedContentID);
              return writeChunkAndReturn(destination, completeBoundaryScript3);
            }
            var clientRenderScript1Full = stringToPrecomputedChunk(clientRenderFunction + ';$RX("');
            var clientRenderScript1Partial = stringToPrecomputedChunk('$RX("');
            var clientRenderScript1A = stringToPrecomputedChunk('"');
            var clientRenderScript2 = stringToPrecomputedChunk(")<\/script>");
            var clientRenderErrorScriptArgInterstitial = stringToPrecomputedChunk(",");
            function writeClientRenderBoundaryInstruction(destination, responseState, boundaryID, errorDigest, errorMessage, errorComponentStack) {
              writeChunk(destination, responseState.startInlineScript);
              if (!responseState.sentClientRenderFunction) {
                responseState.sentClientRenderFunction = true;
                writeChunk(destination, clientRenderScript1Full);
              } else {
                writeChunk(destination, clientRenderScript1Partial);
              }
              if (boundaryID === null) {
                throw new Error("An ID must have been assigned before we can complete the boundary.");
              }
              writeChunk(destination, boundaryID);
              writeChunk(destination, clientRenderScript1A);
              if (errorDigest || errorMessage || errorComponentStack) {
                writeChunk(destination, clientRenderErrorScriptArgInterstitial);
                writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorDigest || "")));
              }
              if (errorMessage || errorComponentStack) {
                writeChunk(destination, clientRenderErrorScriptArgInterstitial);
                writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorMessage || "")));
              }
              if (errorComponentStack) {
                writeChunk(destination, clientRenderErrorScriptArgInterstitial);
                writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorComponentStack)));
              }
              return writeChunkAndReturn(destination, clientRenderScript2);
            }
            var regexForJSStringsInScripts = /[<\u2028\u2029]/g;
            function escapeJSStringsForInstructionScripts(input) {
              var escaped = JSON.stringify(input);
              return escaped.replace(regexForJSStringsInScripts, function(match) {
                switch (match) {
                  case "<":
                    return "\\u003c";
                  case "\u2028":
                    return "\\u2028";
                  case "\u2029":
                    return "\\u2029";
                  default: {
                    throw new Error("escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
                  }
                }
              });
            }
            function createResponseState$1(generateStaticMarkup, identifierPrefix) {
              var responseState = createResponseState(identifierPrefix, void 0);
              return {
                // Keep this in sync with ReactDOMServerFormatConfig
                bootstrapChunks: responseState.bootstrapChunks,
                startInlineScript: responseState.startInlineScript,
                placeholderPrefix: responseState.placeholderPrefix,
                segmentPrefix: responseState.segmentPrefix,
                boundaryPrefix: responseState.boundaryPrefix,
                idPrefix: responseState.idPrefix,
                nextSuspenseID: responseState.nextSuspenseID,
                sentCompleteSegmentFunction: responseState.sentCompleteSegmentFunction,
                sentCompleteBoundaryFunction: responseState.sentCompleteBoundaryFunction,
                sentClientRenderFunction: responseState.sentClientRenderFunction,
                // This is an extra field for the legacy renderer
                generateStaticMarkup
              };
            }
            function createRootFormatContext() {
              return {
                insertionMode: HTML_MODE,
                // We skip the root mode because we don't want to emit the DOCTYPE in legacy mode.
                selectedValue: null
              };
            }
            function pushTextInstance$1(target, text, responseState, textEmbedded) {
              if (responseState.generateStaticMarkup) {
                target.push(stringToChunk(escapeTextForBrowser(text)));
                return false;
              } else {
                return pushTextInstance(target, text, responseState, textEmbedded);
              }
            }
            function pushSegmentFinale$1(target, responseState, lastPushedText, textEmbedded) {
              if (responseState.generateStaticMarkup) {
                return;
              } else {
                return pushSegmentFinale(target, responseState, lastPushedText, textEmbedded);
              }
            }
            function writeStartCompletedSuspenseBoundary$1(destination, responseState) {
              if (responseState.generateStaticMarkup) {
                return true;
              }
              return writeStartCompletedSuspenseBoundary(destination);
            }
            function writeStartClientRenderedSuspenseBoundary$1(destination, responseState, errorDigest, errorMessage, errorComponentStack) {
              if (responseState.generateStaticMarkup) {
                return true;
              }
              return writeStartClientRenderedSuspenseBoundary(destination, responseState, errorDigest, errorMessage, errorComponentStack);
            }
            function writeEndCompletedSuspenseBoundary$1(destination, responseState) {
              if (responseState.generateStaticMarkup) {
                return true;
              }
              return writeEndCompletedSuspenseBoundary(destination);
            }
            function writeEndClientRenderedSuspenseBoundary$1(destination, responseState) {
              if (responseState.generateStaticMarkup) {
                return true;
              }
              return writeEndClientRenderedSuspenseBoundary(destination);
            }
            var assign = Object.assign;
            var REACT_ELEMENT_TYPE = Symbol.for("react.element");
            var REACT_PORTAL_TYPE = Symbol.for("react.portal");
            var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
            var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
            var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
            var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
            var REACT_CONTEXT_TYPE = Symbol.for("react.context");
            var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
            var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
            var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
            var REACT_MEMO_TYPE = Symbol.for("react.memo");
            var REACT_LAZY_TYPE = Symbol.for("react.lazy");
            var REACT_SCOPE_TYPE = Symbol.for("react.scope");
            var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
            var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
            var REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for("react.default_value");
            var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
            var FAUX_ITERATOR_SYMBOL = "@@iterator";
            function getIteratorFn(maybeIterable) {
              if (maybeIterable === null || typeof maybeIterable !== "object") {
                return null;
              }
              var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
              if (typeof maybeIterator === "function") {
                return maybeIterator;
              }
              return null;
            }
            function getWrappedName(outerType, innerType, wrapperName) {
              var displayName = outerType.displayName;
              if (displayName) {
                return displayName;
              }
              var functionName = innerType.displayName || innerType.name || "";
              return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
            }
            function getContextName(type) {
              return type.displayName || "Context";
            }
            function getComponentNameFromType(type) {
              if (type == null) {
                return null;
              }
              {
                if (typeof type.tag === "number") {
                  error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
                }
              }
              if (typeof type === "function") {
                return type.displayName || type.name || null;
              }
              if (typeof type === "string") {
                return type;
              }
              switch (type) {
                case REACT_FRAGMENT_TYPE:
                  return "Fragment";
                case REACT_PORTAL_TYPE:
                  return "Portal";
                case REACT_PROFILER_TYPE:
                  return "Profiler";
                case REACT_STRICT_MODE_TYPE:
                  return "StrictMode";
                case REACT_SUSPENSE_TYPE:
                  return "Suspense";
                case REACT_SUSPENSE_LIST_TYPE:
                  return "SuspenseList";
              }
              if (typeof type === "object") {
                switch (type.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    var context = type;
                    return getContextName(context) + ".Consumer";
                  case REACT_PROVIDER_TYPE:
                    var provider = type;
                    return getContextName(provider._context) + ".Provider";
                  case REACT_FORWARD_REF_TYPE:
                    return getWrappedName(type, type.render, "ForwardRef");
                  case REACT_MEMO_TYPE:
                    var outerName = type.displayName || null;
                    if (outerName !== null) {
                      return outerName;
                    }
                    return getComponentNameFromType(type.type) || "Memo";
                  case REACT_LAZY_TYPE: {
                    var lazyComponent = type;
                    var payload = lazyComponent._payload;
                    var init = lazyComponent._init;
                    try {
                      return getComponentNameFromType(init(payload));
                    } catch (x) {
                      return null;
                    }
                  }
                }
              }
              return null;
            }
            var disabledDepth = 0;
            var prevLog;
            var prevInfo;
            var prevWarn;
            var prevError;
            var prevGroup;
            var prevGroupCollapsed;
            var prevGroupEnd;
            function disabledLog() {
            }
            disabledLog.__reactDisabledLog = true;
            function disableLogs() {
              {
                if (disabledDepth === 0) {
                  prevLog = console.log;
                  prevInfo = console.info;
                  prevWarn = console.warn;
                  prevError = console.error;
                  prevGroup = console.group;
                  prevGroupCollapsed = console.groupCollapsed;
                  prevGroupEnd = console.groupEnd;
                  var props = {
                    configurable: true,
                    enumerable: true,
                    value: disabledLog,
                    writable: true
                  };
                  Object.defineProperties(console, {
                    info: props,
                    log: props,
                    warn: props,
                    error: props,
                    group: props,
                    groupCollapsed: props,
                    groupEnd: props
                  });
                }
                disabledDepth++;
              }
            }
            function reenableLogs() {
              {
                disabledDepth--;
                if (disabledDepth === 0) {
                  var props = {
                    configurable: true,
                    enumerable: true,
                    writable: true
                  };
                  Object.defineProperties(console, {
                    log: assign({}, props, {
                      value: prevLog
                    }),
                    info: assign({}, props, {
                      value: prevInfo
                    }),
                    warn: assign({}, props, {
                      value: prevWarn
                    }),
                    error: assign({}, props, {
                      value: prevError
                    }),
                    group: assign({}, props, {
                      value: prevGroup
                    }),
                    groupCollapsed: assign({}, props, {
                      value: prevGroupCollapsed
                    }),
                    groupEnd: assign({}, props, {
                      value: prevGroupEnd
                    })
                  });
                }
                if (disabledDepth < 0) {
                  error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
                }
              }
            }
            var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
            var prefix;
            function describeBuiltInComponentFrame(name, source, ownerFn) {
              {
                if (prefix === void 0) {
                  try {
                    throw Error();
                  } catch (x) {
                    var match = x.stack.trim().match(/\n( *(at )?)/);
                    prefix = match && match[1] || "";
                  }
                }
                return "\n" + prefix + name;
              }
            }
            var reentry = false;
            var componentFrameCache;
            {
              var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
              componentFrameCache = new PossiblyWeakMap();
            }
            function describeNativeComponentFrame(fn, construct) {
              if (!fn || reentry) {
                return "";
              }
              {
                var frame = componentFrameCache.get(fn);
                if (frame !== void 0) {
                  return frame;
                }
              }
              var control;
              reentry = true;
              var previousPrepareStackTrace = Error.prepareStackTrace;
              Error.prepareStackTrace = void 0;
              var previousDispatcher;
              {
                previousDispatcher = ReactCurrentDispatcher.current;
                ReactCurrentDispatcher.current = null;
                disableLogs();
              }
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  });
                  if (typeof Reflect === "object" && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x) {
                      control = x;
                    }
                    fn.call(Fake.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x) {
                    control = x;
                  }
                  fn();
                }
              } catch (sample) {
                if (sample && control && typeof sample.stack === "string") {
                  var sampleLines = sample.stack.split("\n");
                  var controlLines = control.stack.split("\n");
                  var s = sampleLines.length - 1;
                  var c = controlLines.length - 1;
                  while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                    c--;
                  }
                  for (; s >= 1 && c >= 0; s--, c--) {
                    if (sampleLines[s] !== controlLines[c]) {
                      if (s !== 1 || c !== 1) {
                        do {
                          s--;
                          c--;
                          if (c < 0 || sampleLines[s] !== controlLines[c]) {
                            var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                            if (fn.displayName && _frame.includes("<anonymous>")) {
                              _frame = _frame.replace("<anonymous>", fn.displayName);
                            }
                            {
                              if (typeof fn === "function") {
                                componentFrameCache.set(fn, _frame);
                              }
                            }
                            return _frame;
                          }
                        } while (s >= 1 && c >= 0);
                      }
                      break;
                    }
                  }
                }
              } finally {
                reentry = false;
                {
                  ReactCurrentDispatcher.current = previousDispatcher;
                  reenableLogs();
                }
                Error.prepareStackTrace = previousPrepareStackTrace;
              }
              var name = fn ? fn.displayName || fn.name : "";
              var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
              {
                if (typeof fn === "function") {
                  componentFrameCache.set(fn, syntheticFrame);
                }
              }
              return syntheticFrame;
            }
            function describeClassComponentFrame(ctor, source, ownerFn) {
              {
                return describeNativeComponentFrame(ctor, true);
              }
            }
            function describeFunctionComponentFrame(fn, source, ownerFn) {
              {
                return describeNativeComponentFrame(fn, false);
              }
            }
            function shouldConstruct(Component) {
              var prototype = Component.prototype;
              return !!(prototype && prototype.isReactComponent);
            }
            function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
              if (type == null) {
                return "";
              }
              if (typeof type === "function") {
                {
                  return describeNativeComponentFrame(type, shouldConstruct(type));
                }
              }
              if (typeof type === "string") {
                return describeBuiltInComponentFrame(type);
              }
              switch (type) {
                case REACT_SUSPENSE_TYPE:
                  return describeBuiltInComponentFrame("Suspense");
                case REACT_SUSPENSE_LIST_TYPE:
                  return describeBuiltInComponentFrame("SuspenseList");
              }
              if (typeof type === "object") {
                switch (type.$$typeof) {
                  case REACT_FORWARD_REF_TYPE:
                    return describeFunctionComponentFrame(type.render);
                  case REACT_MEMO_TYPE:
                    return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
                  case REACT_LAZY_TYPE: {
                    var lazyComponent = type;
                    var payload = lazyComponent._payload;
                    var init = lazyComponent._init;
                    try {
                      return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                    } catch (x) {
                    }
                  }
                }
              }
              return "";
            }
            var loggedTypeFailures = {};
            var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
            function setCurrentlyValidatingElement(element) {
              {
                if (element) {
                  var owner = element._owner;
                  var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                  ReactDebugCurrentFrame.setExtraStackFrame(stack);
                } else {
                  ReactDebugCurrentFrame.setExtraStackFrame(null);
                }
              }
            }
            function checkPropTypes(typeSpecs, values, location, componentName, element) {
              {
                var has = Function.call.bind(hasOwnProperty);
                for (var typeSpecName in typeSpecs) {
                  if (has(typeSpecs, typeSpecName)) {
                    var error$1 = void 0;
                    try {
                      if (typeof typeSpecs[typeSpecName] !== "function") {
                        var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                        err.name = "Invariant Violation";
                        throw err;
                      }
                      error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                    } catch (ex) {
                      error$1 = ex;
                    }
                    if (error$1 && !(error$1 instanceof Error)) {
                      setCurrentlyValidatingElement(element);
                      error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                      setCurrentlyValidatingElement(null);
                    }
                    if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                      loggedTypeFailures[error$1.message] = true;
                      setCurrentlyValidatingElement(element);
                      error("Failed %s type: %s", location, error$1.message);
                      setCurrentlyValidatingElement(null);
                    }
                  }
                }
              }
            }
            var warnedAboutMissingGetChildContext;
            {
              warnedAboutMissingGetChildContext = {};
            }
            var emptyContextObject = {};
            {
              Object.freeze(emptyContextObject);
            }
            function getMaskedContext(type, unmaskedContext) {
              {
                var contextTypes = type.contextTypes;
                if (!contextTypes) {
                  return emptyContextObject;
                }
                var context = {};
                for (var key in contextTypes) {
                  context[key] = unmaskedContext[key];
                }
                {
                  var name = getComponentNameFromType(type) || "Unknown";
                  checkPropTypes(contextTypes, context, "context", name);
                }
                return context;
              }
            }
            function processChildContext(instance, type, parentContext, childContextTypes) {
              {
                if (typeof instance.getChildContext !== "function") {
                  {
                    var componentName = getComponentNameFromType(type) || "Unknown";
                    if (!warnedAboutMissingGetChildContext[componentName]) {
                      warnedAboutMissingGetChildContext[componentName] = true;
                      error("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", componentName, componentName);
                    }
                  }
                  return parentContext;
                }
                var childContext = instance.getChildContext();
                for (var contextKey in childContext) {
                  if (!(contextKey in childContextTypes)) {
                    throw new Error((getComponentNameFromType(type) || "Unknown") + '.getChildContext(): key "' + contextKey + '" is not defined in childContextTypes.');
                  }
                }
                {
                  var name = getComponentNameFromType(type) || "Unknown";
                  checkPropTypes(childContextTypes, childContext, "child context", name);
                }
                return assign({}, parentContext, childContext);
              }
            }
            var rendererSigil;
            {
              rendererSigil = {};
            }
            var rootContextSnapshot = null;
            var currentActiveSnapshot = null;
            function popNode(prev) {
              {
                prev.context._currentValue2 = prev.parentValue;
              }
            }
            function pushNode(next) {
              {
                next.context._currentValue2 = next.value;
              }
            }
            function popToNearestCommonAncestor(prev, next) {
              if (prev === next)
                ;
              else {
                popNode(prev);
                var parentPrev = prev.parent;
                var parentNext = next.parent;
                if (parentPrev === null) {
                  if (parentNext !== null) {
                    throw new Error("The stacks must reach the root at the same time. This is a bug in React.");
                  }
                } else {
                  if (parentNext === null) {
                    throw new Error("The stacks must reach the root at the same time. This is a bug in React.");
                  }
                  popToNearestCommonAncestor(parentPrev, parentNext);
                }
                pushNode(next);
              }
            }
            function popAllPrevious(prev) {
              popNode(prev);
              var parentPrev = prev.parent;
              if (parentPrev !== null) {
                popAllPrevious(parentPrev);
              }
            }
            function pushAllNext(next) {
              var parentNext = next.parent;
              if (parentNext !== null) {
                pushAllNext(parentNext);
              }
              pushNode(next);
            }
            function popPreviousToCommonLevel(prev, next) {
              popNode(prev);
              var parentPrev = prev.parent;
              if (parentPrev === null) {
                throw new Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
              }
              if (parentPrev.depth === next.depth) {
                popToNearestCommonAncestor(parentPrev, next);
              } else {
                popPreviousToCommonLevel(parentPrev, next);
              }
            }
            function popNextToCommonLevel(prev, next) {
              var parentNext = next.parent;
              if (parentNext === null) {
                throw new Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
              }
              if (prev.depth === parentNext.depth) {
                popToNearestCommonAncestor(prev, parentNext);
              } else {
                popNextToCommonLevel(prev, parentNext);
              }
              pushNode(next);
            }
            function switchContext(newSnapshot) {
              var prev = currentActiveSnapshot;
              var next = newSnapshot;
              if (prev !== next) {
                if (prev === null) {
                  pushAllNext(next);
                } else if (next === null) {
                  popAllPrevious(prev);
                } else if (prev.depth === next.depth) {
                  popToNearestCommonAncestor(prev, next);
                } else if (prev.depth > next.depth) {
                  popPreviousToCommonLevel(prev, next);
                } else {
                  popNextToCommonLevel(prev, next);
                }
                currentActiveSnapshot = next;
              }
            }
            function pushProvider(context, nextValue) {
              var prevValue;
              {
                prevValue = context._currentValue2;
                context._currentValue2 = nextValue;
                {
                  if (context._currentRenderer2 !== void 0 && context._currentRenderer2 !== null && context._currentRenderer2 !== rendererSigil) {
                    error("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.");
                  }
                  context._currentRenderer2 = rendererSigil;
                }
              }
              var prevNode = currentActiveSnapshot;
              var newNode = {
                parent: prevNode,
                depth: prevNode === null ? 0 : prevNode.depth + 1,
                context,
                parentValue: prevValue,
                value: nextValue
              };
              currentActiveSnapshot = newNode;
              return newNode;
            }
            function popProvider(context) {
              var prevSnapshot = currentActiveSnapshot;
              if (prevSnapshot === null) {
                throw new Error("Tried to pop a Context at the root of the app. This is a bug in React.");
              }
              {
                if (prevSnapshot.context !== context) {
                  error("The parent context is not the expected context. This is probably a bug in React.");
                }
              }
              {
                var _value = prevSnapshot.parentValue;
                if (_value === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED) {
                  prevSnapshot.context._currentValue2 = prevSnapshot.context._defaultValue;
                } else {
                  prevSnapshot.context._currentValue2 = _value;
                }
                {
                  if (context._currentRenderer2 !== void 0 && context._currentRenderer2 !== null && context._currentRenderer2 !== rendererSigil) {
                    error("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.");
                  }
                  context._currentRenderer2 = rendererSigil;
                }
              }
              return currentActiveSnapshot = prevSnapshot.parent;
            }
            function getActiveContext() {
              return currentActiveSnapshot;
            }
            function readContext(context) {
              var value = context._currentValue2;
              return value;
            }
            function get(key) {
              return key._reactInternals;
            }
            function set(key, value) {
              key._reactInternals = value;
            }
            var didWarnAboutNoopUpdateForComponent = {};
            var didWarnAboutDeprecatedWillMount = {};
            var didWarnAboutUninitializedState;
            var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
            var didWarnAboutLegacyLifecyclesAndDerivedState;
            var didWarnAboutUndefinedDerivedState;
            var warnOnUndefinedDerivedState;
            var warnOnInvalidCallback;
            var didWarnAboutDirectlyAssigningPropsToState;
            var didWarnAboutContextTypeAndContextTypes;
            var didWarnAboutInvalidateContextType;
            {
              didWarnAboutUninitializedState = /* @__PURE__ */ new Set();
              didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = /* @__PURE__ */ new Set();
              didWarnAboutLegacyLifecyclesAndDerivedState = /* @__PURE__ */ new Set();
              didWarnAboutDirectlyAssigningPropsToState = /* @__PURE__ */ new Set();
              didWarnAboutUndefinedDerivedState = /* @__PURE__ */ new Set();
              didWarnAboutContextTypeAndContextTypes = /* @__PURE__ */ new Set();
              didWarnAboutInvalidateContextType = /* @__PURE__ */ new Set();
              var didWarnOnInvalidCallback = /* @__PURE__ */ new Set();
              warnOnInvalidCallback = function(callback, callerName) {
                if (callback === null || typeof callback === "function") {
                  return;
                }
                var key = callerName + "_" + callback;
                if (!didWarnOnInvalidCallback.has(key)) {
                  didWarnOnInvalidCallback.add(key);
                  error("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", callerName, callback);
                }
              };
              warnOnUndefinedDerivedState = function(type, partialState) {
                if (partialState === void 0) {
                  var componentName = getComponentNameFromType(type) || "Component";
                  if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
                    didWarnAboutUndefinedDerivedState.add(componentName);
                    error("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", componentName);
                  }
                }
              };
            }
            function warnNoop(publicInstance, callerName) {
              {
                var _constructor = publicInstance.constructor;
                var componentName = _constructor && getComponentNameFromType(_constructor) || "ReactClass";
                var warningKey = componentName + "." + callerName;
                if (didWarnAboutNoopUpdateForComponent[warningKey]) {
                  return;
                }
                error("%s(...): Can only update a mounting component. This usually means you called %s() outside componentWillMount() on the server. This is a no-op.\n\nPlease check the code for the %s component.", callerName, callerName, componentName);
                didWarnAboutNoopUpdateForComponent[warningKey] = true;
              }
            }
            var classComponentUpdater = {
              isMounted: function(inst) {
                return false;
              },
              enqueueSetState: function(inst, payload, callback) {
                var internals = get(inst);
                if (internals.queue === null) {
                  warnNoop(inst, "setState");
                } else {
                  internals.queue.push(payload);
                  {
                    if (callback !== void 0 && callback !== null) {
                      warnOnInvalidCallback(callback, "setState");
                    }
                  }
                }
              },
              enqueueReplaceState: function(inst, payload, callback) {
                var internals = get(inst);
                internals.replace = true;
                internals.queue = [payload];
                {
                  if (callback !== void 0 && callback !== null) {
                    warnOnInvalidCallback(callback, "setState");
                  }
                }
              },
              enqueueForceUpdate: function(inst, callback) {
                var internals = get(inst);
                if (internals.queue === null) {
                  warnNoop(inst, "forceUpdate");
                } else {
                  {
                    if (callback !== void 0 && callback !== null) {
                      warnOnInvalidCallback(callback, "setState");
                    }
                  }
                }
              }
            };
            function applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, prevState, nextProps) {
              var partialState = getDerivedStateFromProps(nextProps, prevState);
              {
                warnOnUndefinedDerivedState(ctor, partialState);
              }
              var newState = partialState === null || partialState === void 0 ? prevState : assign({}, prevState, partialState);
              return newState;
            }
            function constructClassInstance(ctor, props, maskedLegacyContext) {
              var context = emptyContextObject;
              var contextType = ctor.contextType;
              {
                if ("contextType" in ctor) {
                  var isValid = (
                    // Allow null for conditional declaration
                    contextType === null || contextType !== void 0 && contextType.$$typeof === REACT_CONTEXT_TYPE && contextType._context === void 0
                  );
                  if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
                    didWarnAboutInvalidateContextType.add(ctor);
                    var addendum = "";
                    if (contextType === void 0) {
                      addendum = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file.";
                    } else if (typeof contextType !== "object") {
                      addendum = " However, it is set to a " + typeof contextType + ".";
                    } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
                      addendum = " Did you accidentally pass the Context.Provider instead?";
                    } else if (contextType._context !== void 0) {
                      addendum = " Did you accidentally pass the Context.Consumer instead?";
                    } else {
                      addendum = " However, it is set to an object with keys {" + Object.keys(contextType).join(", ") + "}.";
                    }
                    error("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", getComponentNameFromType(ctor) || "Component", addendum);
                  }
                }
              }
              if (typeof contextType === "object" && contextType !== null) {
                context = readContext(contextType);
              } else {
                context = maskedLegacyContext;
              }
              var instance = new ctor(props, context);
              {
                if (typeof ctor.getDerivedStateFromProps === "function" && (instance.state === null || instance.state === void 0)) {
                  var componentName = getComponentNameFromType(ctor) || "Component";
                  if (!didWarnAboutUninitializedState.has(componentName)) {
                    didWarnAboutUninitializedState.add(componentName);
                    error("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", componentName, instance.state === null ? "null" : "undefined", componentName);
                  }
                }
                if (typeof ctor.getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function") {
                  var foundWillMountName = null;
                  var foundWillReceivePropsName = null;
                  var foundWillUpdateName = null;
                  if (typeof instance.componentWillMount === "function" && instance.componentWillMount.__suppressDeprecationWarning !== true) {
                    foundWillMountName = "componentWillMount";
                  } else if (typeof instance.UNSAFE_componentWillMount === "function") {
                    foundWillMountName = "UNSAFE_componentWillMount";
                  }
                  if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
                    foundWillReceivePropsName = "componentWillReceiveProps";
                  } else if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
                    foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
                  }
                  if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
                    foundWillUpdateName = "componentWillUpdate";
                  } else if (typeof instance.UNSAFE_componentWillUpdate === "function") {
                    foundWillUpdateName = "UNSAFE_componentWillUpdate";
                  }
                  if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
                    var _componentName = getComponentNameFromType(ctor) || "Component";
                    var newApiName = typeof ctor.getDerivedStateFromProps === "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
                    if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
                      didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);
                      error("Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://reactjs.org/link/unsafe-component-lifecycles", _componentName, newApiName, foundWillMountName !== null ? "\n  " + foundWillMountName : "", foundWillReceivePropsName !== null ? "\n  " + foundWillReceivePropsName : "", foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : "");
                    }
                  }
                }
              }
              return instance;
            }
            function checkClassInstance(instance, ctor, newProps) {
              {
                var name = getComponentNameFromType(ctor) || "Component";
                var renderPresent = instance.render;
                if (!renderPresent) {
                  if (ctor.prototype && typeof ctor.prototype.render === "function") {
                    error("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", name);
                  } else {
                    error("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", name);
                  }
                }
                if (instance.getInitialState && !instance.getInitialState.isReactClassApproved && !instance.state) {
                  error("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", name);
                }
                if (instance.getDefaultProps && !instance.getDefaultProps.isReactClassApproved) {
                  error("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", name);
                }
                if (instance.propTypes) {
                  error("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", name);
                }
                if (instance.contextType) {
                  error("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", name);
                }
                {
                  if (instance.contextTypes) {
                    error("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", name);
                  }
                  if (ctor.contextType && ctor.contextTypes && !didWarnAboutContextTypeAndContextTypes.has(ctor)) {
                    didWarnAboutContextTypeAndContextTypes.add(ctor);
                    error("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", name);
                  }
                }
                if (typeof instance.componentShouldUpdate === "function") {
                  error("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", name);
                }
                if (ctor.prototype && ctor.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== "undefined") {
                  error("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", getComponentNameFromType(ctor) || "A pure component");
                }
                if (typeof instance.componentDidUnmount === "function") {
                  error("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", name);
                }
                if (typeof instance.componentDidReceiveProps === "function") {
                  error("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", name);
                }
                if (typeof instance.componentWillRecieveProps === "function") {
                  error("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", name);
                }
                if (typeof instance.UNSAFE_componentWillRecieveProps === "function") {
                  error("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", name);
                }
                var hasMutatedProps = instance.props !== newProps;
                if (instance.props !== void 0 && hasMutatedProps) {
                  error("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", name, name);
                }
                if (instance.defaultProps) {
                  error("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", name, name);
                }
                if (typeof instance.getSnapshotBeforeUpdate === "function" && typeof instance.componentDidUpdate !== "function" && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)) {
                  didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);
                  error("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", getComponentNameFromType(ctor));
                }
                if (typeof instance.getDerivedStateFromProps === "function") {
                  error("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", name);
                }
                if (typeof instance.getDerivedStateFromError === "function") {
                  error("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", name);
                }
                if (typeof ctor.getSnapshotBeforeUpdate === "function") {
                  error("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", name);
                }
                var _state = instance.state;
                if (_state && (typeof _state !== "object" || isArray(_state))) {
                  error("%s.state: must be set to an object or null", name);
                }
                if (typeof instance.getChildContext === "function" && typeof ctor.childContextTypes !== "object") {
                  error("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", name);
                }
              }
            }
            function callComponentWillMount(type, instance) {
              var oldState = instance.state;
              if (typeof instance.componentWillMount === "function") {
                {
                  if (instance.componentWillMount.__suppressDeprecationWarning !== true) {
                    var componentName = getComponentNameFromType(type) || "Unknown";
                    if (!didWarnAboutDeprecatedWillMount[componentName]) {
                      warn(
                        // keep this warning in sync with ReactStrictModeWarning.js
                        "componentWillMount has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move code from componentWillMount to componentDidMount (preferred in most cases) or the constructor.\n\nPlease update the following components: %s",
                        componentName
                      );
                      didWarnAboutDeprecatedWillMount[componentName] = true;
                    }
                  }
                }
                instance.componentWillMount();
              }
              if (typeof instance.UNSAFE_componentWillMount === "function") {
                instance.UNSAFE_componentWillMount();
              }
              if (oldState !== instance.state) {
                {
                  error("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", getComponentNameFromType(type) || "Component");
                }
                classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
              }
            }
            function processUpdateQueue(internalInstance, inst, props, maskedLegacyContext) {
              if (internalInstance.queue !== null && internalInstance.queue.length > 0) {
                var oldQueue = internalInstance.queue;
                var oldReplace = internalInstance.replace;
                internalInstance.queue = null;
                internalInstance.replace = false;
                if (oldReplace && oldQueue.length === 1) {
                  inst.state = oldQueue[0];
                } else {
                  var nextState = oldReplace ? oldQueue[0] : inst.state;
                  var dontMutate = true;
                  for (var i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
                    var partial = oldQueue[i];
                    var partialState = typeof partial === "function" ? partial.call(inst, nextState, props, maskedLegacyContext) : partial;
                    if (partialState != null) {
                      if (dontMutate) {
                        dontMutate = false;
                        nextState = assign({}, nextState, partialState);
                      } else {
                        assign(nextState, partialState);
                      }
                    }
                  }
                  inst.state = nextState;
                }
              } else {
                internalInstance.queue = null;
              }
            }
            function mountClassInstance(instance, ctor, newProps, maskedLegacyContext) {
              {
                checkClassInstance(instance, ctor, newProps);
              }
              var initialState = instance.state !== void 0 ? instance.state : null;
              instance.updater = classComponentUpdater;
              instance.props = newProps;
              instance.state = initialState;
              var internalInstance = {
                queue: [],
                replace: false
              };
              set(instance, internalInstance);
              var contextType = ctor.contextType;
              if (typeof contextType === "object" && contextType !== null) {
                instance.context = readContext(contextType);
              } else {
                instance.context = maskedLegacyContext;
              }
              {
                if (instance.state === newProps) {
                  var componentName = getComponentNameFromType(ctor) || "Component";
                  if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
                    didWarnAboutDirectlyAssigningPropsToState.add(componentName);
                    error("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", componentName);
                  }
                }
              }
              var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
              if (typeof getDerivedStateFromProps === "function") {
                instance.state = applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, initialState, newProps);
              }
              if (typeof ctor.getDerivedStateFromProps !== "function" && typeof instance.getSnapshotBeforeUpdate !== "function" && (typeof instance.UNSAFE_componentWillMount === "function" || typeof instance.componentWillMount === "function")) {
                callComponentWillMount(ctor, instance);
                processUpdateQueue(internalInstance, instance, newProps, maskedLegacyContext);
              }
            }
            var emptyTreeContext = {
              id: 1,
              overflow: ""
            };
            function getTreeId(context) {
              var overflow = context.overflow;
              var idWithLeadingBit = context.id;
              var id = idWithLeadingBit & ~getLeadingBit(idWithLeadingBit);
              return id.toString(32) + overflow;
            }
            function pushTreeContext(baseContext, totalChildren, index) {
              var baseIdWithLeadingBit = baseContext.id;
              var baseOverflow = baseContext.overflow;
              var baseLength = getBitLength(baseIdWithLeadingBit) - 1;
              var baseId = baseIdWithLeadingBit & ~(1 << baseLength);
              var slot = index + 1;
              var length = getBitLength(totalChildren) + baseLength;
              if (length > 30) {
                var numberOfOverflowBits = baseLength - baseLength % 5;
                var newOverflowBits = (1 << numberOfOverflowBits) - 1;
                var newOverflow = (baseId & newOverflowBits).toString(32);
                var restOfBaseId = baseId >> numberOfOverflowBits;
                var restOfBaseLength = baseLength - numberOfOverflowBits;
                var restOfLength = getBitLength(totalChildren) + restOfBaseLength;
                var restOfNewBits = slot << restOfBaseLength;
                var id = restOfNewBits | restOfBaseId;
                var overflow = newOverflow + baseOverflow;
                return {
                  id: 1 << restOfLength | id,
                  overflow
                };
              } else {
                var newBits = slot << baseLength;
                var _id = newBits | baseId;
                var _overflow = baseOverflow;
                return {
                  id: 1 << length | _id,
                  overflow: _overflow
                };
              }
            }
            function getBitLength(number) {
              return 32 - clz32(number);
            }
            function getLeadingBit(id) {
              return 1 << getBitLength(id) - 1;
            }
            var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
            var log = Math.log;
            var LN2 = Math.LN2;
            function clz32Fallback(x) {
              var asUint = x >>> 0;
              if (asUint === 0) {
                return 32;
              }
              return 31 - (log(asUint) / LN2 | 0) | 0;
            }
            function is(x, y) {
              return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
            }
            var objectIs = typeof Object.is === "function" ? Object.is : is;
            var currentlyRenderingComponent = null;
            var currentlyRenderingTask = null;
            var firstWorkInProgressHook = null;
            var workInProgressHook = null;
            var isReRender = false;
            var didScheduleRenderPhaseUpdate = false;
            var localIdCounter = 0;
            var renderPhaseUpdates = null;
            var numberOfReRenders = 0;
            var RE_RENDER_LIMIT = 25;
            var isInHookUserCodeInDev = false;
            var currentHookNameInDev;
            function resolveCurrentlyRenderingComponent() {
              if (currentlyRenderingComponent === null) {
                throw new Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
              }
              {
                if (isInHookUserCodeInDev) {
                  error("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://reactjs.org/link/rules-of-hooks");
                }
              }
              return currentlyRenderingComponent;
            }
            function areHookInputsEqual(nextDeps, prevDeps) {
              if (prevDeps === null) {
                {
                  error("%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.", currentHookNameInDev);
                }
                return false;
              }
              {
                if (nextDeps.length !== prevDeps.length) {
                  error("The final argument passed to %s changed size between renders. The order and size of this array must remain constant.\n\nPrevious: %s\nIncoming: %s", currentHookNameInDev, "[" + nextDeps.join(", ") + "]", "[" + prevDeps.join(", ") + "]");
                }
              }
              for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
                if (objectIs(nextDeps[i], prevDeps[i])) {
                  continue;
                }
                return false;
              }
              return true;
            }
            function createHook() {
              if (numberOfReRenders > 0) {
                throw new Error("Rendered more hooks than during the previous render");
              }
              return {
                memoizedState: null,
                queue: null,
                next: null
              };
            }
            function createWorkInProgressHook() {
              if (workInProgressHook === null) {
                if (firstWorkInProgressHook === null) {
                  isReRender = false;
                  firstWorkInProgressHook = workInProgressHook = createHook();
                } else {
                  isReRender = true;
                  workInProgressHook = firstWorkInProgressHook;
                }
              } else {
                if (workInProgressHook.next === null) {
                  isReRender = false;
                  workInProgressHook = workInProgressHook.next = createHook();
                } else {
                  isReRender = true;
                  workInProgressHook = workInProgressHook.next;
                }
              }
              return workInProgressHook;
            }
            function prepareToUseHooks(task, componentIdentity) {
              currentlyRenderingComponent = componentIdentity;
              currentlyRenderingTask = task;
              {
                isInHookUserCodeInDev = false;
              }
              localIdCounter = 0;
            }
            function finishHooks(Component, props, children, refOrContext) {
              while (didScheduleRenderPhaseUpdate) {
                didScheduleRenderPhaseUpdate = false;
                localIdCounter = 0;
                numberOfReRenders += 1;
                workInProgressHook = null;
                children = Component(props, refOrContext);
              }
              resetHooksState();
              return children;
            }
            function checkDidRenderIdHook() {
              var didRenderIdHook = localIdCounter !== 0;
              return didRenderIdHook;
            }
            function resetHooksState() {
              {
                isInHookUserCodeInDev = false;
              }
              currentlyRenderingComponent = null;
              currentlyRenderingTask = null;
              didScheduleRenderPhaseUpdate = false;
              firstWorkInProgressHook = null;
              numberOfReRenders = 0;
              renderPhaseUpdates = null;
              workInProgressHook = null;
            }
            function readContext$1(context) {
              {
                if (isInHookUserCodeInDev) {
                  error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
                }
              }
              return readContext(context);
            }
            function useContext(context) {
              {
                currentHookNameInDev = "useContext";
              }
              resolveCurrentlyRenderingComponent();
              return readContext(context);
            }
            function basicStateReducer(state, action) {
              return typeof action === "function" ? action(state) : action;
            }
            function useState(initialState) {
              {
                currentHookNameInDev = "useState";
              }
              return useReducer(
                basicStateReducer,
                // useReducer has a special case to support lazy useState initializers
                initialState
              );
            }
            function useReducer(reducer, initialArg, init) {
              {
                if (reducer !== basicStateReducer) {
                  currentHookNameInDev = "useReducer";
                }
              }
              currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
              workInProgressHook = createWorkInProgressHook();
              if (isReRender) {
                var queue = workInProgressHook.queue;
                var dispatch = queue.dispatch;
                if (renderPhaseUpdates !== null) {
                  var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
                  if (firstRenderPhaseUpdate !== void 0) {
                    renderPhaseUpdates.delete(queue);
                    var newState = workInProgressHook.memoizedState;
                    var update = firstRenderPhaseUpdate;
                    do {
                      var action = update.action;
                      {
                        isInHookUserCodeInDev = true;
                      }
                      newState = reducer(newState, action);
                      {
                        isInHookUserCodeInDev = false;
                      }
                      update = update.next;
                    } while (update !== null);
                    workInProgressHook.memoizedState = newState;
                    return [newState, dispatch];
                  }
                }
                return [workInProgressHook.memoizedState, dispatch];
              } else {
                {
                  isInHookUserCodeInDev = true;
                }
                var initialState;
                if (reducer === basicStateReducer) {
                  initialState = typeof initialArg === "function" ? initialArg() : initialArg;
                } else {
                  initialState = init !== void 0 ? init(initialArg) : initialArg;
                }
                {
                  isInHookUserCodeInDev = false;
                }
                workInProgressHook.memoizedState = initialState;
                var _queue = workInProgressHook.queue = {
                  last: null,
                  dispatch: null
                };
                var _dispatch = _queue.dispatch = dispatchAction.bind(null, currentlyRenderingComponent, _queue);
                return [workInProgressHook.memoizedState, _dispatch];
              }
            }
            function useMemo(nextCreate, deps) {
              currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
              workInProgressHook = createWorkInProgressHook();
              var nextDeps = deps === void 0 ? null : deps;
              if (workInProgressHook !== null) {
                var prevState = workInProgressHook.memoizedState;
                if (prevState !== null) {
                  if (nextDeps !== null) {
                    var prevDeps = prevState[1];
                    if (areHookInputsEqual(nextDeps, prevDeps)) {
                      return prevState[0];
                    }
                  }
                }
              }
              {
                isInHookUserCodeInDev = true;
              }
              var nextValue = nextCreate();
              {
                isInHookUserCodeInDev = false;
              }
              workInProgressHook.memoizedState = [nextValue, nextDeps];
              return nextValue;
            }
            function useRef(initialValue) {
              currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
              workInProgressHook = createWorkInProgressHook();
              var previousRef = workInProgressHook.memoizedState;
              if (previousRef === null) {
                var ref = {
                  current: initialValue
                };
                {
                  Object.seal(ref);
                }
                workInProgressHook.memoizedState = ref;
                return ref;
              } else {
                return previousRef;
              }
            }
            function useLayoutEffect(create, inputs) {
              {
                currentHookNameInDev = "useLayoutEffect";
                error("useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format. This will lead to a mismatch between the initial, non-hydrated UI and the intended UI. To avoid this, useLayoutEffect should only be used in components that render exclusively on the client. See https://reactjs.org/link/uselayouteffect-ssr for common fixes.");
              }
            }
            function dispatchAction(componentIdentity, queue, action) {
              if (numberOfReRenders >= RE_RENDER_LIMIT) {
                throw new Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
              }
              if (componentIdentity === currentlyRenderingComponent) {
                didScheduleRenderPhaseUpdate = true;
                var update = {
                  action,
                  next: null
                };
                if (renderPhaseUpdates === null) {
                  renderPhaseUpdates = /* @__PURE__ */ new Map();
                }
                var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
                if (firstRenderPhaseUpdate === void 0) {
                  renderPhaseUpdates.set(queue, update);
                } else {
                  var lastRenderPhaseUpdate = firstRenderPhaseUpdate;
                  while (lastRenderPhaseUpdate.next !== null) {
                    lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
                  }
                  lastRenderPhaseUpdate.next = update;
                }
              }
            }
            function useCallback(callback, deps) {
              return useMemo(function() {
                return callback;
              }, deps);
            }
            function useMutableSource(source, getSnapshot, subscribe) {
              resolveCurrentlyRenderingComponent();
              return getSnapshot(source._source);
            }
            function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
              if (getServerSnapshot === void 0) {
                throw new Error("Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering.");
              }
              return getServerSnapshot();
            }
            function useDeferredValue(value) {
              resolveCurrentlyRenderingComponent();
              return value;
            }
            function unsupportedStartTransition() {
              throw new Error("startTransition cannot be called during server rendering.");
            }
            function useTransition() {
              resolveCurrentlyRenderingComponent();
              return [false, unsupportedStartTransition];
            }
            function useId() {
              var task = currentlyRenderingTask;
              var treeId = getTreeId(task.treeContext);
              var responseState = currentResponseState;
              if (responseState === null) {
                throw new Error("Invalid hook call. Hooks can only be called inside of the body of a function component.");
              }
              var localId = localIdCounter++;
              return makeId(responseState, treeId, localId);
            }
            function noop() {
            }
            var Dispatcher = {
              readContext: readContext$1,
              useContext,
              useMemo,
              useReducer,
              useRef,
              useState,
              useInsertionEffect: noop,
              useLayoutEffect,
              useCallback,
              // useImperativeHandle is not run in the server environment
              useImperativeHandle: noop,
              // Effects are not run in the server environment.
              useEffect: noop,
              // Debugging effect
              useDebugValue: noop,
              useDeferredValue,
              useTransition,
              useId,
              // Subscriptions are not setup in a server environment.
              useMutableSource,
              useSyncExternalStore
            };
            var currentResponseState = null;
            function setCurrentResponseState(responseState) {
              currentResponseState = responseState;
            }
            function getStackByComponentStackNode(componentStack) {
              try {
                var info = "";
                var node = componentStack;
                do {
                  switch (node.tag) {
                    case 0:
                      info += describeBuiltInComponentFrame(node.type, null, null);
                      break;
                    case 1:
                      info += describeFunctionComponentFrame(node.type, null, null);
                      break;
                    case 2:
                      info += describeClassComponentFrame(node.type, null, null);
                      break;
                  }
                  node = node.parent;
                } while (node);
                return info;
              } catch (x) {
                return "\nError generating stack: " + x.message + "\n" + x.stack;
              }
            }
            var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
            var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
            var PENDING = 0;
            var COMPLETED = 1;
            var FLUSHED = 2;
            var ABORTED = 3;
            var ERRORED = 4;
            var OPEN = 0;
            var CLOSING = 1;
            var CLOSED = 2;
            var DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12800;
            function defaultErrorHandler(error2) {
              console["error"](error2);
              return null;
            }
            function noop$1() {
            }
            function createRequest(children, responseState, rootFormatContext, progressiveChunkSize, onError2, onAllReady, onShellReady, onShellError, onFatalError) {
              var pingedTasks = [];
              var abortSet = /* @__PURE__ */ new Set();
              var request = {
                destination: null,
                responseState,
                progressiveChunkSize: progressiveChunkSize === void 0 ? DEFAULT_PROGRESSIVE_CHUNK_SIZE : progressiveChunkSize,
                status: OPEN,
                fatalError: null,
                nextSegmentId: 0,
                allPendingTasks: 0,
                pendingRootTasks: 0,
                completedRootSegment: null,
                abortableTasks: abortSet,
                pingedTasks,
                clientRenderedBoundaries: [],
                completedBoundaries: [],
                partialBoundaries: [],
                onError: onError2 === void 0 ? defaultErrorHandler : onError2,
                onAllReady: onAllReady === void 0 ? noop$1 : onAllReady,
                onShellReady: onShellReady === void 0 ? noop$1 : onShellReady,
                onShellError: onShellError === void 0 ? noop$1 : onShellError,
                onFatalError: onFatalError === void 0 ? noop$1 : onFatalError
              };
              var rootSegment = createPendingSegment(
                request,
                0,
                null,
                rootFormatContext,
                // Root segments are never embedded in Text on either edge
                false,
                false
              );
              rootSegment.parentFlushed = true;
              var rootTask = createTask(request, children, null, rootSegment, abortSet, emptyContextObject, rootContextSnapshot, emptyTreeContext);
              pingedTasks.push(rootTask);
              return request;
            }
            function pingTask(request, task) {
              var pingedTasks = request.pingedTasks;
              pingedTasks.push(task);
              if (pingedTasks.length === 1) {
                scheduleWork(function() {
                  return performWork(request);
                });
              }
            }
            function createSuspenseBoundary(request, fallbackAbortableTasks) {
              return {
                id: UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
                rootSegmentID: -1,
                parentFlushed: false,
                pendingTasks: 0,
                forceClientRender: false,
                completedSegments: [],
                byteSize: 0,
                fallbackAbortableTasks,
                errorDigest: null
              };
            }
            function createTask(request, node, blockedBoundary, blockedSegment, abortSet, legacyContext, context, treeContext) {
              request.allPendingTasks++;
              if (blockedBoundary === null) {
                request.pendingRootTasks++;
              } else {
                blockedBoundary.pendingTasks++;
              }
              var task = {
                node,
                ping: function() {
                  return pingTask(request, task);
                },
                blockedBoundary,
                blockedSegment,
                abortSet,
                legacyContext,
                context,
                treeContext
              };
              {
                task.componentStack = null;
              }
              abortSet.add(task);
              return task;
            }
            function createPendingSegment(request, index, boundary, formatContext, lastPushedText, textEmbedded) {
              return {
                status: PENDING,
                id: -1,
                // lazily assigned later
                index,
                parentFlushed: false,
                chunks: [],
                children: [],
                formatContext,
                boundary,
                lastPushedText,
                textEmbedded
              };
            }
            var currentTaskInDEV = null;
            function getCurrentStackInDEV() {
              {
                if (currentTaskInDEV === null || currentTaskInDEV.componentStack === null) {
                  return "";
                }
                return getStackByComponentStackNode(currentTaskInDEV.componentStack);
              }
            }
            function pushBuiltInComponentStackInDEV(task, type) {
              {
                task.componentStack = {
                  tag: 0,
                  parent: task.componentStack,
                  type
                };
              }
            }
            function pushFunctionComponentStackInDEV(task, type) {
              {
                task.componentStack = {
                  tag: 1,
                  parent: task.componentStack,
                  type
                };
              }
            }
            function pushClassComponentStackInDEV(task, type) {
              {
                task.componentStack = {
                  tag: 2,
                  parent: task.componentStack,
                  type
                };
              }
            }
            function popComponentStackInDEV(task) {
              {
                if (task.componentStack === null) {
                  error("Unexpectedly popped too many stack frames. This is a bug in React.");
                } else {
                  task.componentStack = task.componentStack.parent;
                }
              }
            }
            var lastBoundaryErrorComponentStackDev = null;
            function captureBoundaryErrorDetailsDev(boundary, error2) {
              {
                var errorMessage;
                if (typeof error2 === "string") {
                  errorMessage = error2;
                } else if (error2 && typeof error2.message === "string") {
                  errorMessage = error2.message;
                } else {
                  errorMessage = String(error2);
                }
                var errorComponentStack = lastBoundaryErrorComponentStackDev || getCurrentStackInDEV();
                lastBoundaryErrorComponentStackDev = null;
                boundary.errorMessage = errorMessage;
                boundary.errorComponentStack = errorComponentStack;
              }
            }
            function logRecoverableError(request, error2) {
              var errorDigest = request.onError(error2);
              if (errorDigest != null && typeof errorDigest !== "string") {
                throw new Error('onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' + typeof errorDigest + '" instead');
              }
              return errorDigest;
            }
            function fatalError(request, error2) {
              var onShellError = request.onShellError;
              onShellError(error2);
              var onFatalError = request.onFatalError;
              onFatalError(error2);
              if (request.destination !== null) {
                request.status = CLOSED;
                closeWithError(request.destination, error2);
              } else {
                request.status = CLOSING;
                request.fatalError = error2;
              }
            }
            function renderSuspenseBoundary(request, task, props) {
              pushBuiltInComponentStackInDEV(task, "Suspense");
              var parentBoundary = task.blockedBoundary;
              var parentSegment = task.blockedSegment;
              var fallback = props.fallback;
              var content = props.children;
              var fallbackAbortSet = /* @__PURE__ */ new Set();
              var newBoundary = createSuspenseBoundary(request, fallbackAbortSet);
              var insertionIndex = parentSegment.chunks.length;
              var boundarySegment = createPendingSegment(
                request,
                insertionIndex,
                newBoundary,
                parentSegment.formatContext,
                // boundaries never require text embedding at their edges because comment nodes bound them
                false,
                false
              );
              parentSegment.children.push(boundarySegment);
              parentSegment.lastPushedText = false;
              var contentRootSegment = createPendingSegment(
                request,
                0,
                null,
                parentSegment.formatContext,
                // boundaries never require text embedding at their edges because comment nodes bound them
                false,
                false
              );
              contentRootSegment.parentFlushed = true;
              task.blockedBoundary = newBoundary;
              task.blockedSegment = contentRootSegment;
              try {
                renderNode(request, task, content);
                pushSegmentFinale$1(contentRootSegment.chunks, request.responseState, contentRootSegment.lastPushedText, contentRootSegment.textEmbedded);
                contentRootSegment.status = COMPLETED;
                queueCompletedSegment(newBoundary, contentRootSegment);
                if (newBoundary.pendingTasks === 0) {
                  popComponentStackInDEV(task);
                  return;
                }
              } catch (error2) {
                contentRootSegment.status = ERRORED;
                newBoundary.forceClientRender = true;
                newBoundary.errorDigest = logRecoverableError(request, error2);
                {
                  captureBoundaryErrorDetailsDev(newBoundary, error2);
                }
              } finally {
                task.blockedBoundary = parentBoundary;
                task.blockedSegment = parentSegment;
              }
              var suspendedFallbackTask = createTask(request, fallback, parentBoundary, boundarySegment, fallbackAbortSet, task.legacyContext, task.context, task.treeContext);
              {
                suspendedFallbackTask.componentStack = task.componentStack;
              }
              request.pingedTasks.push(suspendedFallbackTask);
              popComponentStackInDEV(task);
            }
            function renderHostElement(request, task, type, props) {
              pushBuiltInComponentStackInDEV(task, type);
              var segment = task.blockedSegment;
              var children = pushStartInstance(segment.chunks, type, props, request.responseState, segment.formatContext);
              segment.lastPushedText = false;
              var prevContext = segment.formatContext;
              segment.formatContext = getChildFormatContext(prevContext, type, props);
              renderNode(request, task, children);
              segment.formatContext = prevContext;
              pushEndInstance(segment.chunks, type);
              segment.lastPushedText = false;
              popComponentStackInDEV(task);
            }
            function shouldConstruct$1(Component) {
              return Component.prototype && Component.prototype.isReactComponent;
            }
            function renderWithHooks(request, task, Component, props, secondArg) {
              var componentIdentity = {};
              prepareToUseHooks(task, componentIdentity);
              var result = Component(props, secondArg);
              return finishHooks(Component, props, result, secondArg);
            }
            function finishClassComponent(request, task, instance, Component, props) {
              var nextChildren = instance.render();
              {
                if (instance.props !== props) {
                  if (!didWarnAboutReassigningProps) {
                    error("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", getComponentNameFromType(Component) || "a component");
                  }
                  didWarnAboutReassigningProps = true;
                }
              }
              {
                var childContextTypes = Component.childContextTypes;
                if (childContextTypes !== null && childContextTypes !== void 0) {
                  var previousContext = task.legacyContext;
                  var mergedContext = processChildContext(instance, Component, previousContext, childContextTypes);
                  task.legacyContext = mergedContext;
                  renderNodeDestructive(request, task, nextChildren);
                  task.legacyContext = previousContext;
                  return;
                }
              }
              renderNodeDestructive(request, task, nextChildren);
            }
            function renderClassComponent(request, task, Component, props) {
              pushClassComponentStackInDEV(task, Component);
              var maskedContext = getMaskedContext(Component, task.legacyContext);
              var instance = constructClassInstance(Component, props, maskedContext);
              mountClassInstance(instance, Component, props, maskedContext);
              finishClassComponent(request, task, instance, Component, props);
              popComponentStackInDEV(task);
            }
            var didWarnAboutBadClass = {};
            var didWarnAboutModulePatternComponent = {};
            var didWarnAboutContextTypeOnFunctionComponent = {};
            var didWarnAboutGetDerivedStateOnFunctionComponent = {};
            var didWarnAboutReassigningProps = false;
            var didWarnAboutGenerators = false;
            var didWarnAboutMaps = false;
            var hasWarnedAboutUsingContextAsConsumer = false;
            function renderIndeterminateComponent(request, task, Component, props) {
              var legacyContext;
              {
                legacyContext = getMaskedContext(Component, task.legacyContext);
              }
              pushFunctionComponentStackInDEV(task, Component);
              {
                if (Component.prototype && typeof Component.prototype.render === "function") {
                  var componentName = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutBadClass[componentName]) {
                    error("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", componentName, componentName);
                    didWarnAboutBadClass[componentName] = true;
                  }
                }
              }
              var value = renderWithHooks(request, task, Component, props, legacyContext);
              var hasId = checkDidRenderIdHook();
              {
                if (typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === void 0) {
                  var _componentName = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutModulePatternComponent[_componentName]) {
                    error("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", _componentName, _componentName, _componentName);
                    didWarnAboutModulePatternComponent[_componentName] = true;
                  }
                }
              }
              if (
                // Run these checks in production only if the flag is off.
                // Eventually we'll delete this branch altogether.
                typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === void 0
              ) {
                {
                  var _componentName2 = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutModulePatternComponent[_componentName2]) {
                    error("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", _componentName2, _componentName2, _componentName2);
                    didWarnAboutModulePatternComponent[_componentName2] = true;
                  }
                }
                mountClassInstance(value, Component, props, legacyContext);
                finishClassComponent(request, task, value, Component, props);
              } else {
                {
                  validateFunctionComponentInDev(Component);
                }
                if (hasId) {
                  var prevTreeContext = task.treeContext;
                  var totalChildren = 1;
                  var index = 0;
                  task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
                  try {
                    renderNodeDestructive(request, task, value);
                  } finally {
                    task.treeContext = prevTreeContext;
                  }
                } else {
                  renderNodeDestructive(request, task, value);
                }
              }
              popComponentStackInDEV(task);
            }
            function validateFunctionComponentInDev(Component) {
              {
                if (Component) {
                  if (Component.childContextTypes) {
                    error("%s(...): childContextTypes cannot be defined on a function component.", Component.displayName || Component.name || "Component");
                  }
                }
                if (typeof Component.getDerivedStateFromProps === "function") {
                  var _componentName3 = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3]) {
                    error("%s: Function components do not support getDerivedStateFromProps.", _componentName3);
                    didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3] = true;
                  }
                }
                if (typeof Component.contextType === "object" && Component.contextType !== null) {
                  var _componentName4 = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutContextTypeOnFunctionComponent[_componentName4]) {
                    error("%s: Function components do not support contextType.", _componentName4);
                    didWarnAboutContextTypeOnFunctionComponent[_componentName4] = true;
                  }
                }
              }
            }
            function resolveDefaultProps(Component, baseProps) {
              if (Component && Component.defaultProps) {
                var props = assign({}, baseProps);
                var defaultProps = Component.defaultProps;
                for (var propName in defaultProps) {
                  if (props[propName] === void 0) {
                    props[propName] = defaultProps[propName];
                  }
                }
                return props;
              }
              return baseProps;
            }
            function renderForwardRef(request, task, type, props, ref) {
              pushFunctionComponentStackInDEV(task, type.render);
              var children = renderWithHooks(request, task, type.render, props, ref);
              var hasId = checkDidRenderIdHook();
              if (hasId) {
                var prevTreeContext = task.treeContext;
                var totalChildren = 1;
                var index = 0;
                task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
                try {
                  renderNodeDestructive(request, task, children);
                } finally {
                  task.treeContext = prevTreeContext;
                }
              } else {
                renderNodeDestructive(request, task, children);
              }
              popComponentStackInDEV(task);
            }
            function renderMemo(request, task, type, props, ref) {
              var innerType = type.type;
              var resolvedProps = resolveDefaultProps(innerType, props);
              renderElement(request, task, innerType, resolvedProps, ref);
            }
            function renderContextConsumer(request, task, context, props) {
              {
                if (context._context === void 0) {
                  if (context !== context.Consumer) {
                    if (!hasWarnedAboutUsingContextAsConsumer) {
                      hasWarnedAboutUsingContextAsConsumer = true;
                      error("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                    }
                  }
                } else {
                  context = context._context;
                }
              }
              var render = props.children;
              {
                if (typeof render !== "function") {
                  error("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it.");
                }
              }
              var newValue = readContext(context);
              var newChildren = render(newValue);
              renderNodeDestructive(request, task, newChildren);
            }
            function renderContextProvider(request, task, type, props) {
              var context = type._context;
              var value = props.value;
              var children = props.children;
              var prevSnapshot;
              {
                prevSnapshot = task.context;
              }
              task.context = pushProvider(context, value);
              renderNodeDestructive(request, task, children);
              task.context = popProvider(context);
              {
                if (prevSnapshot !== task.context) {
                  error("Popping the context provider did not return back to the original snapshot. This is a bug in React.");
                }
              }
            }
            function renderLazyComponent(request, task, lazyComponent, props, ref) {
              pushBuiltInComponentStackInDEV(task, "Lazy");
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              var Component = init(payload);
              var resolvedProps = resolveDefaultProps(Component, props);
              renderElement(request, task, Component, resolvedProps, ref);
              popComponentStackInDEV(task);
            }
            function renderElement(request, task, type, props, ref) {
              if (typeof type === "function") {
                if (shouldConstruct$1(type)) {
                  renderClassComponent(request, task, type, props);
                  return;
                } else {
                  renderIndeterminateComponent(request, task, type, props);
                  return;
                }
              }
              if (typeof type === "string") {
                renderHostElement(request, task, type, props);
                return;
              }
              switch (type) {
                case REACT_LEGACY_HIDDEN_TYPE:
                case REACT_DEBUG_TRACING_MODE_TYPE:
                case REACT_STRICT_MODE_TYPE:
                case REACT_PROFILER_TYPE:
                case REACT_FRAGMENT_TYPE: {
                  renderNodeDestructive(request, task, props.children);
                  return;
                }
                case REACT_SUSPENSE_LIST_TYPE: {
                  pushBuiltInComponentStackInDEV(task, "SuspenseList");
                  renderNodeDestructive(request, task, props.children);
                  popComponentStackInDEV(task);
                  return;
                }
                case REACT_SCOPE_TYPE: {
                  throw new Error("ReactDOMServer does not yet support scope components.");
                }
                case REACT_SUSPENSE_TYPE: {
                  {
                    renderSuspenseBoundary(request, task, props);
                  }
                  return;
                }
              }
              if (typeof type === "object" && type !== null) {
                switch (type.$$typeof) {
                  case REACT_FORWARD_REF_TYPE: {
                    renderForwardRef(request, task, type, props, ref);
                    return;
                  }
                  case REACT_MEMO_TYPE: {
                    renderMemo(request, task, type, props, ref);
                    return;
                  }
                  case REACT_PROVIDER_TYPE: {
                    renderContextProvider(request, task, type, props);
                    return;
                  }
                  case REACT_CONTEXT_TYPE: {
                    renderContextConsumer(request, task, type, props);
                    return;
                  }
                  case REACT_LAZY_TYPE: {
                    renderLazyComponent(request, task, type, props);
                    return;
                  }
                }
              }
              var info = "";
              {
                if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                  info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
                }
              }
              throw new Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) " + ("but got: " + (type == null ? type : typeof type) + "." + info));
            }
            function validateIterable(iterable, iteratorFn) {
              {
                if (typeof Symbol === "function" && // $FlowFixMe Flow doesn't know about toStringTag
                iterable[Symbol.toStringTag] === "Generator") {
                  if (!didWarnAboutGenerators) {
                    error("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers.");
                  }
                  didWarnAboutGenerators = true;
                }
                if (iterable.entries === iteratorFn) {
                  if (!didWarnAboutMaps) {
                    error("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
            }
            function renderNodeDestructive(request, task, node) {
              {
                try {
                  return renderNodeDestructiveImpl(request, task, node);
                } catch (x) {
                  if (typeof x === "object" && x !== null && typeof x.then === "function")
                    ;
                  else {
                    lastBoundaryErrorComponentStackDev = lastBoundaryErrorComponentStackDev !== null ? lastBoundaryErrorComponentStackDev : getCurrentStackInDEV();
                  }
                  throw x;
                }
              }
            }
            function renderNodeDestructiveImpl(request, task, node) {
              task.node = node;
              if (typeof node === "object" && node !== null) {
                switch (node.$$typeof) {
                  case REACT_ELEMENT_TYPE: {
                    var element = node;
                    var type = element.type;
                    var props = element.props;
                    var ref = element.ref;
                    renderElement(request, task, type, props, ref);
                    return;
                  }
                  case REACT_PORTAL_TYPE:
                    throw new Error("Portals are not currently supported by the server renderer. Render them conditionally so that they only appear on the client render.");
                  case REACT_LAZY_TYPE: {
                    var lazyNode = node;
                    var payload = lazyNode._payload;
                    var init = lazyNode._init;
                    var resolvedNode;
                    {
                      try {
                        resolvedNode = init(payload);
                      } catch (x) {
                        if (typeof x === "object" && x !== null && typeof x.then === "function") {
                          pushBuiltInComponentStackInDEV(task, "Lazy");
                        }
                        throw x;
                      }
                    }
                    renderNodeDestructive(request, task, resolvedNode);
                    return;
                  }
                }
                if (isArray(node)) {
                  renderChildrenArray(request, task, node);
                  return;
                }
                var iteratorFn = getIteratorFn(node);
                if (iteratorFn) {
                  {
                    validateIterable(node, iteratorFn);
                  }
                  var iterator = iteratorFn.call(node);
                  if (iterator) {
                    var step = iterator.next();
                    if (!step.done) {
                      var children = [];
                      do {
                        children.push(step.value);
                        step = iterator.next();
                      } while (!step.done);
                      renderChildrenArray(request, task, children);
                      return;
                    }
                    return;
                  }
                }
                var childString = Object.prototype.toString.call(node);
                throw new Error("Objects are not valid as a React child (found: " + (childString === "[object Object]" ? "object with keys {" + Object.keys(node).join(", ") + "}" : childString) + "). If you meant to render a collection of children, use an array instead.");
              }
              if (typeof node === "string") {
                var segment = task.blockedSegment;
                segment.lastPushedText = pushTextInstance$1(task.blockedSegment.chunks, node, request.responseState, segment.lastPushedText);
                return;
              }
              if (typeof node === "number") {
                var _segment = task.blockedSegment;
                _segment.lastPushedText = pushTextInstance$1(task.blockedSegment.chunks, "" + node, request.responseState, _segment.lastPushedText);
                return;
              }
              {
                if (typeof node === "function") {
                  error("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
                }
              }
            }
            function renderChildrenArray(request, task, children) {
              var totalChildren = children.length;
              for (var i = 0; i < totalChildren; i++) {
                var prevTreeContext = task.treeContext;
                task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i);
                try {
                  renderNode(request, task, children[i]);
                } finally {
                  task.treeContext = prevTreeContext;
                }
              }
            }
            function spawnNewSuspendedTask(request, task, x) {
              var segment = task.blockedSegment;
              var insertionIndex = segment.chunks.length;
              var newSegment = createPendingSegment(
                request,
                insertionIndex,
                null,
                segment.formatContext,
                // Adopt the parent segment's leading text embed
                segment.lastPushedText,
                // Assume we are text embedded at the trailing edge
                true
              );
              segment.children.push(newSegment);
              segment.lastPushedText = false;
              var newTask = createTask(request, task.node, task.blockedBoundary, newSegment, task.abortSet, task.legacyContext, task.context, task.treeContext);
              {
                if (task.componentStack !== null) {
                  newTask.componentStack = task.componentStack.parent;
                }
              }
              var ping = newTask.ping;
              x.then(ping, ping);
            }
            function renderNode(request, task, node) {
              var previousFormatContext = task.blockedSegment.formatContext;
              var previousLegacyContext = task.legacyContext;
              var previousContext = task.context;
              var previousComponentStack = null;
              {
                previousComponentStack = task.componentStack;
              }
              try {
                return renderNodeDestructive(request, task, node);
              } catch (x) {
                resetHooksState();
                if (typeof x === "object" && x !== null && typeof x.then === "function") {
                  spawnNewSuspendedTask(request, task, x);
                  task.blockedSegment.formatContext = previousFormatContext;
                  task.legacyContext = previousLegacyContext;
                  task.context = previousContext;
                  switchContext(previousContext);
                  {
                    task.componentStack = previousComponentStack;
                  }
                  return;
                } else {
                  task.blockedSegment.formatContext = previousFormatContext;
                  task.legacyContext = previousLegacyContext;
                  task.context = previousContext;
                  switchContext(previousContext);
                  {
                    task.componentStack = previousComponentStack;
                  }
                  throw x;
                }
              }
            }
            function erroredTask(request, boundary, segment, error2) {
              var errorDigest = logRecoverableError(request, error2);
              if (boundary === null) {
                fatalError(request, error2);
              } else {
                boundary.pendingTasks--;
                if (!boundary.forceClientRender) {
                  boundary.forceClientRender = true;
                  boundary.errorDigest = errorDigest;
                  {
                    captureBoundaryErrorDetailsDev(boundary, error2);
                  }
                  if (boundary.parentFlushed) {
                    request.clientRenderedBoundaries.push(boundary);
                  }
                }
              }
              request.allPendingTasks--;
              if (request.allPendingTasks === 0) {
                var onAllReady = request.onAllReady;
                onAllReady();
              }
            }
            function abortTaskSoft(task) {
              var request = this;
              var boundary = task.blockedBoundary;
              var segment = task.blockedSegment;
              segment.status = ABORTED;
              finishedTask(request, boundary, segment);
            }
            function abortTask(task, request, reason) {
              var boundary = task.blockedBoundary;
              var segment = task.blockedSegment;
              segment.status = ABORTED;
              if (boundary === null) {
                request.allPendingTasks--;
                if (request.status !== CLOSED) {
                  request.status = CLOSED;
                  if (request.destination !== null) {
                    close(request.destination);
                  }
                }
              } else {
                boundary.pendingTasks--;
                if (!boundary.forceClientRender) {
                  boundary.forceClientRender = true;
                  var _error = reason === void 0 ? new Error("The render was aborted by the server without a reason.") : reason;
                  boundary.errorDigest = request.onError(_error);
                  {
                    var errorPrefix = "The server did not finish this Suspense boundary: ";
                    if (_error && typeof _error.message === "string") {
                      _error = errorPrefix + _error.message;
                    } else {
                      _error = errorPrefix + String(_error);
                    }
                    var previousTaskInDev = currentTaskInDEV;
                    currentTaskInDEV = task;
                    try {
                      captureBoundaryErrorDetailsDev(boundary, _error);
                    } finally {
                      currentTaskInDEV = previousTaskInDev;
                    }
                  }
                  if (boundary.parentFlushed) {
                    request.clientRenderedBoundaries.push(boundary);
                  }
                }
                boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
                  return abortTask(fallbackTask, request, reason);
                });
                boundary.fallbackAbortableTasks.clear();
                request.allPendingTasks--;
                if (request.allPendingTasks === 0) {
                  var onAllReady = request.onAllReady;
                  onAllReady();
                }
              }
            }
            function queueCompletedSegment(boundary, segment) {
              if (segment.chunks.length === 0 && segment.children.length === 1 && segment.children[0].boundary === null) {
                var childSegment = segment.children[0];
                childSegment.id = segment.id;
                childSegment.parentFlushed = true;
                if (childSegment.status === COMPLETED) {
                  queueCompletedSegment(boundary, childSegment);
                }
              } else {
                var completedSegments = boundary.completedSegments;
                completedSegments.push(segment);
              }
            }
            function finishedTask(request, boundary, segment) {
              if (boundary === null) {
                if (segment.parentFlushed) {
                  if (request.completedRootSegment !== null) {
                    throw new Error("There can only be one root segment. This is a bug in React.");
                  }
                  request.completedRootSegment = segment;
                }
                request.pendingRootTasks--;
                if (request.pendingRootTasks === 0) {
                  request.onShellError = noop$1;
                  var onShellReady = request.onShellReady;
                  onShellReady();
                }
              } else {
                boundary.pendingTasks--;
                if (boundary.forceClientRender)
                  ;
                else if (boundary.pendingTasks === 0) {
                  if (segment.parentFlushed) {
                    if (segment.status === COMPLETED) {
                      queueCompletedSegment(boundary, segment);
                    }
                  }
                  if (boundary.parentFlushed) {
                    request.completedBoundaries.push(boundary);
                  }
                  boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request);
                  boundary.fallbackAbortableTasks.clear();
                } else {
                  if (segment.parentFlushed) {
                    if (segment.status === COMPLETED) {
                      queueCompletedSegment(boundary, segment);
                      var completedSegments = boundary.completedSegments;
                      if (completedSegments.length === 1) {
                        if (boundary.parentFlushed) {
                          request.partialBoundaries.push(boundary);
                        }
                      }
                    }
                  }
                }
              }
              request.allPendingTasks--;
              if (request.allPendingTasks === 0) {
                var onAllReady = request.onAllReady;
                onAllReady();
              }
            }
            function retryTask(request, task) {
              var segment = task.blockedSegment;
              if (segment.status !== PENDING) {
                return;
              }
              switchContext(task.context);
              var prevTaskInDEV = null;
              {
                prevTaskInDEV = currentTaskInDEV;
                currentTaskInDEV = task;
              }
              try {
                renderNodeDestructive(request, task, task.node);
                pushSegmentFinale$1(segment.chunks, request.responseState, segment.lastPushedText, segment.textEmbedded);
                task.abortSet.delete(task);
                segment.status = COMPLETED;
                finishedTask(request, task.blockedBoundary, segment);
              } catch (x) {
                resetHooksState();
                if (typeof x === "object" && x !== null && typeof x.then === "function") {
                  var ping = task.ping;
                  x.then(ping, ping);
                } else {
                  task.abortSet.delete(task);
                  segment.status = ERRORED;
                  erroredTask(request, task.blockedBoundary, segment, x);
                }
              } finally {
                {
                  currentTaskInDEV = prevTaskInDEV;
                }
              }
            }
            function performWork(request) {
              if (request.status === CLOSED) {
                return;
              }
              var prevContext = getActiveContext();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = Dispatcher;
              var prevGetCurrentStackImpl;
              {
                prevGetCurrentStackImpl = ReactDebugCurrentFrame$1.getCurrentStack;
                ReactDebugCurrentFrame$1.getCurrentStack = getCurrentStackInDEV;
              }
              var prevResponseState = currentResponseState;
              setCurrentResponseState(request.responseState);
              try {
                var pingedTasks = request.pingedTasks;
                var i;
                for (i = 0; i < pingedTasks.length; i++) {
                  var task = pingedTasks[i];
                  retryTask(request, task);
                }
                pingedTasks.splice(0, i);
                if (request.destination !== null) {
                  flushCompletedQueues(request, request.destination);
                }
              } catch (error2) {
                logRecoverableError(request, error2);
                fatalError(request, error2);
              } finally {
                setCurrentResponseState(prevResponseState);
                ReactCurrentDispatcher$1.current = prevDispatcher;
                {
                  ReactDebugCurrentFrame$1.getCurrentStack = prevGetCurrentStackImpl;
                }
                if (prevDispatcher === Dispatcher) {
                  switchContext(prevContext);
                }
              }
            }
            function flushSubtree(request, destination, segment) {
              segment.parentFlushed = true;
              switch (segment.status) {
                case PENDING: {
                  var segmentID = segment.id = request.nextSegmentId++;
                  segment.lastPushedText = false;
                  segment.textEmbedded = false;
                  return writePlaceholder(destination, request.responseState, segmentID);
                }
                case COMPLETED: {
                  segment.status = FLUSHED;
                  var r = true;
                  var chunks = segment.chunks;
                  var chunkIdx = 0;
                  var children = segment.children;
                  for (var childIdx = 0; childIdx < children.length; childIdx++) {
                    var nextChild = children[childIdx];
                    for (; chunkIdx < nextChild.index; chunkIdx++) {
                      writeChunk(destination, chunks[chunkIdx]);
                    }
                    r = flushSegment(request, destination, nextChild);
                  }
                  for (; chunkIdx < chunks.length - 1; chunkIdx++) {
                    writeChunk(destination, chunks[chunkIdx]);
                  }
                  if (chunkIdx < chunks.length) {
                    r = writeChunkAndReturn(destination, chunks[chunkIdx]);
                  }
                  return r;
                }
                default: {
                  throw new Error("Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React.");
                }
              }
            }
            function flushSegment(request, destination, segment) {
              var boundary = segment.boundary;
              if (boundary === null) {
                return flushSubtree(request, destination, segment);
              }
              boundary.parentFlushed = true;
              if (boundary.forceClientRender) {
                writeStartClientRenderedSuspenseBoundary$1(destination, request.responseState, boundary.errorDigest, boundary.errorMessage, boundary.errorComponentStack);
                flushSubtree(request, destination, segment);
                return writeEndClientRenderedSuspenseBoundary$1(destination, request.responseState);
              } else if (boundary.pendingTasks > 0) {
                boundary.rootSegmentID = request.nextSegmentId++;
                if (boundary.completedSegments.length > 0) {
                  request.partialBoundaries.push(boundary);
                }
                var id = boundary.id = assignSuspenseBoundaryID(request.responseState);
                writeStartPendingSuspenseBoundary(destination, request.responseState, id);
                flushSubtree(request, destination, segment);
                return writeEndPendingSuspenseBoundary(destination, request.responseState);
              } else if (boundary.byteSize > request.progressiveChunkSize) {
                boundary.rootSegmentID = request.nextSegmentId++;
                request.completedBoundaries.push(boundary);
                writeStartPendingSuspenseBoundary(destination, request.responseState, boundary.id);
                flushSubtree(request, destination, segment);
                return writeEndPendingSuspenseBoundary(destination, request.responseState);
              } else {
                writeStartCompletedSuspenseBoundary$1(destination, request.responseState);
                var completedSegments = boundary.completedSegments;
                if (completedSegments.length !== 1) {
                  throw new Error("A previously unvisited boundary must have exactly one root segment. This is a bug in React.");
                }
                var contentSegment = completedSegments[0];
                flushSegment(request, destination, contentSegment);
                return writeEndCompletedSuspenseBoundary$1(destination, request.responseState);
              }
            }
            function flushClientRenderedBoundary(request, destination, boundary) {
              return writeClientRenderBoundaryInstruction(destination, request.responseState, boundary.id, boundary.errorDigest, boundary.errorMessage, boundary.errorComponentStack);
            }
            function flushSegmentContainer(request, destination, segment) {
              writeStartSegment(destination, request.responseState, segment.formatContext, segment.id);
              flushSegment(request, destination, segment);
              return writeEndSegment(destination, segment.formatContext);
            }
            function flushCompletedBoundary(request, destination, boundary) {
              var completedSegments = boundary.completedSegments;
              var i = 0;
              for (; i < completedSegments.length; i++) {
                var segment = completedSegments[i];
                flushPartiallyCompletedSegment(request, destination, boundary, segment);
              }
              completedSegments.length = 0;
              return writeCompletedBoundaryInstruction(destination, request.responseState, boundary.id, boundary.rootSegmentID);
            }
            function flushPartialBoundary(request, destination, boundary) {
              var completedSegments = boundary.completedSegments;
              var i = 0;
              for (; i < completedSegments.length; i++) {
                var segment = completedSegments[i];
                if (!flushPartiallyCompletedSegment(request, destination, boundary, segment)) {
                  i++;
                  completedSegments.splice(0, i);
                  return false;
                }
              }
              completedSegments.splice(0, i);
              return true;
            }
            function flushPartiallyCompletedSegment(request, destination, boundary, segment) {
              if (segment.status === FLUSHED) {
                return true;
              }
              var segmentID = segment.id;
              if (segmentID === -1) {
                var rootSegmentID = segment.id = boundary.rootSegmentID;
                if (rootSegmentID === -1) {
                  throw new Error("A root segment ID must have been assigned by now. This is a bug in React.");
                }
                return flushSegmentContainer(request, destination, segment);
              } else {
                flushSegmentContainer(request, destination, segment);
                return writeCompletedSegmentInstruction(destination, request.responseState, segmentID);
              }
            }
            function flushCompletedQueues(request, destination) {
              try {
                var completedRootSegment = request.completedRootSegment;
                if (completedRootSegment !== null && request.pendingRootTasks === 0) {
                  flushSegment(request, destination, completedRootSegment);
                  request.completedRootSegment = null;
                  writeCompletedRoot(destination, request.responseState);
                }
                var clientRenderedBoundaries = request.clientRenderedBoundaries;
                var i;
                for (i = 0; i < clientRenderedBoundaries.length; i++) {
                  var boundary = clientRenderedBoundaries[i];
                  if (!flushClientRenderedBoundary(request, destination, boundary)) {
                    request.destination = null;
                    i++;
                    clientRenderedBoundaries.splice(0, i);
                    return;
                  }
                }
                clientRenderedBoundaries.splice(0, i);
                var completedBoundaries = request.completedBoundaries;
                for (i = 0; i < completedBoundaries.length; i++) {
                  var _boundary = completedBoundaries[i];
                  if (!flushCompletedBoundary(request, destination, _boundary)) {
                    request.destination = null;
                    i++;
                    completedBoundaries.splice(0, i);
                    return;
                  }
                }
                completedBoundaries.splice(0, i);
                completeWriting(destination);
                beginWriting(destination);
                var partialBoundaries = request.partialBoundaries;
                for (i = 0; i < partialBoundaries.length; i++) {
                  var _boundary2 = partialBoundaries[i];
                  if (!flushPartialBoundary(request, destination, _boundary2)) {
                    request.destination = null;
                    i++;
                    partialBoundaries.splice(0, i);
                    return;
                  }
                }
                partialBoundaries.splice(0, i);
                var largeBoundaries = request.completedBoundaries;
                for (i = 0; i < largeBoundaries.length; i++) {
                  var _boundary3 = largeBoundaries[i];
                  if (!flushCompletedBoundary(request, destination, _boundary3)) {
                    request.destination = null;
                    i++;
                    largeBoundaries.splice(0, i);
                    return;
                  }
                }
                largeBoundaries.splice(0, i);
              } finally {
                if (request.allPendingTasks === 0 && request.pingedTasks.length === 0 && request.clientRenderedBoundaries.length === 0 && request.completedBoundaries.length === 0) {
                  {
                    if (request.abortableTasks.size !== 0) {
                      error("There was still abortable task at the root when we closed. This is a bug in React.");
                    }
                  }
                  close(destination);
                }
              }
            }
            function startWork(request) {
              scheduleWork(function() {
                return performWork(request);
              });
            }
            function startFlowing(request, destination) {
              if (request.status === CLOSING) {
                request.status = CLOSED;
                closeWithError(destination, request.fatalError);
                return;
              }
              if (request.status === CLOSED) {
                return;
              }
              if (request.destination !== null) {
                return;
              }
              request.destination = destination;
              try {
                flushCompletedQueues(request, destination);
              } catch (error2) {
                logRecoverableError(request, error2);
                fatalError(request, error2);
              }
            }
            function abort(request, reason) {
              try {
                var abortableTasks = request.abortableTasks;
                abortableTasks.forEach(function(task) {
                  return abortTask(task, request, reason);
                });
                abortableTasks.clear();
                if (request.destination !== null) {
                  flushCompletedQueues(request, request.destination);
                }
              } catch (error2) {
                logRecoverableError(request, error2);
                fatalError(request, error2);
              }
            }
            function onError() {
            }
            function renderToStringImpl(children, options, generateStaticMarkup, abortReason) {
              var didFatal = false;
              var fatalError2 = null;
              var result = "";
              var destination = {
                push: function(chunk) {
                  if (chunk !== null) {
                    result += chunk;
                  }
                  return true;
                },
                destroy: function(error2) {
                  didFatal = true;
                  fatalError2 = error2;
                }
              };
              var readyToStream = false;
              function onShellReady() {
                readyToStream = true;
              }
              var request = createRequest(children, createResponseState$1(generateStaticMarkup, options ? options.identifierPrefix : void 0), createRootFormatContext(), Infinity, onError, void 0, onShellReady, void 0, void 0);
              startWork(request);
              abort(request, abortReason);
              startFlowing(request, destination);
              if (didFatal) {
                throw fatalError2;
              }
              if (!readyToStream) {
                throw new Error("A component suspended while responding to synchronous input. This will cause the UI to be replaced with a loading indicator. To fix, updates that suspend should be wrapped with startTransition.");
              }
              return result;
            }
            function renderToString(children, options) {
              return renderToStringImpl(children, options, false, 'The server used "renderToString" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server');
            }
            function renderToStaticMarkup(children, options) {
              return renderToStringImpl(children, options, true, 'The server used "renderToStaticMarkup" which does not support Suspense. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server');
            }
            function renderToNodeStream() {
              throw new Error("ReactDOMServer.renderToNodeStream(): The streaming API is not available in the browser. Use ReactDOMServer.renderToString() instead.");
            }
            function renderToStaticNodeStream() {
              throw new Error("ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available in the browser. Use ReactDOMServer.renderToStaticMarkup() instead.");
            }
            exports.renderToNodeStream = renderToNodeStream;
            exports.renderToStaticMarkup = renderToStaticMarkup;
            exports.renderToStaticNodeStream = renderToStaticNodeStream;
            exports.renderToString = renderToString;
            exports.version = ReactVersion;
          })();
        }
      }
    });
  
    // node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js
    var require_react_dom_server_browser_development = __commonJS({
      "node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom-server.browser.development.js"(exports) {
        "use strict";
        init_modules_watch_stub();
        if (true) {
          (function() {
            "use strict";
            var React3 = require_react();
            var ReactVersion = "18.2.0";
            var ReactSharedInternals = React3.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
            function warn(format) {
              {
                {
                  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                  }
                  printWarning("warn", format, args);
                }
              }
            }
            function error(format) {
              {
                {
                  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                  }
                  printWarning("error", format, args);
                }
              }
            }
            function printWarning(level, format, args) {
              {
                var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
                var stack = ReactDebugCurrentFrame2.getStackAddendum();
                if (stack !== "") {
                  format += "%s";
                  args = args.concat([stack]);
                }
                var argsWithFormat = args.map(function(item) {
                  return String(item);
                });
                argsWithFormat.unshift("Warning: " + format);
                Function.prototype.apply.call(console[level], console, argsWithFormat);
              }
            }
            function scheduleWork(callback) {
              callback();
            }
            var VIEW_SIZE = 512;
            var currentView = null;
            var writtenBytes = 0;
            function beginWriting(destination) {
              currentView = new Uint8Array(VIEW_SIZE);
              writtenBytes = 0;
            }
            function writeChunk(destination, chunk) {
              if (chunk.length === 0) {
                return;
              }
              if (chunk.length > VIEW_SIZE) {
                if (writtenBytes > 0) {
                  destination.enqueue(new Uint8Array(currentView.buffer, 0, writtenBytes));
                  currentView = new Uint8Array(VIEW_SIZE);
                  writtenBytes = 0;
                }
                destination.enqueue(chunk);
                return;
              }
              var bytesToWrite = chunk;
              var allowableBytes = currentView.length - writtenBytes;
              if (allowableBytes < bytesToWrite.length) {
                if (allowableBytes === 0) {
                  destination.enqueue(currentView);
                } else {
                  currentView.set(bytesToWrite.subarray(0, allowableBytes), writtenBytes);
                  destination.enqueue(currentView);
                  bytesToWrite = bytesToWrite.subarray(allowableBytes);
                }
                currentView = new Uint8Array(VIEW_SIZE);
                writtenBytes = 0;
              }
              currentView.set(bytesToWrite, writtenBytes);
              writtenBytes += bytesToWrite.length;
            }
            function writeChunkAndReturn(destination, chunk) {
              writeChunk(destination, chunk);
              return true;
            }
            function completeWriting(destination) {
              if (currentView && writtenBytes > 0) {
                destination.enqueue(new Uint8Array(currentView.buffer, 0, writtenBytes));
                currentView = null;
                writtenBytes = 0;
              }
            }
            function close(destination) {
              destination.close();
            }
            var textEncoder = new TextEncoder();
            function stringToChunk(content) {
              return textEncoder.encode(content);
            }
            function stringToPrecomputedChunk(content) {
              return textEncoder.encode(content);
            }
            function closeWithError(destination, error2) {
              if (typeof destination.error === "function") {
                destination.error(error2);
              } else {
                destination.close();
              }
            }
            function typeName(value) {
              {
                var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
                var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
                return type;
              }
            }
            function willCoercionThrow(value) {
              {
                try {
                  testStringCoercion(value);
                  return false;
                } catch (e) {
                  return true;
                }
              }
            }
            function testStringCoercion(value) {
              return "" + value;
            }
            function checkAttributeStringCoercion(value, attributeName) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided `%s` attribute is an unsupported type %s. This value must be coerced to a string before before using it here.", attributeName, typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            function checkCSSPropertyStringCoercion(value, propName) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided `%s` CSS property is an unsupported type %s. This value must be coerced to a string before before using it here.", propName, typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            function checkHtmlStringCoercion(value) {
              {
                if (willCoercionThrow(value)) {
                  error("The provided HTML markup uses a value of unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
                  return testStringCoercion(value);
                }
              }
            }
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            var RESERVED = 0;
            var STRING = 1;
            var BOOLEANISH_STRING = 2;
            var BOOLEAN = 3;
            var OVERLOADED_BOOLEAN = 4;
            var NUMERIC = 5;
            var POSITIVE_NUMERIC = 6;
            var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
            var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
            var VALID_ATTRIBUTE_NAME_REGEX = new RegExp("^[" + ATTRIBUTE_NAME_START_CHAR + "][" + ATTRIBUTE_NAME_CHAR + "]*$");
            var illegalAttributeNameCache = {};
            var validatedAttributeNameCache = {};
            function isAttributeNameSafe(attributeName) {
              if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
                return true;
              }
              if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
                return false;
              }
              if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
                validatedAttributeNameCache[attributeName] = true;
                return true;
              }
              illegalAttributeNameCache[attributeName] = true;
              {
                error("Invalid attribute name: `%s`", attributeName);
              }
              return false;
            }
            function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
              if (propertyInfo !== null && propertyInfo.type === RESERVED) {
                return false;
              }
              switch (typeof value) {
                case "function":
                case "symbol":
                  return true;
                case "boolean": {
                  if (isCustomComponentTag) {
                    return false;
                  }
                  if (propertyInfo !== null) {
                    return !propertyInfo.acceptsBooleans;
                  } else {
                    var prefix2 = name.toLowerCase().slice(0, 5);
                    return prefix2 !== "data-" && prefix2 !== "aria-";
                  }
                }
                default:
                  return false;
              }
            }
            function getPropertyInfo(name) {
              return properties.hasOwnProperty(name) ? properties[name] : null;
            }
            function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL2, removeEmptyString) {
              this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
              this.attributeName = attributeName;
              this.attributeNamespace = attributeNamespace;
              this.mustUseProperty = mustUseProperty;
              this.propertyName = name;
              this.type = type;
              this.sanitizeURL = sanitizeURL2;
              this.removeEmptyString = removeEmptyString;
            }
            var properties = {};
            var reservedProps = [
              "children",
              "dangerouslySetInnerHTML",
              // TODO: This prevents the assignment of defaultValue to regular
              // elements (not just inputs). Now that ReactDOMInput assigns to the
              // defaultValue property -- do we need this?
              "defaultValue",
              "defaultChecked",
              "innerHTML",
              "suppressContentEditableWarning",
              "suppressHydrationWarning",
              "style"
            ];
            reservedProps.forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                RESERVED,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(_ref) {
              var name = _ref[0], attributeName = _ref[1];
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEANISH_STRING,
                false,
                // mustUseProperty
                name.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEANISH_STRING,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "allowFullScreen",
              "async",
              // Note: there is a special case that prevents it from being written to the DOM
              // on the client side because the browsers are inconsistent. Instead we call focus().
              "autoFocus",
              "autoPlay",
              "controls",
              "default",
              "defer",
              "disabled",
              "disablePictureInPicture",
              "disableRemotePlayback",
              "formNoValidate",
              "hidden",
              "loop",
              "noModule",
              "noValidate",
              "open",
              "playsInline",
              "readOnly",
              "required",
              "reversed",
              "scoped",
              "seamless",
              // Microdata
              "itemScope"
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEAN,
                false,
                // mustUseProperty
                name.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "checked",
              // Note: `option.selected` is not updated if `select.multiple` is
              // disabled with `removeAttribute`. We have special logic for handling this.
              "multiple",
              "muted",
              "selected"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                BOOLEAN,
                true,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "capture",
              "download"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                OVERLOADED_BOOLEAN,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "cols",
              "rows",
              "size",
              "span"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                POSITIVE_NUMERIC,
                false,
                // mustUseProperty
                name,
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            ["rowSpan", "start"].forEach(function(name) {
              properties[name] = new PropertyInfoRecord(
                name,
                NUMERIC,
                false,
                // mustUseProperty
                name.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            var CAMELIZE = /[\-\:]([a-z])/g;
            var capitalize = function(token) {
              return token[1].toUpperCase();
            };
            [
              "accent-height",
              "alignment-baseline",
              "arabic-form",
              "baseline-shift",
              "cap-height",
              "clip-path",
              "clip-rule",
              "color-interpolation",
              "color-interpolation-filters",
              "color-profile",
              "color-rendering",
              "dominant-baseline",
              "enable-background",
              "fill-opacity",
              "fill-rule",
              "flood-color",
              "flood-opacity",
              "font-family",
              "font-size",
              "font-size-adjust",
              "font-stretch",
              "font-style",
              "font-variant",
              "font-weight",
              "glyph-name",
              "glyph-orientation-horizontal",
              "glyph-orientation-vertical",
              "horiz-adv-x",
              "horiz-origin-x",
              "image-rendering",
              "letter-spacing",
              "lighting-color",
              "marker-end",
              "marker-mid",
              "marker-start",
              "overline-position",
              "overline-thickness",
              "paint-order",
              "panose-1",
              "pointer-events",
              "rendering-intent",
              "shape-rendering",
              "stop-color",
              "stop-opacity",
              "strikethrough-position",
              "strikethrough-thickness",
              "stroke-dasharray",
              "stroke-dashoffset",
              "stroke-linecap",
              "stroke-linejoin",
              "stroke-miterlimit",
              "stroke-opacity",
              "stroke-width",
              "text-anchor",
              "text-decoration",
              "text-rendering",
              "underline-position",
              "underline-thickness",
              "unicode-bidi",
              "unicode-range",
              "units-per-em",
              "v-alphabetic",
              "v-hanging",
              "v-ideographic",
              "v-mathematical",
              "vector-effect",
              "vert-adv-y",
              "vert-origin-x",
              "vert-origin-y",
              "word-spacing",
              "writing-mode",
              "xmlns:xlink",
              "x-height"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(attributeName) {
              var name = attributeName.replace(CAMELIZE, capitalize);
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            [
              "xlink:actuate",
              "xlink:arcrole",
              "xlink:role",
              "xlink:show",
              "xlink:title",
              "xlink:type"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(attributeName) {
              var name = attributeName.replace(CAMELIZE, capitalize);
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                "http://www.w3.org/1999/xlink",
                false,
                // sanitizeURL
                false
              );
            });
            [
              "xml:base",
              "xml:lang",
              "xml:space"
              // NOTE: if you add a camelCased prop to this list,
              // you'll need to set attributeName to name.toLowerCase()
              // instead in the assignment below.
            ].forEach(function(attributeName) {
              var name = attributeName.replace(CAMELIZE, capitalize);
              properties[name] = new PropertyInfoRecord(
                name,
                STRING,
                false,
                // mustUseProperty
                attributeName,
                "http://www.w3.org/XML/1998/namespace",
                false,
                // sanitizeURL
                false
              );
            });
            ["tabIndex", "crossOrigin"].forEach(function(attributeName) {
              properties[attributeName] = new PropertyInfoRecord(
                attributeName,
                STRING,
                false,
                // mustUseProperty
                attributeName.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                false,
                // sanitizeURL
                false
              );
            });
            var xlinkHref = "xlinkHref";
            properties[xlinkHref] = new PropertyInfoRecord(
              "xlinkHref",
              STRING,
              false,
              // mustUseProperty
              "xlink:href",
              "http://www.w3.org/1999/xlink",
              true,
              // sanitizeURL
              false
            );
            ["src", "href", "action", "formAction"].forEach(function(attributeName) {
              properties[attributeName] = new PropertyInfoRecord(
                attributeName,
                STRING,
                false,
                // mustUseProperty
                attributeName.toLowerCase(),
                // attributeName
                null,
                // attributeNamespace
                true,
                // sanitizeURL
                true
              );
            });
            var isUnitlessNumber = {
              animationIterationCount: true,
              aspectRatio: true,
              borderImageOutset: true,
              borderImageSlice: true,
              borderImageWidth: true,
              boxFlex: true,
              boxFlexGroup: true,
              boxOrdinalGroup: true,
              columnCount: true,
              columns: true,
              flex: true,
              flexGrow: true,
              flexPositive: true,
              flexShrink: true,
              flexNegative: true,
              flexOrder: true,
              gridArea: true,
              gridRow: true,
              gridRowEnd: true,
              gridRowSpan: true,
              gridRowStart: true,
              gridColumn: true,
              gridColumnEnd: true,
              gridColumnSpan: true,
              gridColumnStart: true,
              fontWeight: true,
              lineClamp: true,
              lineHeight: true,
              opacity: true,
              order: true,
              orphans: true,
              tabSize: true,
              widows: true,
              zIndex: true,
              zoom: true,
              // SVG-related properties
              fillOpacity: true,
              floodOpacity: true,
              stopOpacity: true,
              strokeDasharray: true,
              strokeDashoffset: true,
              strokeMiterlimit: true,
              strokeOpacity: true,
              strokeWidth: true
            };
            function prefixKey(prefix2, key) {
              return prefix2 + key.charAt(0).toUpperCase() + key.substring(1);
            }
            var prefixes = ["Webkit", "ms", "Moz", "O"];
            Object.keys(isUnitlessNumber).forEach(function(prop) {
              prefixes.forEach(function(prefix2) {
                isUnitlessNumber[prefixKey(prefix2, prop)] = isUnitlessNumber[prop];
              });
            });
            var hasReadOnlyValue = {
              button: true,
              checkbox: true,
              image: true,
              hidden: true,
              radio: true,
              reset: true,
              submit: true
            };
            function checkControlledValueProps(tagName, props) {
              {
                if (!(hasReadOnlyValue[props.type] || props.onChange || props.onInput || props.readOnly || props.disabled || props.value == null)) {
                  error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");
                }
                if (!(props.onChange || props.readOnly || props.disabled || props.checked == null)) {
                  error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
                }
              }
            }
            function isCustomComponent(tagName, props) {
              if (tagName.indexOf("-") === -1) {
                return typeof props.is === "string";
              }
              switch (tagName) {
                case "annotation-xml":
                case "color-profile":
                case "font-face":
                case "font-face-src":
                case "font-face-uri":
                case "font-face-format":
                case "font-face-name":
                case "missing-glyph":
                  return false;
                default:
                  return true;
              }
            }
            var ariaProperties = {
              "aria-current": 0,
              // state
              "aria-description": 0,
              "aria-details": 0,
              "aria-disabled": 0,
              // state
              "aria-hidden": 0,
              // state
              "aria-invalid": 0,
              // state
              "aria-keyshortcuts": 0,
              "aria-label": 0,
              "aria-roledescription": 0,
              // Widget Attributes
              "aria-autocomplete": 0,
              "aria-checked": 0,
              "aria-expanded": 0,
              "aria-haspopup": 0,
              "aria-level": 0,
              "aria-modal": 0,
              "aria-multiline": 0,
              "aria-multiselectable": 0,
              "aria-orientation": 0,
              "aria-placeholder": 0,
              "aria-pressed": 0,
              "aria-readonly": 0,
              "aria-required": 0,
              "aria-selected": 0,
              "aria-sort": 0,
              "aria-valuemax": 0,
              "aria-valuemin": 0,
              "aria-valuenow": 0,
              "aria-valuetext": 0,
              // Live Region Attributes
              "aria-atomic": 0,
              "aria-busy": 0,
              "aria-live": 0,
              "aria-relevant": 0,
              // Drag-and-Drop Attributes
              "aria-dropeffect": 0,
              "aria-grabbed": 0,
              // Relationship Attributes
              "aria-activedescendant": 0,
              "aria-colcount": 0,
              "aria-colindex": 0,
              "aria-colspan": 0,
              "aria-controls": 0,
              "aria-describedby": 0,
              "aria-errormessage": 0,
              "aria-flowto": 0,
              "aria-labelledby": 0,
              "aria-owns": 0,
              "aria-posinset": 0,
              "aria-rowcount": 0,
              "aria-rowindex": 0,
              "aria-rowspan": 0,
              "aria-setsize": 0
            };
            var warnedProperties = {};
            var rARIA = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
            var rARIACamel = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");
            function validateProperty(tagName, name) {
              {
                if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
                  return true;
                }
                if (rARIACamel.test(name)) {
                  var ariaName = "aria-" + name.slice(4).toLowerCase();
                  var correctName = ariaProperties.hasOwnProperty(ariaName) ? ariaName : null;
                  if (correctName == null) {
                    error("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", name);
                    warnedProperties[name] = true;
                    return true;
                  }
                  if (name !== correctName) {
                    error("Invalid ARIA attribute `%s`. Did you mean `%s`?", name, correctName);
                    warnedProperties[name] = true;
                    return true;
                  }
                }
                if (rARIA.test(name)) {
                  var lowerCasedName = name.toLowerCase();
                  var standardName = ariaProperties.hasOwnProperty(lowerCasedName) ? lowerCasedName : null;
                  if (standardName == null) {
                    warnedProperties[name] = true;
                    return false;
                  }
                  if (name !== standardName) {
                    error("Unknown ARIA attribute `%s`. Did you mean `%s`?", name, standardName);
                    warnedProperties[name] = true;
                    return true;
                  }
                }
              }
              return true;
            }
            function warnInvalidARIAProps(type, props) {
              {
                var invalidProps = [];
                for (var key in props) {
                  var isValid = validateProperty(type, key);
                  if (!isValid) {
                    invalidProps.push(key);
                  }
                }
                var unknownPropString = invalidProps.map(function(prop) {
                  return "`" + prop + "`";
                }).join(", ");
                if (invalidProps.length === 1) {
                  error("Invalid aria prop %s on <%s> tag. For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
                } else if (invalidProps.length > 1) {
                  error("Invalid aria props %s on <%s> tag. For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
                }
              }
            }
            function validateProperties(type, props) {
              if (isCustomComponent(type, props)) {
                return;
              }
              warnInvalidARIAProps(type, props);
            }
            var didWarnValueNull = false;
            function validateProperties$1(type, props) {
              {
                if (type !== "input" && type !== "textarea" && type !== "select") {
                  return;
                }
                if (props != null && props.value === null && !didWarnValueNull) {
                  didWarnValueNull = true;
                  if (type === "select" && props.multiple) {
                    error("`value` prop on `%s` should not be null. Consider using an empty array when `multiple` is set to `true` to clear the component or `undefined` for uncontrolled components.", type);
                  } else {
                    error("`value` prop on `%s` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.", type);
                  }
                }
              }
            }
            var possibleStandardNames = {
              // HTML
              accept: "accept",
              acceptcharset: "acceptCharset",
              "accept-charset": "acceptCharset",
              accesskey: "accessKey",
              action: "action",
              allowfullscreen: "allowFullScreen",
              alt: "alt",
              as: "as",
              async: "async",
              autocapitalize: "autoCapitalize",
              autocomplete: "autoComplete",
              autocorrect: "autoCorrect",
              autofocus: "autoFocus",
              autoplay: "autoPlay",
              autosave: "autoSave",
              capture: "capture",
              cellpadding: "cellPadding",
              cellspacing: "cellSpacing",
              challenge: "challenge",
              charset: "charSet",
              checked: "checked",
              children: "children",
              cite: "cite",
              class: "className",
              classid: "classID",
              classname: "className",
              cols: "cols",
              colspan: "colSpan",
              content: "content",
              contenteditable: "contentEditable",
              contextmenu: "contextMenu",
              controls: "controls",
              controlslist: "controlsList",
              coords: "coords",
              crossorigin: "crossOrigin",
              dangerouslysetinnerhtml: "dangerouslySetInnerHTML",
              data: "data",
              datetime: "dateTime",
              default: "default",
              defaultchecked: "defaultChecked",
              defaultvalue: "defaultValue",
              defer: "defer",
              dir: "dir",
              disabled: "disabled",
              disablepictureinpicture: "disablePictureInPicture",
              disableremoteplayback: "disableRemotePlayback",
              download: "download",
              draggable: "draggable",
              enctype: "encType",
              enterkeyhint: "enterKeyHint",
              for: "htmlFor",
              form: "form",
              formmethod: "formMethod",
              formaction: "formAction",
              formenctype: "formEncType",
              formnovalidate: "formNoValidate",
              formtarget: "formTarget",
              frameborder: "frameBorder",
              headers: "headers",
              height: "height",
              hidden: "hidden",
              high: "high",
              href: "href",
              hreflang: "hrefLang",
              htmlfor: "htmlFor",
              httpequiv: "httpEquiv",
              "http-equiv": "httpEquiv",
              icon: "icon",
              id: "id",
              imagesizes: "imageSizes",
              imagesrcset: "imageSrcSet",
              innerhtml: "innerHTML",
              inputmode: "inputMode",
              integrity: "integrity",
              is: "is",
              itemid: "itemID",
              itemprop: "itemProp",
              itemref: "itemRef",
              itemscope: "itemScope",
              itemtype: "itemType",
              keyparams: "keyParams",
              keytype: "keyType",
              kind: "kind",
              label: "label",
              lang: "lang",
              list: "list",
              loop: "loop",
              low: "low",
              manifest: "manifest",
              marginwidth: "marginWidth",
              marginheight: "marginHeight",
              max: "max",
              maxlength: "maxLength",
              media: "media",
              mediagroup: "mediaGroup",
              method: "method",
              min: "min",
              minlength: "minLength",
              multiple: "multiple",
              muted: "muted",
              name: "name",
              nomodule: "noModule",
              nonce: "nonce",
              novalidate: "noValidate",
              open: "open",
              optimum: "optimum",
              pattern: "pattern",
              placeholder: "placeholder",
              playsinline: "playsInline",
              poster: "poster",
              preload: "preload",
              profile: "profile",
              radiogroup: "radioGroup",
              readonly: "readOnly",
              referrerpolicy: "referrerPolicy",
              rel: "rel",
              required: "required",
              reversed: "reversed",
              role: "role",
              rows: "rows",
              rowspan: "rowSpan",
              sandbox: "sandbox",
              scope: "scope",
              scoped: "scoped",
              scrolling: "scrolling",
              seamless: "seamless",
              selected: "selected",
              shape: "shape",
              size: "size",
              sizes: "sizes",
              span: "span",
              spellcheck: "spellCheck",
              src: "src",
              srcdoc: "srcDoc",
              srclang: "srcLang",
              srcset: "srcSet",
              start: "start",
              step: "step",
              style: "style",
              summary: "summary",
              tabindex: "tabIndex",
              target: "target",
              title: "title",
              type: "type",
              usemap: "useMap",
              value: "value",
              width: "width",
              wmode: "wmode",
              wrap: "wrap",
              // SVG
              about: "about",
              accentheight: "accentHeight",
              "accent-height": "accentHeight",
              accumulate: "accumulate",
              additive: "additive",
              alignmentbaseline: "alignmentBaseline",
              "alignment-baseline": "alignmentBaseline",
              allowreorder: "allowReorder",
              alphabetic: "alphabetic",
              amplitude: "amplitude",
              arabicform: "arabicForm",
              "arabic-form": "arabicForm",
              ascent: "ascent",
              attributename: "attributeName",
              attributetype: "attributeType",
              autoreverse: "autoReverse",
              azimuth: "azimuth",
              basefrequency: "baseFrequency",
              baselineshift: "baselineShift",
              "baseline-shift": "baselineShift",
              baseprofile: "baseProfile",
              bbox: "bbox",
              begin: "begin",
              bias: "bias",
              by: "by",
              calcmode: "calcMode",
              capheight: "capHeight",
              "cap-height": "capHeight",
              clip: "clip",
              clippath: "clipPath",
              "clip-path": "clipPath",
              clippathunits: "clipPathUnits",
              cliprule: "clipRule",
              "clip-rule": "clipRule",
              color: "color",
              colorinterpolation: "colorInterpolation",
              "color-interpolation": "colorInterpolation",
              colorinterpolationfilters: "colorInterpolationFilters",
              "color-interpolation-filters": "colorInterpolationFilters",
              colorprofile: "colorProfile",
              "color-profile": "colorProfile",
              colorrendering: "colorRendering",
              "color-rendering": "colorRendering",
              contentscripttype: "contentScriptType",
              contentstyletype: "contentStyleType",
              cursor: "cursor",
              cx: "cx",
              cy: "cy",
              d: "d",
              datatype: "datatype",
              decelerate: "decelerate",
              descent: "descent",
              diffuseconstant: "diffuseConstant",
              direction: "direction",
              display: "display",
              divisor: "divisor",
              dominantbaseline: "dominantBaseline",
              "dominant-baseline": "dominantBaseline",
              dur: "dur",
              dx: "dx",
              dy: "dy",
              edgemode: "edgeMode",
              elevation: "elevation",
              enablebackground: "enableBackground",
              "enable-background": "enableBackground",
              end: "end",
              exponent: "exponent",
              externalresourcesrequired: "externalResourcesRequired",
              fill: "fill",
              fillopacity: "fillOpacity",
              "fill-opacity": "fillOpacity",
              fillrule: "fillRule",
              "fill-rule": "fillRule",
              filter: "filter",
              filterres: "filterRes",
              filterunits: "filterUnits",
              floodopacity: "floodOpacity",
              "flood-opacity": "floodOpacity",
              floodcolor: "floodColor",
              "flood-color": "floodColor",
              focusable: "focusable",
              fontfamily: "fontFamily",
              "font-family": "fontFamily",
              fontsize: "fontSize",
              "font-size": "fontSize",
              fontsizeadjust: "fontSizeAdjust",
              "font-size-adjust": "fontSizeAdjust",
              fontstretch: "fontStretch",
              "font-stretch": "fontStretch",
              fontstyle: "fontStyle",
              "font-style": "fontStyle",
              fontvariant: "fontVariant",
              "font-variant": "fontVariant",
              fontweight: "fontWeight",
              "font-weight": "fontWeight",
              format: "format",
              from: "from",
              fx: "fx",
              fy: "fy",
              g1: "g1",
              g2: "g2",
              glyphname: "glyphName",
              "glyph-name": "glyphName",
              glyphorientationhorizontal: "glyphOrientationHorizontal",
              "glyph-orientation-horizontal": "glyphOrientationHorizontal",
              glyphorientationvertical: "glyphOrientationVertical",
              "glyph-orientation-vertical": "glyphOrientationVertical",
              glyphref: "glyphRef",
              gradienttransform: "gradientTransform",
              gradientunits: "gradientUnits",
              hanging: "hanging",
              horizadvx: "horizAdvX",
              "horiz-adv-x": "horizAdvX",
              horizoriginx: "horizOriginX",
              "horiz-origin-x": "horizOriginX",
              ideographic: "ideographic",
              imagerendering: "imageRendering",
              "image-rendering": "imageRendering",
              in2: "in2",
              in: "in",
              inlist: "inlist",
              intercept: "intercept",
              k1: "k1",
              k2: "k2",
              k3: "k3",
              k4: "k4",
              k: "k",
              kernelmatrix: "kernelMatrix",
              kernelunitlength: "kernelUnitLength",
              kerning: "kerning",
              keypoints: "keyPoints",
              keysplines: "keySplines",
              keytimes: "keyTimes",
              lengthadjust: "lengthAdjust",
              letterspacing: "letterSpacing",
              "letter-spacing": "letterSpacing",
              lightingcolor: "lightingColor",
              "lighting-color": "lightingColor",
              limitingconeangle: "limitingConeAngle",
              local: "local",
              markerend: "markerEnd",
              "marker-end": "markerEnd",
              markerheight: "markerHeight",
              markermid: "markerMid",
              "marker-mid": "markerMid",
              markerstart: "markerStart",
              "marker-start": "markerStart",
              markerunits: "markerUnits",
              markerwidth: "markerWidth",
              mask: "mask",
              maskcontentunits: "maskContentUnits",
              maskunits: "maskUnits",
              mathematical: "mathematical",
              mode: "mode",
              numoctaves: "numOctaves",
              offset: "offset",
              opacity: "opacity",
              operator: "operator",
              order: "order",
              orient: "orient",
              orientation: "orientation",
              origin: "origin",
              overflow: "overflow",
              overlineposition: "overlinePosition",
              "overline-position": "overlinePosition",
              overlinethickness: "overlineThickness",
              "overline-thickness": "overlineThickness",
              paintorder: "paintOrder",
              "paint-order": "paintOrder",
              panose1: "panose1",
              "panose-1": "panose1",
              pathlength: "pathLength",
              patterncontentunits: "patternContentUnits",
              patterntransform: "patternTransform",
              patternunits: "patternUnits",
              pointerevents: "pointerEvents",
              "pointer-events": "pointerEvents",
              points: "points",
              pointsatx: "pointsAtX",
              pointsaty: "pointsAtY",
              pointsatz: "pointsAtZ",
              prefix: "prefix",
              preservealpha: "preserveAlpha",
              preserveaspectratio: "preserveAspectRatio",
              primitiveunits: "primitiveUnits",
              property: "property",
              r: "r",
              radius: "radius",
              refx: "refX",
              refy: "refY",
              renderingintent: "renderingIntent",
              "rendering-intent": "renderingIntent",
              repeatcount: "repeatCount",
              repeatdur: "repeatDur",
              requiredextensions: "requiredExtensions",
              requiredfeatures: "requiredFeatures",
              resource: "resource",
              restart: "restart",
              result: "result",
              results: "results",
              rotate: "rotate",
              rx: "rx",
              ry: "ry",
              scale: "scale",
              security: "security",
              seed: "seed",
              shaperendering: "shapeRendering",
              "shape-rendering": "shapeRendering",
              slope: "slope",
              spacing: "spacing",
              specularconstant: "specularConstant",
              specularexponent: "specularExponent",
              speed: "speed",
              spreadmethod: "spreadMethod",
              startoffset: "startOffset",
              stddeviation: "stdDeviation",
              stemh: "stemh",
              stemv: "stemv",
              stitchtiles: "stitchTiles",
              stopcolor: "stopColor",
              "stop-color": "stopColor",
              stopopacity: "stopOpacity",
              "stop-opacity": "stopOpacity",
              strikethroughposition: "strikethroughPosition",
              "strikethrough-position": "strikethroughPosition",
              strikethroughthickness: "strikethroughThickness",
              "strikethrough-thickness": "strikethroughThickness",
              string: "string",
              stroke: "stroke",
              strokedasharray: "strokeDasharray",
              "stroke-dasharray": "strokeDasharray",
              strokedashoffset: "strokeDashoffset",
              "stroke-dashoffset": "strokeDashoffset",
              strokelinecap: "strokeLinecap",
              "stroke-linecap": "strokeLinecap",
              strokelinejoin: "strokeLinejoin",
              "stroke-linejoin": "strokeLinejoin",
              strokemiterlimit: "strokeMiterlimit",
              "stroke-miterlimit": "strokeMiterlimit",
              strokewidth: "strokeWidth",
              "stroke-width": "strokeWidth",
              strokeopacity: "strokeOpacity",
              "stroke-opacity": "strokeOpacity",
              suppresscontenteditablewarning: "suppressContentEditableWarning",
              suppresshydrationwarning: "suppressHydrationWarning",
              surfacescale: "surfaceScale",
              systemlanguage: "systemLanguage",
              tablevalues: "tableValues",
              targetx: "targetX",
              targety: "targetY",
              textanchor: "textAnchor",
              "text-anchor": "textAnchor",
              textdecoration: "textDecoration",
              "text-decoration": "textDecoration",
              textlength: "textLength",
              textrendering: "textRendering",
              "text-rendering": "textRendering",
              to: "to",
              transform: "transform",
              typeof: "typeof",
              u1: "u1",
              u2: "u2",
              underlineposition: "underlinePosition",
              "underline-position": "underlinePosition",
              underlinethickness: "underlineThickness",
              "underline-thickness": "underlineThickness",
              unicode: "unicode",
              unicodebidi: "unicodeBidi",
              "unicode-bidi": "unicodeBidi",
              unicoderange: "unicodeRange",
              "unicode-range": "unicodeRange",
              unitsperem: "unitsPerEm",
              "units-per-em": "unitsPerEm",
              unselectable: "unselectable",
              valphabetic: "vAlphabetic",
              "v-alphabetic": "vAlphabetic",
              values: "values",
              vectoreffect: "vectorEffect",
              "vector-effect": "vectorEffect",
              version: "version",
              vertadvy: "vertAdvY",
              "vert-adv-y": "vertAdvY",
              vertoriginx: "vertOriginX",
              "vert-origin-x": "vertOriginX",
              vertoriginy: "vertOriginY",
              "vert-origin-y": "vertOriginY",
              vhanging: "vHanging",
              "v-hanging": "vHanging",
              videographic: "vIdeographic",
              "v-ideographic": "vIdeographic",
              viewbox: "viewBox",
              viewtarget: "viewTarget",
              visibility: "visibility",
              vmathematical: "vMathematical",
              "v-mathematical": "vMathematical",
              vocab: "vocab",
              widths: "widths",
              wordspacing: "wordSpacing",
              "word-spacing": "wordSpacing",
              writingmode: "writingMode",
              "writing-mode": "writingMode",
              x1: "x1",
              x2: "x2",
              x: "x",
              xchannelselector: "xChannelSelector",
              xheight: "xHeight",
              "x-height": "xHeight",
              xlinkactuate: "xlinkActuate",
              "xlink:actuate": "xlinkActuate",
              xlinkarcrole: "xlinkArcrole",
              "xlink:arcrole": "xlinkArcrole",
              xlinkhref: "xlinkHref",
              "xlink:href": "xlinkHref",
              xlinkrole: "xlinkRole",
              "xlink:role": "xlinkRole",
              xlinkshow: "xlinkShow",
              "xlink:show": "xlinkShow",
              xlinktitle: "xlinkTitle",
              "xlink:title": "xlinkTitle",
              xlinktype: "xlinkType",
              "xlink:type": "xlinkType",
              xmlbase: "xmlBase",
              "xml:base": "xmlBase",
              xmllang: "xmlLang",
              "xml:lang": "xmlLang",
              xmlns: "xmlns",
              "xml:space": "xmlSpace",
              xmlnsxlink: "xmlnsXlink",
              "xmlns:xlink": "xmlnsXlink",
              xmlspace: "xmlSpace",
              y1: "y1",
              y2: "y2",
              y: "y",
              ychannelselector: "yChannelSelector",
              z: "z",
              zoomandpan: "zoomAndPan"
            };
            var validateProperty$1 = function() {
            };
            {
              var warnedProperties$1 = {};
              var EVENT_NAME_REGEX = /^on./;
              var INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
              var rARIA$1 = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
              var rARIACamel$1 = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");
              validateProperty$1 = function(tagName, name, value, eventRegistry) {
                if (hasOwnProperty.call(warnedProperties$1, name) && warnedProperties$1[name]) {
                  return true;
                }
                var lowerCasedName = name.toLowerCase();
                if (lowerCasedName === "onfocusin" || lowerCasedName === "onfocusout") {
                  error("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React.");
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (eventRegistry != null) {
                  var registrationNameDependencies = eventRegistry.registrationNameDependencies, possibleRegistrationNames = eventRegistry.possibleRegistrationNames;
                  if (registrationNameDependencies.hasOwnProperty(name)) {
                    return true;
                  }
                  var registrationName = possibleRegistrationNames.hasOwnProperty(lowerCasedName) ? possibleRegistrationNames[lowerCasedName] : null;
                  if (registrationName != null) {
                    error("Invalid event handler property `%s`. Did you mean `%s`?", name, registrationName);
                    warnedProperties$1[name] = true;
                    return true;
                  }
                  if (EVENT_NAME_REGEX.test(name)) {
                    error("Unknown event handler property `%s`. It will be ignored.", name);
                    warnedProperties$1[name] = true;
                    return true;
                  }
                } else if (EVENT_NAME_REGEX.test(name)) {
                  if (INVALID_EVENT_NAME_REGEX.test(name)) {
                    error("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", name);
                  }
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (rARIA$1.test(name) || rARIACamel$1.test(name)) {
                  return true;
                }
                if (lowerCasedName === "innerhtml") {
                  error("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`.");
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (lowerCasedName === "aria") {
                  error("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead.");
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (lowerCasedName === "is" && value !== null && value !== void 0 && typeof value !== "string") {
                  error("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof value);
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (typeof value === "number" && isNaN(value)) {
                  error("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", name);
                  warnedProperties$1[name] = true;
                  return true;
                }
                var propertyInfo = getPropertyInfo(name);
                var isReserved = propertyInfo !== null && propertyInfo.type === RESERVED;
                if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
                  var standardName = possibleStandardNames[lowerCasedName];
                  if (standardName !== name) {
                    error("Invalid DOM property `%s`. Did you mean `%s`?", name, standardName);
                    warnedProperties$1[name] = true;
                    return true;
                  }
                } else if (!isReserved && name !== lowerCasedName) {
                  error("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", name, lowerCasedName);
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (typeof value === "boolean" && shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
                  if (value) {
                    error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', value, name, name, value, name);
                  } else {
                    error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', value, name, name, value, name, name, name);
                  }
                  warnedProperties$1[name] = true;
                  return true;
                }
                if (isReserved) {
                  return true;
                }
                if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
                  warnedProperties$1[name] = true;
                  return false;
                }
                if ((value === "false" || value === "true") && propertyInfo !== null && propertyInfo.type === BOOLEAN) {
                  error("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", value, name, value === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', name, value);
                  warnedProperties$1[name] = true;
                  return true;
                }
                return true;
              };
            }
            var warnUnknownProperties = function(type, props, eventRegistry) {
              {
                var unknownProps = [];
                for (var key in props) {
                  var isValid = validateProperty$1(type, key, props[key], eventRegistry);
                  if (!isValid) {
                    unknownProps.push(key);
                  }
                }
                var unknownPropString = unknownProps.map(function(prop) {
                  return "`" + prop + "`";
                }).join(", ");
                if (unknownProps.length === 1) {
                  error("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://reactjs.org/link/attribute-behavior ", unknownPropString, type);
                } else if (unknownProps.length > 1) {
                  error("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://reactjs.org/link/attribute-behavior ", unknownPropString, type);
                }
              }
            };
            function validateProperties$2(type, props, eventRegistry) {
              if (isCustomComponent(type, props)) {
                return;
              }
              warnUnknownProperties(type, props, eventRegistry);
            }
            var warnValidStyle = function() {
            };
            {
              var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
              var msPattern = /^-ms-/;
              var hyphenPattern = /-(.)/g;
              var badStyleValueWithSemicolonPattern = /;\s*$/;
              var warnedStyleNames = {};
              var warnedStyleValues = {};
              var warnedForNaNValue = false;
              var warnedForInfinityValue = false;
              var camelize = function(string) {
                return string.replace(hyphenPattern, function(_, character) {
                  return character.toUpperCase();
                });
              };
              var warnHyphenatedStyleName = function(name) {
                if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
                  return;
                }
                warnedStyleNames[name] = true;
                error(
                  "Unsupported style property %s. Did you mean %s?",
                  name,
                  // As Andi Smith suggests
                  // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
                  // is converted to lowercase `ms`.
                  camelize(name.replace(msPattern, "ms-"))
                );
              };
              var warnBadVendoredStyleName = function(name) {
                if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
                  return;
                }
                warnedStyleNames[name] = true;
                error("Unsupported vendor-prefixed style property %s. Did you mean %s?", name, name.charAt(0).toUpperCase() + name.slice(1));
              };
              var warnStyleValueWithSemicolon = function(name, value) {
                if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
                  return;
                }
                warnedStyleValues[value] = true;
                error(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, name, value.replace(badStyleValueWithSemicolonPattern, ""));
              };
              var warnStyleValueIsNaN = function(name, value) {
                if (warnedForNaNValue) {
                  return;
                }
                warnedForNaNValue = true;
                error("`NaN` is an invalid value for the `%s` css style property.", name);
              };
              var warnStyleValueIsInfinity = function(name, value) {
                if (warnedForInfinityValue) {
                  return;
                }
                warnedForInfinityValue = true;
                error("`Infinity` is an invalid value for the `%s` css style property.", name);
              };
              warnValidStyle = function(name, value) {
                if (name.indexOf("-") > -1) {
                  warnHyphenatedStyleName(name);
                } else if (badVendoredStyleNamePattern.test(name)) {
                  warnBadVendoredStyleName(name);
                } else if (badStyleValueWithSemicolonPattern.test(value)) {
                  warnStyleValueWithSemicolon(name, value);
                }
                if (typeof value === "number") {
                  if (isNaN(value)) {
                    warnStyleValueIsNaN(name, value);
                  } else if (!isFinite(value)) {
                    warnStyleValueIsInfinity(name, value);
                  }
                }
              };
            }
            var warnValidStyle$1 = warnValidStyle;
            var matchHtmlRegExp = /["'&<>]/;
            function escapeHtml(string) {
              {
                checkHtmlStringCoercion(string);
              }
              var str = "" + string;
              var match = matchHtmlRegExp.exec(str);
              if (!match) {
                return str;
              }
              var escape;
              var html = "";
              var index;
              var lastIndex = 0;
              for (index = match.index; index < str.length; index++) {
                switch (str.charCodeAt(index)) {
                  case 34:
                    escape = "&quot;";
                    break;
                  case 38:
                    escape = "&amp;";
                    break;
                  case 39:
                    escape = "&#x27;";
                    break;
                  case 60:
                    escape = "&lt;";
                    break;
                  case 62:
                    escape = "&gt;";
                    break;
                  default:
                    continue;
                }
                if (lastIndex !== index) {
                  html += str.substring(lastIndex, index);
                }
                lastIndex = index + 1;
                html += escape;
              }
              return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
            }
            function escapeTextForBrowser(text) {
              if (typeof text === "boolean" || typeof text === "number") {
                return "" + text;
              }
              return escapeHtml(text);
            }
            var uppercasePattern = /([A-Z])/g;
            var msPattern$1 = /^ms-/;
            function hyphenateStyleName(name) {
              return name.replace(uppercasePattern, "-$1").toLowerCase().replace(msPattern$1, "-ms-");
            }
            var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;
            var didWarn = false;
            function sanitizeURL(url) {
              {
                if (!didWarn && isJavaScriptProtocol.test(url)) {
                  didWarn = true;
                  error("A future version of React will block javascript: URLs as a security precaution. Use event handlers instead if you can. If you need to generate unsafe HTML try using dangerouslySetInnerHTML instead. React was passed %s.", JSON.stringify(url));
                }
              }
            }
            var isArrayImpl = Array.isArray;
            function isArray(a) {
              return isArrayImpl(a);
            }
            var startInlineScript = stringToPrecomputedChunk("<script>");
            var endInlineScript = stringToPrecomputedChunk("<\/script>");
            var startScriptSrc = stringToPrecomputedChunk('<script src="');
            var startModuleSrc = stringToPrecomputedChunk('<script type="module" src="');
            var endAsyncScript = stringToPrecomputedChunk('" async=""><\/script>');
            function escapeBootstrapScriptContent(scriptText) {
              {
                checkHtmlStringCoercion(scriptText);
              }
              return ("" + scriptText).replace(scriptRegex, scriptReplacer);
            }
            var scriptRegex = /(<\/|<)(s)(cript)/gi;
            var scriptReplacer = function(match, prefix2, s, suffix) {
              return "" + prefix2 + (s === "s" ? "\\u0073" : "\\u0053") + suffix;
            };
            function createResponseState(identifierPrefix, nonce, bootstrapScriptContent, bootstrapScripts, bootstrapModules) {
              var idPrefix = identifierPrefix === void 0 ? "" : identifierPrefix;
              var inlineScriptWithNonce = nonce === void 0 ? startInlineScript : stringToPrecomputedChunk('<script nonce="' + escapeTextForBrowser(nonce) + '">');
              var bootstrapChunks = [];
              if (bootstrapScriptContent !== void 0) {
                bootstrapChunks.push(inlineScriptWithNonce, stringToChunk(escapeBootstrapScriptContent(bootstrapScriptContent)), endInlineScript);
              }
              if (bootstrapScripts !== void 0) {
                for (var i = 0; i < bootstrapScripts.length; i++) {
                  bootstrapChunks.push(startScriptSrc, stringToChunk(escapeTextForBrowser(bootstrapScripts[i])), endAsyncScript);
                }
              }
              if (bootstrapModules !== void 0) {
                for (var _i = 0; _i < bootstrapModules.length; _i++) {
                  bootstrapChunks.push(startModuleSrc, stringToChunk(escapeTextForBrowser(bootstrapModules[_i])), endAsyncScript);
                }
              }
              return {
                bootstrapChunks,
                startInlineScript: inlineScriptWithNonce,
                placeholderPrefix: stringToPrecomputedChunk(idPrefix + "P:"),
                segmentPrefix: stringToPrecomputedChunk(idPrefix + "S:"),
                boundaryPrefix: idPrefix + "B:",
                idPrefix,
                nextSuspenseID: 0,
                sentCompleteSegmentFunction: false,
                sentCompleteBoundaryFunction: false,
                sentClientRenderFunction: false
              };
            }
            var ROOT_HTML_MODE = 0;
            var HTML_MODE = 1;
            var SVG_MODE = 2;
            var MATHML_MODE = 3;
            var HTML_TABLE_MODE = 4;
            var HTML_TABLE_BODY_MODE = 5;
            var HTML_TABLE_ROW_MODE = 6;
            var HTML_COLGROUP_MODE = 7;
            function createFormatContext(insertionMode, selectedValue) {
              return {
                insertionMode,
                selectedValue
              };
            }
            function createRootFormatContext(namespaceURI) {
              var insertionMode = namespaceURI === "http://www.w3.org/2000/svg" ? SVG_MODE : namespaceURI === "http://www.w3.org/1998/Math/MathML" ? MATHML_MODE : ROOT_HTML_MODE;
              return createFormatContext(insertionMode, null);
            }
            function getChildFormatContext(parentContext, type, props) {
              switch (type) {
                case "select":
                  return createFormatContext(HTML_MODE, props.value != null ? props.value : props.defaultValue);
                case "svg":
                  return createFormatContext(SVG_MODE, null);
                case "math":
                  return createFormatContext(MATHML_MODE, null);
                case "foreignObject":
                  return createFormatContext(HTML_MODE, null);
                case "table":
                  return createFormatContext(HTML_TABLE_MODE, null);
                case "thead":
                case "tbody":
                case "tfoot":
                  return createFormatContext(HTML_TABLE_BODY_MODE, null);
                case "colgroup":
                  return createFormatContext(HTML_COLGROUP_MODE, null);
                case "tr":
                  return createFormatContext(HTML_TABLE_ROW_MODE, null);
              }
              if (parentContext.insertionMode >= HTML_TABLE_MODE) {
                return createFormatContext(HTML_MODE, null);
              }
              if (parentContext.insertionMode === ROOT_HTML_MODE) {
                return createFormatContext(HTML_MODE, null);
              }
              return parentContext;
            }
            var UNINITIALIZED_SUSPENSE_BOUNDARY_ID = null;
            function assignSuspenseBoundaryID(responseState) {
              var generatedID = responseState.nextSuspenseID++;
              return stringToPrecomputedChunk(responseState.boundaryPrefix + generatedID.toString(16));
            }
            function makeId(responseState, treeId, localId) {
              var idPrefix = responseState.idPrefix;
              var id = ":" + idPrefix + "R" + treeId;
              if (localId > 0) {
                id += "H" + localId.toString(32);
              }
              return id + ":";
            }
            function encodeHTMLTextNode(text) {
              return escapeTextForBrowser(text);
            }
            var textSeparator = stringToPrecomputedChunk("<!-- -->");
            function pushTextInstance(target, text, responseState, textEmbedded) {
              if (text === "") {
                return textEmbedded;
              }
              if (textEmbedded) {
                target.push(textSeparator);
              }
              target.push(stringToChunk(encodeHTMLTextNode(text)));
              return true;
            }
            function pushSegmentFinale(target, responseState, lastPushedText, textEmbedded) {
              if (lastPushedText && textEmbedded) {
                target.push(textSeparator);
              }
            }
            var styleNameCache = /* @__PURE__ */ new Map();
            function processStyleName(styleName) {
              var chunk = styleNameCache.get(styleName);
              if (chunk !== void 0) {
                return chunk;
              }
              var result = stringToPrecomputedChunk(escapeTextForBrowser(hyphenateStyleName(styleName)));
              styleNameCache.set(styleName, result);
              return result;
            }
            var styleAttributeStart = stringToPrecomputedChunk(' style="');
            var styleAssign = stringToPrecomputedChunk(":");
            var styleSeparator = stringToPrecomputedChunk(";");
            function pushStyle(target, responseState, style) {
              if (typeof style !== "object") {
                throw new Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
              }
              var isFirst = true;
              for (var styleName in style) {
                if (!hasOwnProperty.call(style, styleName)) {
                  continue;
                }
                var styleValue = style[styleName];
                if (styleValue == null || typeof styleValue === "boolean" || styleValue === "") {
                  continue;
                }
                var nameChunk = void 0;
                var valueChunk = void 0;
                var isCustomProperty = styleName.indexOf("--") === 0;
                if (isCustomProperty) {
                  nameChunk = stringToChunk(escapeTextForBrowser(styleName));
                  {
                    checkCSSPropertyStringCoercion(styleValue, styleName);
                  }
                  valueChunk = stringToChunk(escapeTextForBrowser(("" + styleValue).trim()));
                } else {
                  {
                    warnValidStyle$1(styleName, styleValue);
                  }
                  nameChunk = processStyleName(styleName);
                  if (typeof styleValue === "number") {
                    if (styleValue !== 0 && !hasOwnProperty.call(isUnitlessNumber, styleName)) {
                      valueChunk = stringToChunk(styleValue + "px");
                    } else {
                      valueChunk = stringToChunk("" + styleValue);
                    }
                  } else {
                    {
                      checkCSSPropertyStringCoercion(styleValue, styleName);
                    }
                    valueChunk = stringToChunk(escapeTextForBrowser(("" + styleValue).trim()));
                  }
                }
                if (isFirst) {
                  isFirst = false;
                  target.push(styleAttributeStart, nameChunk, styleAssign, valueChunk);
                } else {
                  target.push(styleSeparator, nameChunk, styleAssign, valueChunk);
                }
              }
              if (!isFirst) {
                target.push(attributeEnd);
              }
            }
            var attributeSeparator = stringToPrecomputedChunk(" ");
            var attributeAssign = stringToPrecomputedChunk('="');
            var attributeEnd = stringToPrecomputedChunk('"');
            var attributeEmptyString = stringToPrecomputedChunk('=""');
            function pushAttribute(target, responseState, name, value) {
              switch (name) {
                case "style": {
                  pushStyle(target, responseState, value);
                  return;
                }
                case "defaultValue":
                case "defaultChecked":
                case "innerHTML":
                case "suppressContentEditableWarning":
                case "suppressHydrationWarning":
                  return;
              }
              if (
                // shouldIgnoreAttribute
                // We have already filtered out null/undefined and reserved words.
                name.length > 2 && (name[0] === "o" || name[0] === "O") && (name[1] === "n" || name[1] === "N")
              ) {
                return;
              }
              var propertyInfo = getPropertyInfo(name);
              if (propertyInfo !== null) {
                switch (typeof value) {
                  case "function":
                  case "symbol":
                    return;
                  case "boolean": {
                    if (!propertyInfo.acceptsBooleans) {
                      return;
                    }
                  }
                }
                var attributeName = propertyInfo.attributeName;
                var attributeNameChunk = stringToChunk(attributeName);
                switch (propertyInfo.type) {
                  case BOOLEAN:
                    if (value) {
                      target.push(attributeSeparator, attributeNameChunk, attributeEmptyString);
                    }
                    return;
                  case OVERLOADED_BOOLEAN:
                    if (value === true) {
                      target.push(attributeSeparator, attributeNameChunk, attributeEmptyString);
                    } else if (value === false)
                      ;
                    else {
                      target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                    }
                    return;
                  case NUMERIC:
                    if (!isNaN(value)) {
                      target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                    }
                    break;
                  case POSITIVE_NUMERIC:
                    if (!isNaN(value) && value >= 1) {
                      target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                    }
                    break;
                  default:
                    if (propertyInfo.sanitizeURL) {
                      {
                        checkAttributeStringCoercion(value, attributeName);
                      }
                      value = "" + value;
                      sanitizeURL(value);
                    }
                    target.push(attributeSeparator, attributeNameChunk, attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
                }
              } else if (isAttributeNameSafe(name)) {
                switch (typeof value) {
                  case "function":
                  case "symbol":
                    return;
                  case "boolean": {
                    var prefix2 = name.toLowerCase().slice(0, 5);
                    if (prefix2 !== "data-" && prefix2 !== "aria-") {
                      return;
                    }
                  }
                }
                target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
              }
            }
            var endOfStartTag = stringToPrecomputedChunk(">");
            var endOfStartTagSelfClosing = stringToPrecomputedChunk("/>");
            function pushInnerHTML(target, innerHTML, children) {
              if (innerHTML != null) {
                if (children != null) {
                  throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
                }
                if (typeof innerHTML !== "object" || !("__html" in innerHTML)) {
                  throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.");
                }
                var html = innerHTML.__html;
                if (html !== null && html !== void 0) {
                  {
                    checkHtmlStringCoercion(html);
                  }
                  target.push(stringToChunk("" + html));
                }
              }
            }
            var didWarnDefaultInputValue = false;
            var didWarnDefaultChecked = false;
            var didWarnDefaultSelectValue = false;
            var didWarnDefaultTextareaValue = false;
            var didWarnInvalidOptionChildren = false;
            var didWarnInvalidOptionInnerHTML = false;
            var didWarnSelectedSetOnOption = false;
            function checkSelectProp(props, propName) {
              {
                var value = props[propName];
                if (value != null) {
                  var array = isArray(value);
                  if (props.multiple && !array) {
                    error("The `%s` prop supplied to <select> must be an array if `multiple` is true.", propName);
                  } else if (!props.multiple && array) {
                    error("The `%s` prop supplied to <select> must be a scalar value if `multiple` is false.", propName);
                  }
                }
              }
            }
            function pushStartSelect(target, props, responseState) {
              {
                checkControlledValueProps("select", props);
                checkSelectProp(props, "value");
                checkSelectProp(props, "defaultValue");
                if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnDefaultSelectValue) {
                  error("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://reactjs.org/link/controlled-components");
                  didWarnDefaultSelectValue = true;
                }
              }
              target.push(startChunkForTag("select"));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    case "defaultValue":
                    case "value":
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              return children;
            }
            function flattenOptionChildren(children) {
              var content = "";
              React3.Children.forEach(children, function(child) {
                if (child == null) {
                  return;
                }
                content += child;
                {
                  if (!didWarnInvalidOptionChildren && typeof child !== "string" && typeof child !== "number") {
                    didWarnInvalidOptionChildren = true;
                    error("Cannot infer the option value of complex children. Pass a `value` prop or use a plain string as children to <option>.");
                  }
                }
              });
              return content;
            }
            var selectedMarkerAttribute = stringToPrecomputedChunk(' selected=""');
            function pushStartOption(target, props, responseState, formatContext) {
              var selectedValue = formatContext.selectedValue;
              target.push(startChunkForTag("option"));
              var children = null;
              var value = null;
              var selected = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "selected":
                      selected = propValue;
                      {
                        if (!didWarnSelectedSetOnOption) {
                          error("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>.");
                          didWarnSelectedSetOnOption = true;
                        }
                      }
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    case "value":
                      value = propValue;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              if (selectedValue != null) {
                var stringValue;
                if (value !== null) {
                  {
                    checkAttributeStringCoercion(value, "value");
                  }
                  stringValue = "" + value;
                } else {
                  {
                    if (innerHTML !== null) {
                      if (!didWarnInvalidOptionInnerHTML) {
                        didWarnInvalidOptionInnerHTML = true;
                        error("Pass a `value` prop if you set dangerouslyInnerHTML so React knows which value should be selected.");
                      }
                    }
                  }
                  stringValue = flattenOptionChildren(children);
                }
                if (isArray(selectedValue)) {
                  for (var i = 0; i < selectedValue.length; i++) {
                    {
                      checkAttributeStringCoercion(selectedValue[i], "value");
                    }
                    var v = "" + selectedValue[i];
                    if (v === stringValue) {
                      target.push(selectedMarkerAttribute);
                      break;
                    }
                  }
                } else {
                  {
                    checkAttributeStringCoercion(selectedValue, "select.value");
                  }
                  if ("" + selectedValue === stringValue) {
                    target.push(selectedMarkerAttribute);
                  }
                }
              } else if (selected) {
                target.push(selectedMarkerAttribute);
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              return children;
            }
            function pushInput(target, props, responseState) {
              {
                checkControlledValueProps("input", props);
                if (props.checked !== void 0 && props.defaultChecked !== void 0 && !didWarnDefaultChecked) {
                  error("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://reactjs.org/link/controlled-components", "A component", props.type);
                  didWarnDefaultChecked = true;
                }
                if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnDefaultInputValue) {
                  error("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://reactjs.org/link/controlled-components", "A component", props.type);
                  didWarnDefaultInputValue = true;
                }
              }
              target.push(startChunkForTag("input"));
              var value = null;
              var defaultValue = null;
              var checked = null;
              var defaultChecked = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw new Error("input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
                    case "defaultChecked":
                      defaultChecked = propValue;
                      break;
                    case "defaultValue":
                      defaultValue = propValue;
                      break;
                    case "checked":
                      checked = propValue;
                      break;
                    case "value":
                      value = propValue;
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              if (checked !== null) {
                pushAttribute(target, responseState, "checked", checked);
              } else if (defaultChecked !== null) {
                pushAttribute(target, responseState, "checked", defaultChecked);
              }
              if (value !== null) {
                pushAttribute(target, responseState, "value", value);
              } else if (defaultValue !== null) {
                pushAttribute(target, responseState, "value", defaultValue);
              }
              target.push(endOfStartTagSelfClosing);
              return null;
            }
            function pushStartTextArea(target, props, responseState) {
              {
                checkControlledValueProps("textarea", props);
                if (props.value !== void 0 && props.defaultValue !== void 0 && !didWarnDefaultTextareaValue) {
                  error("Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://reactjs.org/link/controlled-components");
                  didWarnDefaultTextareaValue = true;
                }
              }
              target.push(startChunkForTag("textarea"));
              var value = null;
              var defaultValue = null;
              var children = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "value":
                      value = propValue;
                      break;
                    case "defaultValue":
                      defaultValue = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      throw new Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              if (value === null && defaultValue !== null) {
                value = defaultValue;
              }
              target.push(endOfStartTag);
              if (children != null) {
                {
                  error("Use the `defaultValue` or `value` props instead of setting children on <textarea>.");
                }
                if (value != null) {
                  throw new Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
                }
                if (isArray(children)) {
                  if (children.length > 1) {
                    throw new Error("<textarea> can only have at most one child.");
                  }
                  {
                    checkHtmlStringCoercion(children[0]);
                  }
                  value = "" + children[0];
                }
                {
                  checkHtmlStringCoercion(children);
                }
                value = "" + children;
              }
              if (typeof value === "string" && value[0] === "\n") {
                target.push(leadingNewline);
              }
              if (value !== null) {
                {
                  checkAttributeStringCoercion(value, "value");
                }
                target.push(stringToChunk(encodeHTMLTextNode("" + value)));
              }
              return null;
            }
            function pushSelfClosing(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw new Error(tag + " is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTagSelfClosing);
              return null;
            }
            function pushStartMenuItem(target, props, responseState) {
              target.push(startChunkForTag("menuitem"));
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw new Error("menuitems cannot have `children` nor `dangerouslySetInnerHTML`.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              return null;
            }
            function pushStartTitle(target, props, responseState) {
              target.push(startChunkForTag("title"));
              var children = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      throw new Error("`dangerouslySetInnerHTML` does not make sense on <title>.");
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              {
                var child = Array.isArray(children) && children.length < 2 ? children[0] || null : children;
                if (Array.isArray(children) && children.length > 1) {
                  error("A title element received an array with more than 1 element as children. In browsers title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering");
                } else if (child != null && child.$$typeof != null) {
                  error("A title element received a React element for children. In the browser title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering");
                } else if (child != null && typeof child !== "string" && typeof child !== "number") {
                  error("A title element received a value that was not a string or number for children. In the browser title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering");
                }
              }
              return children;
            }
            function pushStartGenericElement(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              if (typeof children === "string") {
                target.push(stringToChunk(encodeHTMLTextNode(children)));
                return null;
              }
              return children;
            }
            function pushStartCustomElement(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    case "style":
                      pushStyle(target, responseState, propValue);
                      break;
                    case "suppressContentEditableWarning":
                    case "suppressHydrationWarning":
                      break;
                    default:
                      if (isAttributeNameSafe(propKey) && typeof propValue !== "function" && typeof propValue !== "symbol") {
                        target.push(attributeSeparator, stringToChunk(propKey), attributeAssign, stringToChunk(escapeTextForBrowser(propValue)), attributeEnd);
                      }
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              pushInnerHTML(target, innerHTML, children);
              return children;
            }
            var leadingNewline = stringToPrecomputedChunk("\n");
            function pushStartPreformattedElement(target, props, tag, responseState) {
              target.push(startChunkForTag(tag));
              var children = null;
              var innerHTML = null;
              for (var propKey in props) {
                if (hasOwnProperty.call(props, propKey)) {
                  var propValue = props[propKey];
                  if (propValue == null) {
                    continue;
                  }
                  switch (propKey) {
                    case "children":
                      children = propValue;
                      break;
                    case "dangerouslySetInnerHTML":
                      innerHTML = propValue;
                      break;
                    default:
                      pushAttribute(target, responseState, propKey, propValue);
                      break;
                  }
                }
              }
              target.push(endOfStartTag);
              if (innerHTML != null) {
                if (children != null) {
                  throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
                }
                if (typeof innerHTML !== "object" || !("__html" in innerHTML)) {
                  throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.");
                }
                var html = innerHTML.__html;
                if (html !== null && html !== void 0) {
                  if (typeof html === "string" && html.length > 0 && html[0] === "\n") {
                    target.push(leadingNewline, stringToChunk(html));
                  } else {
                    {
                      checkHtmlStringCoercion(html);
                    }
                    target.push(stringToChunk("" + html));
                  }
                }
              }
              if (typeof children === "string" && children[0] === "\n") {
                target.push(leadingNewline);
              }
              return children;
            }
            var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/;
            var validatedTagCache = /* @__PURE__ */ new Map();
            function startChunkForTag(tag) {
              var tagStartChunk = validatedTagCache.get(tag);
              if (tagStartChunk === void 0) {
                if (!VALID_TAG_REGEX.test(tag)) {
                  throw new Error("Invalid tag: " + tag);
                }
                tagStartChunk = stringToPrecomputedChunk("<" + tag);
                validatedTagCache.set(tag, tagStartChunk);
              }
              return tagStartChunk;
            }
            var DOCTYPE = stringToPrecomputedChunk("<!DOCTYPE html>");
            function pushStartInstance(target, type, props, responseState, formatContext) {
              {
                validateProperties(type, props);
                validateProperties$1(type, props);
                validateProperties$2(type, props, null);
                if (!props.suppressContentEditableWarning && props.contentEditable && props.children != null) {
                  error("A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional.");
                }
                if (formatContext.insertionMode !== SVG_MODE && formatContext.insertionMode !== MATHML_MODE) {
                  if (type.indexOf("-") === -1 && typeof props.is !== "string" && type.toLowerCase() !== type) {
                    error("<%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.", type);
                  }
                }
              }
              switch (type) {
                case "select":
                  return pushStartSelect(target, props, responseState);
                case "option":
                  return pushStartOption(target, props, responseState, formatContext);
                case "textarea":
                  return pushStartTextArea(target, props, responseState);
                case "input":
                  return pushInput(target, props, responseState);
                case "menuitem":
                  return pushStartMenuItem(target, props, responseState);
                case "title":
                  return pushStartTitle(target, props, responseState);
                case "listing":
                case "pre": {
                  return pushStartPreformattedElement(target, props, type, responseState);
                }
                case "area":
                case "base":
                case "br":
                case "col":
                case "embed":
                case "hr":
                case "img":
                case "keygen":
                case "link":
                case "meta":
                case "param":
                case "source":
                case "track":
                case "wbr": {
                  return pushSelfClosing(target, props, type, responseState);
                }
                case "annotation-xml":
                case "color-profile":
                case "font-face":
                case "font-face-src":
                case "font-face-uri":
                case "font-face-format":
                case "font-face-name":
                case "missing-glyph": {
                  return pushStartGenericElement(target, props, type, responseState);
                }
                case "html": {
                  if (formatContext.insertionMode === ROOT_HTML_MODE) {
                    target.push(DOCTYPE);
                  }
                  return pushStartGenericElement(target, props, type, responseState);
                }
                default: {
                  if (type.indexOf("-") === -1 && typeof props.is !== "string") {
                    return pushStartGenericElement(target, props, type, responseState);
                  } else {
                    return pushStartCustomElement(target, props, type, responseState);
                  }
                }
              }
            }
            var endTag1 = stringToPrecomputedChunk("</");
            var endTag2 = stringToPrecomputedChunk(">");
            function pushEndInstance(target, type, props) {
              switch (type) {
                case "area":
                case "base":
                case "br":
                case "col":
                case "embed":
                case "hr":
                case "img":
                case "input":
                case "keygen":
                case "link":
                case "meta":
                case "param":
                case "source":
                case "track":
                case "wbr": {
                  break;
                }
                default: {
                  target.push(endTag1, stringToChunk(type), endTag2);
                }
              }
            }
            function writeCompletedRoot(destination, responseState) {
              var bootstrapChunks = responseState.bootstrapChunks;
              var i = 0;
              for (; i < bootstrapChunks.length - 1; i++) {
                writeChunk(destination, bootstrapChunks[i]);
              }
              if (i < bootstrapChunks.length) {
                return writeChunkAndReturn(destination, bootstrapChunks[i]);
              }
              return true;
            }
            var placeholder1 = stringToPrecomputedChunk('<template id="');
            var placeholder2 = stringToPrecomputedChunk('"></template>');
            function writePlaceholder(destination, responseState, id) {
              writeChunk(destination, placeholder1);
              writeChunk(destination, responseState.placeholderPrefix);
              var formattedID = stringToChunk(id.toString(16));
              writeChunk(destination, formattedID);
              return writeChunkAndReturn(destination, placeholder2);
            }
            var startCompletedSuspenseBoundary = stringToPrecomputedChunk("<!--$-->");
            var startPendingSuspenseBoundary1 = stringToPrecomputedChunk('<!--$?--><template id="');
            var startPendingSuspenseBoundary2 = stringToPrecomputedChunk('"></template>');
            var startClientRenderedSuspenseBoundary = stringToPrecomputedChunk("<!--$!-->");
            var endSuspenseBoundary = stringToPrecomputedChunk("<!--/$-->");
            var clientRenderedSuspenseBoundaryError1 = stringToPrecomputedChunk("<template");
            var clientRenderedSuspenseBoundaryErrorAttrInterstitial = stringToPrecomputedChunk('"');
            var clientRenderedSuspenseBoundaryError1A = stringToPrecomputedChunk(' data-dgst="');
            var clientRenderedSuspenseBoundaryError1B = stringToPrecomputedChunk(' data-msg="');
            var clientRenderedSuspenseBoundaryError1C = stringToPrecomputedChunk(' data-stck="');
            var clientRenderedSuspenseBoundaryError2 = stringToPrecomputedChunk("></template>");
            function writeStartCompletedSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
            }
            function writeStartPendingSuspenseBoundary(destination, responseState, id) {
              writeChunk(destination, startPendingSuspenseBoundary1);
              if (id === null) {
                throw new Error("An ID must have been assigned before we can complete the boundary.");
              }
              writeChunk(destination, id);
              return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
            }
            function writeStartClientRenderedSuspenseBoundary(destination, responseState, errorDigest, errorMesssage, errorComponentStack) {
              var result;
              result = writeChunkAndReturn(destination, startClientRenderedSuspenseBoundary);
              writeChunk(destination, clientRenderedSuspenseBoundaryError1);
              if (errorDigest) {
                writeChunk(destination, clientRenderedSuspenseBoundaryError1A);
                writeChunk(destination, stringToChunk(escapeTextForBrowser(errorDigest)));
                writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
              }
              {
                if (errorMesssage) {
                  writeChunk(destination, clientRenderedSuspenseBoundaryError1B);
                  writeChunk(destination, stringToChunk(escapeTextForBrowser(errorMesssage)));
                  writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
                }
                if (errorComponentStack) {
                  writeChunk(destination, clientRenderedSuspenseBoundaryError1C);
                  writeChunk(destination, stringToChunk(escapeTextForBrowser(errorComponentStack)));
                  writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
                }
              }
              result = writeChunkAndReturn(destination, clientRenderedSuspenseBoundaryError2);
              return result;
            }
            function writeEndCompletedSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, endSuspenseBoundary);
            }
            function writeEndPendingSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, endSuspenseBoundary);
            }
            function writeEndClientRenderedSuspenseBoundary(destination, responseState) {
              return writeChunkAndReturn(destination, endSuspenseBoundary);
            }
            var startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
            var startSegmentHTML2 = stringToPrecomputedChunk('">');
            var endSegmentHTML = stringToPrecomputedChunk("</div>");
            var startSegmentSVG = stringToPrecomputedChunk('<svg aria-hidden="true" style="display:none" id="');
            var startSegmentSVG2 = stringToPrecomputedChunk('">');
            var endSegmentSVG = stringToPrecomputedChunk("</svg>");
            var startSegmentMathML = stringToPrecomputedChunk('<math aria-hidden="true" style="display:none" id="');
            var startSegmentMathML2 = stringToPrecomputedChunk('">');
            var endSegmentMathML = stringToPrecomputedChunk("</math>");
            var startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
            var startSegmentTable2 = stringToPrecomputedChunk('">');
            var endSegmentTable = stringToPrecomputedChunk("</table>");
            var startSegmentTableBody = stringToPrecomputedChunk('<table hidden><tbody id="');
            var startSegmentTableBody2 = stringToPrecomputedChunk('">');
            var endSegmentTableBody = stringToPrecomputedChunk("</tbody></table>");
            var startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
            var startSegmentTableRow2 = stringToPrecomputedChunk('">');
            var endSegmentTableRow = stringToPrecomputedChunk("</tr></table>");
            var startSegmentColGroup = stringToPrecomputedChunk('<table hidden><colgroup id="');
            var startSegmentColGroup2 = stringToPrecomputedChunk('">');
            var endSegmentColGroup = stringToPrecomputedChunk("</colgroup></table>");
            function writeStartSegment(destination, responseState, formatContext, id) {
              switch (formatContext.insertionMode) {
                case ROOT_HTML_MODE:
                case HTML_MODE: {
                  writeChunk(destination, startSegmentHTML);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentHTML2);
                }
                case SVG_MODE: {
                  writeChunk(destination, startSegmentSVG);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentSVG2);
                }
                case MATHML_MODE: {
                  writeChunk(destination, startSegmentMathML);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentMathML2);
                }
                case HTML_TABLE_MODE: {
                  writeChunk(destination, startSegmentTable);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentTable2);
                }
                case HTML_TABLE_BODY_MODE: {
                  writeChunk(destination, startSegmentTableBody);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentTableBody2);
                }
                case HTML_TABLE_ROW_MODE: {
                  writeChunk(destination, startSegmentTableRow);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentTableRow2);
                }
                case HTML_COLGROUP_MODE: {
                  writeChunk(destination, startSegmentColGroup);
                  writeChunk(destination, responseState.segmentPrefix);
                  writeChunk(destination, stringToChunk(id.toString(16)));
                  return writeChunkAndReturn(destination, startSegmentColGroup2);
                }
                default: {
                  throw new Error("Unknown insertion mode. This is a bug in React.");
                }
              }
            }
            function writeEndSegment(destination, formatContext) {
              switch (formatContext.insertionMode) {
                case ROOT_HTML_MODE:
                case HTML_MODE: {
                  return writeChunkAndReturn(destination, endSegmentHTML);
                }
                case SVG_MODE: {
                  return writeChunkAndReturn(destination, endSegmentSVG);
                }
                case MATHML_MODE: {
                  return writeChunkAndReturn(destination, endSegmentMathML);
                }
                case HTML_TABLE_MODE: {
                  return writeChunkAndReturn(destination, endSegmentTable);
                }
                case HTML_TABLE_BODY_MODE: {
                  return writeChunkAndReturn(destination, endSegmentTableBody);
                }
                case HTML_TABLE_ROW_MODE: {
                  return writeChunkAndReturn(destination, endSegmentTableRow);
                }
                case HTML_COLGROUP_MODE: {
                  return writeChunkAndReturn(destination, endSegmentColGroup);
                }
                default: {
                  throw new Error("Unknown insertion mode. This is a bug in React.");
                }
              }
            }
            var completeSegmentFunction = "function $RS(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)}";
            var completeBoundaryFunction = 'function $RC(a,b){a=document.getElementById(a);b=document.getElementById(b);b.parentNode.removeChild(b);if(a){a=a.previousSibling;var f=a.parentNode,c=a.nextSibling,e=0;do{if(c&&8===c.nodeType){var d=c.data;if("/$"===d)if(0===e)break;else e--;else"$"!==d&&"$?"!==d&&"$!"!==d||e++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;b.firstChild;)f.insertBefore(b.firstChild,c);a.data="$";a._reactRetry&&a._reactRetry()}}';
            var clientRenderFunction = 'function $RX(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())}';
            var completeSegmentScript1Full = stringToPrecomputedChunk(completeSegmentFunction + ';$RS("');
            var completeSegmentScript1Partial = stringToPrecomputedChunk('$RS("');
            var completeSegmentScript2 = stringToPrecomputedChunk('","');
            var completeSegmentScript3 = stringToPrecomputedChunk('")<\/script>');
            function writeCompletedSegmentInstruction(destination, responseState, contentSegmentID) {
              writeChunk(destination, responseState.startInlineScript);
              if (!responseState.sentCompleteSegmentFunction) {
                responseState.sentCompleteSegmentFunction = true;
                writeChunk(destination, completeSegmentScript1Full);
              } else {
                writeChunk(destination, completeSegmentScript1Partial);
              }
              writeChunk(destination, responseState.segmentPrefix);
              var formattedID = stringToChunk(contentSegmentID.toString(16));
              writeChunk(destination, formattedID);
              writeChunk(destination, completeSegmentScript2);
              writeChunk(destination, responseState.placeholderPrefix);
              writeChunk(destination, formattedID);
              return writeChunkAndReturn(destination, completeSegmentScript3);
            }
            var completeBoundaryScript1Full = stringToPrecomputedChunk(completeBoundaryFunction + ';$RC("');
            var completeBoundaryScript1Partial = stringToPrecomputedChunk('$RC("');
            var completeBoundaryScript2 = stringToPrecomputedChunk('","');
            var completeBoundaryScript3 = stringToPrecomputedChunk('")<\/script>');
            function writeCompletedBoundaryInstruction(destination, responseState, boundaryID, contentSegmentID) {
              writeChunk(destination, responseState.startInlineScript);
              if (!responseState.sentCompleteBoundaryFunction) {
                responseState.sentCompleteBoundaryFunction = true;
                writeChunk(destination, completeBoundaryScript1Full);
              } else {
                writeChunk(destination, completeBoundaryScript1Partial);
              }
              if (boundaryID === null) {
                throw new Error("An ID must have been assigned before we can complete the boundary.");
              }
              var formattedContentID = stringToChunk(contentSegmentID.toString(16));
              writeChunk(destination, boundaryID);
              writeChunk(destination, completeBoundaryScript2);
              writeChunk(destination, responseState.segmentPrefix);
              writeChunk(destination, formattedContentID);
              return writeChunkAndReturn(destination, completeBoundaryScript3);
            }
            var clientRenderScript1Full = stringToPrecomputedChunk(clientRenderFunction + ';$RX("');
            var clientRenderScript1Partial = stringToPrecomputedChunk('$RX("');
            var clientRenderScript1A = stringToPrecomputedChunk('"');
            var clientRenderScript2 = stringToPrecomputedChunk(")<\/script>");
            var clientRenderErrorScriptArgInterstitial = stringToPrecomputedChunk(",");
            function writeClientRenderBoundaryInstruction(destination, responseState, boundaryID, errorDigest, errorMessage, errorComponentStack) {
              writeChunk(destination, responseState.startInlineScript);
              if (!responseState.sentClientRenderFunction) {
                responseState.sentClientRenderFunction = true;
                writeChunk(destination, clientRenderScript1Full);
              } else {
                writeChunk(destination, clientRenderScript1Partial);
              }
              if (boundaryID === null) {
                throw new Error("An ID must have been assigned before we can complete the boundary.");
              }
              writeChunk(destination, boundaryID);
              writeChunk(destination, clientRenderScript1A);
              if (errorDigest || errorMessage || errorComponentStack) {
                writeChunk(destination, clientRenderErrorScriptArgInterstitial);
                writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorDigest || "")));
              }
              if (errorMessage || errorComponentStack) {
                writeChunk(destination, clientRenderErrorScriptArgInterstitial);
                writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorMessage || "")));
              }
              if (errorComponentStack) {
                writeChunk(destination, clientRenderErrorScriptArgInterstitial);
                writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorComponentStack)));
              }
              return writeChunkAndReturn(destination, clientRenderScript2);
            }
            var regexForJSStringsInScripts = /[<\u2028\u2029]/g;
            function escapeJSStringsForInstructionScripts(input) {
              var escaped = JSON.stringify(input);
              return escaped.replace(regexForJSStringsInScripts, function(match) {
                switch (match) {
                  case "<":
                    return "\\u003c";
                  case "\u2028":
                    return "\\u2028";
                  case "\u2029":
                    return "\\u2029";
                  default: {
                    throw new Error("escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
                  }
                }
              });
            }
            var assign = Object.assign;
            var REACT_ELEMENT_TYPE = Symbol.for("react.element");
            var REACT_PORTAL_TYPE = Symbol.for("react.portal");
            var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
            var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
            var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
            var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
            var REACT_CONTEXT_TYPE = Symbol.for("react.context");
            var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
            var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
            var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
            var REACT_MEMO_TYPE = Symbol.for("react.memo");
            var REACT_LAZY_TYPE = Symbol.for("react.lazy");
            var REACT_SCOPE_TYPE = Symbol.for("react.scope");
            var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
            var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
            var REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for("react.default_value");
            var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
            var FAUX_ITERATOR_SYMBOL = "@@iterator";
            function getIteratorFn(maybeIterable) {
              if (maybeIterable === null || typeof maybeIterable !== "object") {
                return null;
              }
              var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
              if (typeof maybeIterator === "function") {
                return maybeIterator;
              }
              return null;
            }
            function getWrappedName(outerType, innerType, wrapperName) {
              var displayName = outerType.displayName;
              if (displayName) {
                return displayName;
              }
              var functionName = innerType.displayName || innerType.name || "";
              return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
            }
            function getContextName(type) {
              return type.displayName || "Context";
            }
            function getComponentNameFromType(type) {
              if (type == null) {
                return null;
              }
              {
                if (typeof type.tag === "number") {
                  error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
                }
              }
              if (typeof type === "function") {
                return type.displayName || type.name || null;
              }
              if (typeof type === "string") {
                return type;
              }
              switch (type) {
                case REACT_FRAGMENT_TYPE:
                  return "Fragment";
                case REACT_PORTAL_TYPE:
                  return "Portal";
                case REACT_PROFILER_TYPE:
                  return "Profiler";
                case REACT_STRICT_MODE_TYPE:
                  return "StrictMode";
                case REACT_SUSPENSE_TYPE:
                  return "Suspense";
                case REACT_SUSPENSE_LIST_TYPE:
                  return "SuspenseList";
              }
              if (typeof type === "object") {
                switch (type.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    var context = type;
                    return getContextName(context) + ".Consumer";
                  case REACT_PROVIDER_TYPE:
                    var provider = type;
                    return getContextName(provider._context) + ".Provider";
                  case REACT_FORWARD_REF_TYPE:
                    return getWrappedName(type, type.render, "ForwardRef");
                  case REACT_MEMO_TYPE:
                    var outerName = type.displayName || null;
                    if (outerName !== null) {
                      return outerName;
                    }
                    return getComponentNameFromType(type.type) || "Memo";
                  case REACT_LAZY_TYPE: {
                    var lazyComponent = type;
                    var payload = lazyComponent._payload;
                    var init = lazyComponent._init;
                    try {
                      return getComponentNameFromType(init(payload));
                    } catch (x) {
                      return null;
                    }
                  }
                }
              }
              return null;
            }
            var disabledDepth = 0;
            var prevLog;
            var prevInfo;
            var prevWarn;
            var prevError;
            var prevGroup;
            var prevGroupCollapsed;
            var prevGroupEnd;
            function disabledLog() {
            }
            disabledLog.__reactDisabledLog = true;
            function disableLogs() {
              {
                if (disabledDepth === 0) {
                  prevLog = console.log;
                  prevInfo = console.info;
                  prevWarn = console.warn;
                  prevError = console.error;
                  prevGroup = console.group;
                  prevGroupCollapsed = console.groupCollapsed;
                  prevGroupEnd = console.groupEnd;
                  var props = {
                    configurable: true,
                    enumerable: true,
                    value: disabledLog,
                    writable: true
                  };
                  Object.defineProperties(console, {
                    info: props,
                    log: props,
                    warn: props,
                    error: props,
                    group: props,
                    groupCollapsed: props,
                    groupEnd: props
                  });
                }
                disabledDepth++;
              }
            }
            function reenableLogs() {
              {
                disabledDepth--;
                if (disabledDepth === 0) {
                  var props = {
                    configurable: true,
                    enumerable: true,
                    writable: true
                  };
                  Object.defineProperties(console, {
                    log: assign({}, props, {
                      value: prevLog
                    }),
                    info: assign({}, props, {
                      value: prevInfo
                    }),
                    warn: assign({}, props, {
                      value: prevWarn
                    }),
                    error: assign({}, props, {
                      value: prevError
                    }),
                    group: assign({}, props, {
                      value: prevGroup
                    }),
                    groupCollapsed: assign({}, props, {
                      value: prevGroupCollapsed
                    }),
                    groupEnd: assign({}, props, {
                      value: prevGroupEnd
                    })
                  });
                }
                if (disabledDepth < 0) {
                  error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
                }
              }
            }
            var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
            var prefix;
            function describeBuiltInComponentFrame(name, source, ownerFn) {
              {
                if (prefix === void 0) {
                  try {
                    throw Error();
                  } catch (x) {
                    var match = x.stack.trim().match(/\n( *(at )?)/);
                    prefix = match && match[1] || "";
                  }
                }
                return "\n" + prefix + name;
              }
            }
            var reentry = false;
            var componentFrameCache;
            {
              var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
              componentFrameCache = new PossiblyWeakMap();
            }
            function describeNativeComponentFrame(fn, construct) {
              if (!fn || reentry) {
                return "";
              }
              {
                var frame = componentFrameCache.get(fn);
                if (frame !== void 0) {
                  return frame;
                }
              }
              var control;
              reentry = true;
              var previousPrepareStackTrace = Error.prepareStackTrace;
              Error.prepareStackTrace = void 0;
              var previousDispatcher;
              {
                previousDispatcher = ReactCurrentDispatcher.current;
                ReactCurrentDispatcher.current = null;
                disableLogs();
              }
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  });
                  if (typeof Reflect === "object" && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x) {
                      control = x;
                    }
                    fn.call(Fake.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x) {
                    control = x;
                  }
                  fn();
                }
              } catch (sample) {
                if (sample && control && typeof sample.stack === "string") {
                  var sampleLines = sample.stack.split("\n");
                  var controlLines = control.stack.split("\n");
                  var s = sampleLines.length - 1;
                  var c = controlLines.length - 1;
                  while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                    c--;
                  }
                  for (; s >= 1 && c >= 0; s--, c--) {
                    if (sampleLines[s] !== controlLines[c]) {
                      if (s !== 1 || c !== 1) {
                        do {
                          s--;
                          c--;
                          if (c < 0 || sampleLines[s] !== controlLines[c]) {
                            var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                            if (fn.displayName && _frame.includes("<anonymous>")) {
                              _frame = _frame.replace("<anonymous>", fn.displayName);
                            }
                            {
                              if (typeof fn === "function") {
                                componentFrameCache.set(fn, _frame);
                              }
                            }
                            return _frame;
                          }
                        } while (s >= 1 && c >= 0);
                      }
                      break;
                    }
                  }
                }
              } finally {
                reentry = false;
                {
                  ReactCurrentDispatcher.current = previousDispatcher;
                  reenableLogs();
                }
                Error.prepareStackTrace = previousPrepareStackTrace;
              }
              var name = fn ? fn.displayName || fn.name : "";
              var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
              {
                if (typeof fn === "function") {
                  componentFrameCache.set(fn, syntheticFrame);
                }
              }
              return syntheticFrame;
            }
            function describeClassComponentFrame(ctor, source, ownerFn) {
              {
                return describeNativeComponentFrame(ctor, true);
              }
            }
            function describeFunctionComponentFrame(fn, source, ownerFn) {
              {
                return describeNativeComponentFrame(fn, false);
              }
            }
            function shouldConstruct(Component) {
              var prototype = Component.prototype;
              return !!(prototype && prototype.isReactComponent);
            }
            function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
              if (type == null) {
                return "";
              }
              if (typeof type === "function") {
                {
                  return describeNativeComponentFrame(type, shouldConstruct(type));
                }
              }
              if (typeof type === "string") {
                return describeBuiltInComponentFrame(type);
              }
              switch (type) {
                case REACT_SUSPENSE_TYPE:
                  return describeBuiltInComponentFrame("Suspense");
                case REACT_SUSPENSE_LIST_TYPE:
                  return describeBuiltInComponentFrame("SuspenseList");
              }
              if (typeof type === "object") {
                switch (type.$$typeof) {
                  case REACT_FORWARD_REF_TYPE:
                    return describeFunctionComponentFrame(type.render);
                  case REACT_MEMO_TYPE:
                    return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
                  case REACT_LAZY_TYPE: {
                    var lazyComponent = type;
                    var payload = lazyComponent._payload;
                    var init = lazyComponent._init;
                    try {
                      return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                    } catch (x) {
                    }
                  }
                }
              }
              return "";
            }
            var loggedTypeFailures = {};
            var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
            function setCurrentlyValidatingElement(element) {
              {
                if (element) {
                  var owner = element._owner;
                  var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                  ReactDebugCurrentFrame.setExtraStackFrame(stack);
                } else {
                  ReactDebugCurrentFrame.setExtraStackFrame(null);
                }
              }
            }
            function checkPropTypes(typeSpecs, values, location, componentName, element) {
              {
                var has = Function.call.bind(hasOwnProperty);
                for (var typeSpecName in typeSpecs) {
                  if (has(typeSpecs, typeSpecName)) {
                    var error$1 = void 0;
                    try {
                      if (typeof typeSpecs[typeSpecName] !== "function") {
                        var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                        err.name = "Invariant Violation";
                        throw err;
                      }
                      error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                    } catch (ex) {
                      error$1 = ex;
                    }
                    if (error$1 && !(error$1 instanceof Error)) {
                      setCurrentlyValidatingElement(element);
                      error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                      setCurrentlyValidatingElement(null);
                    }
                    if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                      loggedTypeFailures[error$1.message] = true;
                      setCurrentlyValidatingElement(element);
                      error("Failed %s type: %s", location, error$1.message);
                      setCurrentlyValidatingElement(null);
                    }
                  }
                }
              }
            }
            var warnedAboutMissingGetChildContext;
            {
              warnedAboutMissingGetChildContext = {};
            }
            var emptyContextObject = {};
            {
              Object.freeze(emptyContextObject);
            }
            function getMaskedContext(type, unmaskedContext) {
              {
                var contextTypes = type.contextTypes;
                if (!contextTypes) {
                  return emptyContextObject;
                }
                var context = {};
                for (var key in contextTypes) {
                  context[key] = unmaskedContext[key];
                }
                {
                  var name = getComponentNameFromType(type) || "Unknown";
                  checkPropTypes(contextTypes, context, "context", name);
                }
                return context;
              }
            }
            function processChildContext(instance, type, parentContext, childContextTypes) {
              {
                if (typeof instance.getChildContext !== "function") {
                  {
                    var componentName = getComponentNameFromType(type) || "Unknown";
                    if (!warnedAboutMissingGetChildContext[componentName]) {
                      warnedAboutMissingGetChildContext[componentName] = true;
                      error("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", componentName, componentName);
                    }
                  }
                  return parentContext;
                }
                var childContext = instance.getChildContext();
                for (var contextKey in childContext) {
                  if (!(contextKey in childContextTypes)) {
                    throw new Error((getComponentNameFromType(type) || "Unknown") + '.getChildContext(): key "' + contextKey + '" is not defined in childContextTypes.');
                  }
                }
                {
                  var name = getComponentNameFromType(type) || "Unknown";
                  checkPropTypes(childContextTypes, childContext, "child context", name);
                }
                return assign({}, parentContext, childContext);
              }
            }
            var rendererSigil;
            {
              rendererSigil = {};
            }
            var rootContextSnapshot = null;
            var currentActiveSnapshot = null;
            function popNode(prev) {
              {
                prev.context._currentValue = prev.parentValue;
              }
            }
            function pushNode(next) {
              {
                next.context._currentValue = next.value;
              }
            }
            function popToNearestCommonAncestor(prev, next) {
              if (prev === next)
                ;
              else {
                popNode(prev);
                var parentPrev = prev.parent;
                var parentNext = next.parent;
                if (parentPrev === null) {
                  if (parentNext !== null) {
                    throw new Error("The stacks must reach the root at the same time. This is a bug in React.");
                  }
                } else {
                  if (parentNext === null) {
                    throw new Error("The stacks must reach the root at the same time. This is a bug in React.");
                  }
                  popToNearestCommonAncestor(parentPrev, parentNext);
                }
                pushNode(next);
              }
            }
            function popAllPrevious(prev) {
              popNode(prev);
              var parentPrev = prev.parent;
              if (parentPrev !== null) {
                popAllPrevious(parentPrev);
              }
            }
            function pushAllNext(next) {
              var parentNext = next.parent;
              if (parentNext !== null) {
                pushAllNext(parentNext);
              }
              pushNode(next);
            }
            function popPreviousToCommonLevel(prev, next) {
              popNode(prev);
              var parentPrev = prev.parent;
              if (parentPrev === null) {
                throw new Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
              }
              if (parentPrev.depth === next.depth) {
                popToNearestCommonAncestor(parentPrev, next);
              } else {
                popPreviousToCommonLevel(parentPrev, next);
              }
            }
            function popNextToCommonLevel(prev, next) {
              var parentNext = next.parent;
              if (parentNext === null) {
                throw new Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
              }
              if (prev.depth === parentNext.depth) {
                popToNearestCommonAncestor(prev, parentNext);
              } else {
                popNextToCommonLevel(prev, parentNext);
              }
              pushNode(next);
            }
            function switchContext(newSnapshot) {
              var prev = currentActiveSnapshot;
              var next = newSnapshot;
              if (prev !== next) {
                if (prev === null) {
                  pushAllNext(next);
                } else if (next === null) {
                  popAllPrevious(prev);
                } else if (prev.depth === next.depth) {
                  popToNearestCommonAncestor(prev, next);
                } else if (prev.depth > next.depth) {
                  popPreviousToCommonLevel(prev, next);
                } else {
                  popNextToCommonLevel(prev, next);
                }
                currentActiveSnapshot = next;
              }
            }
            function pushProvider(context, nextValue) {
              var prevValue;
              {
                prevValue = context._currentValue;
                context._currentValue = nextValue;
                {
                  if (context._currentRenderer !== void 0 && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
                    error("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.");
                  }
                  context._currentRenderer = rendererSigil;
                }
              }
              var prevNode = currentActiveSnapshot;
              var newNode = {
                parent: prevNode,
                depth: prevNode === null ? 0 : prevNode.depth + 1,
                context,
                parentValue: prevValue,
                value: nextValue
              };
              currentActiveSnapshot = newNode;
              return newNode;
            }
            function popProvider(context) {
              var prevSnapshot = currentActiveSnapshot;
              if (prevSnapshot === null) {
                throw new Error("Tried to pop a Context at the root of the app. This is a bug in React.");
              }
              {
                if (prevSnapshot.context !== context) {
                  error("The parent context is not the expected context. This is probably a bug in React.");
                }
              }
              {
                var value = prevSnapshot.parentValue;
                if (value === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED) {
                  prevSnapshot.context._currentValue = prevSnapshot.context._defaultValue;
                } else {
                  prevSnapshot.context._currentValue = value;
                }
                {
                  if (context._currentRenderer !== void 0 && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
                    error("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.");
                  }
                  context._currentRenderer = rendererSigil;
                }
              }
              return currentActiveSnapshot = prevSnapshot.parent;
            }
            function getActiveContext() {
              return currentActiveSnapshot;
            }
            function readContext(context) {
              var value = context._currentValue;
              return value;
            }
            function get(key) {
              return key._reactInternals;
            }
            function set(key, value) {
              key._reactInternals = value;
            }
            var didWarnAboutNoopUpdateForComponent = {};
            var didWarnAboutDeprecatedWillMount = {};
            var didWarnAboutUninitializedState;
            var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
            var didWarnAboutLegacyLifecyclesAndDerivedState;
            var didWarnAboutUndefinedDerivedState;
            var warnOnUndefinedDerivedState;
            var warnOnInvalidCallback;
            var didWarnAboutDirectlyAssigningPropsToState;
            var didWarnAboutContextTypeAndContextTypes;
            var didWarnAboutInvalidateContextType;
            {
              didWarnAboutUninitializedState = /* @__PURE__ */ new Set();
              didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = /* @__PURE__ */ new Set();
              didWarnAboutLegacyLifecyclesAndDerivedState = /* @__PURE__ */ new Set();
              didWarnAboutDirectlyAssigningPropsToState = /* @__PURE__ */ new Set();
              didWarnAboutUndefinedDerivedState = /* @__PURE__ */ new Set();
              didWarnAboutContextTypeAndContextTypes = /* @__PURE__ */ new Set();
              didWarnAboutInvalidateContextType = /* @__PURE__ */ new Set();
              var didWarnOnInvalidCallback = /* @__PURE__ */ new Set();
              warnOnInvalidCallback = function(callback, callerName) {
                if (callback === null || typeof callback === "function") {
                  return;
                }
                var key = callerName + "_" + callback;
                if (!didWarnOnInvalidCallback.has(key)) {
                  didWarnOnInvalidCallback.add(key);
                  error("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", callerName, callback);
                }
              };
              warnOnUndefinedDerivedState = function(type, partialState) {
                if (partialState === void 0) {
                  var componentName = getComponentNameFromType(type) || "Component";
                  if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
                    didWarnAboutUndefinedDerivedState.add(componentName);
                    error("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", componentName);
                  }
                }
              };
            }
            function warnNoop(publicInstance, callerName) {
              {
                var _constructor = publicInstance.constructor;
                var componentName = _constructor && getComponentNameFromType(_constructor) || "ReactClass";
                var warningKey = componentName + "." + callerName;
                if (didWarnAboutNoopUpdateForComponent[warningKey]) {
                  return;
                }
                error("%s(...): Can only update a mounting component. This usually means you called %s() outside componentWillMount() on the server. This is a no-op.\n\nPlease check the code for the %s component.", callerName, callerName, componentName);
                didWarnAboutNoopUpdateForComponent[warningKey] = true;
              }
            }
            var classComponentUpdater = {
              isMounted: function(inst) {
                return false;
              },
              enqueueSetState: function(inst, payload, callback) {
                var internals = get(inst);
                if (internals.queue === null) {
                  warnNoop(inst, "setState");
                } else {
                  internals.queue.push(payload);
                  {
                    if (callback !== void 0 && callback !== null) {
                      warnOnInvalidCallback(callback, "setState");
                    }
                  }
                }
              },
              enqueueReplaceState: function(inst, payload, callback) {
                var internals = get(inst);
                internals.replace = true;
                internals.queue = [payload];
                {
                  if (callback !== void 0 && callback !== null) {
                    warnOnInvalidCallback(callback, "setState");
                  }
                }
              },
              enqueueForceUpdate: function(inst, callback) {
                var internals = get(inst);
                if (internals.queue === null) {
                  warnNoop(inst, "forceUpdate");
                } else {
                  {
                    if (callback !== void 0 && callback !== null) {
                      warnOnInvalidCallback(callback, "setState");
                    }
                  }
                }
              }
            };
            function applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, prevState, nextProps) {
              var partialState = getDerivedStateFromProps(nextProps, prevState);
              {
                warnOnUndefinedDerivedState(ctor, partialState);
              }
              var newState = partialState === null || partialState === void 0 ? prevState : assign({}, prevState, partialState);
              return newState;
            }
            function constructClassInstance(ctor, props, maskedLegacyContext) {
              var context = emptyContextObject;
              var contextType = ctor.contextType;
              {
                if ("contextType" in ctor) {
                  var isValid = (
                    // Allow null for conditional declaration
                    contextType === null || contextType !== void 0 && contextType.$$typeof === REACT_CONTEXT_TYPE && contextType._context === void 0
                  );
                  if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
                    didWarnAboutInvalidateContextType.add(ctor);
                    var addendum = "";
                    if (contextType === void 0) {
                      addendum = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file.";
                    } else if (typeof contextType !== "object") {
                      addendum = " However, it is set to a " + typeof contextType + ".";
                    } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
                      addendum = " Did you accidentally pass the Context.Provider instead?";
                    } else if (contextType._context !== void 0) {
                      addendum = " Did you accidentally pass the Context.Consumer instead?";
                    } else {
                      addendum = " However, it is set to an object with keys {" + Object.keys(contextType).join(", ") + "}.";
                    }
                    error("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", getComponentNameFromType(ctor) || "Component", addendum);
                  }
                }
              }
              if (typeof contextType === "object" && contextType !== null) {
                context = readContext(contextType);
              } else {
                context = maskedLegacyContext;
              }
              var instance = new ctor(props, context);
              {
                if (typeof ctor.getDerivedStateFromProps === "function" && (instance.state === null || instance.state === void 0)) {
                  var componentName = getComponentNameFromType(ctor) || "Component";
                  if (!didWarnAboutUninitializedState.has(componentName)) {
                    didWarnAboutUninitializedState.add(componentName);
                    error("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", componentName, instance.state === null ? "null" : "undefined", componentName);
                  }
                }
                if (typeof ctor.getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function") {
                  var foundWillMountName = null;
                  var foundWillReceivePropsName = null;
                  var foundWillUpdateName = null;
                  if (typeof instance.componentWillMount === "function" && instance.componentWillMount.__suppressDeprecationWarning !== true) {
                    foundWillMountName = "componentWillMount";
                  } else if (typeof instance.UNSAFE_componentWillMount === "function") {
                    foundWillMountName = "UNSAFE_componentWillMount";
                  }
                  if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
                    foundWillReceivePropsName = "componentWillReceiveProps";
                  } else if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
                    foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
                  }
                  if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
                    foundWillUpdateName = "componentWillUpdate";
                  } else if (typeof instance.UNSAFE_componentWillUpdate === "function") {
                    foundWillUpdateName = "UNSAFE_componentWillUpdate";
                  }
                  if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
                    var _componentName = getComponentNameFromType(ctor) || "Component";
                    var newApiName = typeof ctor.getDerivedStateFromProps === "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
                    if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
                      didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);
                      error("Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://reactjs.org/link/unsafe-component-lifecycles", _componentName, newApiName, foundWillMountName !== null ? "\n  " + foundWillMountName : "", foundWillReceivePropsName !== null ? "\n  " + foundWillReceivePropsName : "", foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : "");
                    }
                  }
                }
              }
              return instance;
            }
            function checkClassInstance(instance, ctor, newProps) {
              {
                var name = getComponentNameFromType(ctor) || "Component";
                var renderPresent = instance.render;
                if (!renderPresent) {
                  if (ctor.prototype && typeof ctor.prototype.render === "function") {
                    error("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", name);
                  } else {
                    error("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", name);
                  }
                }
                if (instance.getInitialState && !instance.getInitialState.isReactClassApproved && !instance.state) {
                  error("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", name);
                }
                if (instance.getDefaultProps && !instance.getDefaultProps.isReactClassApproved) {
                  error("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", name);
                }
                if (instance.propTypes) {
                  error("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", name);
                }
                if (instance.contextType) {
                  error("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", name);
                }
                {
                  if (instance.contextTypes) {
                    error("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", name);
                  }
                  if (ctor.contextType && ctor.contextTypes && !didWarnAboutContextTypeAndContextTypes.has(ctor)) {
                    didWarnAboutContextTypeAndContextTypes.add(ctor);
                    error("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", name);
                  }
                }
                if (typeof instance.componentShouldUpdate === "function") {
                  error("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", name);
                }
                if (ctor.prototype && ctor.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== "undefined") {
                  error("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", getComponentNameFromType(ctor) || "A pure component");
                }
                if (typeof instance.componentDidUnmount === "function") {
                  error("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", name);
                }
                if (typeof instance.componentDidReceiveProps === "function") {
                  error("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", name);
                }
                if (typeof instance.componentWillRecieveProps === "function") {
                  error("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", name);
                }
                if (typeof instance.UNSAFE_componentWillRecieveProps === "function") {
                  error("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", name);
                }
                var hasMutatedProps = instance.props !== newProps;
                if (instance.props !== void 0 && hasMutatedProps) {
                  error("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", name, name);
                }
                if (instance.defaultProps) {
                  error("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", name, name);
                }
                if (typeof instance.getSnapshotBeforeUpdate === "function" && typeof instance.componentDidUpdate !== "function" && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)) {
                  didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);
                  error("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", getComponentNameFromType(ctor));
                }
                if (typeof instance.getDerivedStateFromProps === "function") {
                  error("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", name);
                }
                if (typeof instance.getDerivedStateFromError === "function") {
                  error("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", name);
                }
                if (typeof ctor.getSnapshotBeforeUpdate === "function") {
                  error("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", name);
                }
                var _state = instance.state;
                if (_state && (typeof _state !== "object" || isArray(_state))) {
                  error("%s.state: must be set to an object or null", name);
                }
                if (typeof instance.getChildContext === "function" && typeof ctor.childContextTypes !== "object") {
                  error("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", name);
                }
              }
            }
            function callComponentWillMount(type, instance) {
              var oldState = instance.state;
              if (typeof instance.componentWillMount === "function") {
                {
                  if (instance.componentWillMount.__suppressDeprecationWarning !== true) {
                    var componentName = getComponentNameFromType(type) || "Unknown";
                    if (!didWarnAboutDeprecatedWillMount[componentName]) {
                      warn(
                        // keep this warning in sync with ReactStrictModeWarning.js
                        "componentWillMount has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n* Move code from componentWillMount to componentDidMount (preferred in most cases) or the constructor.\n\nPlease update the following components: %s",
                        componentName
                      );
                      didWarnAboutDeprecatedWillMount[componentName] = true;
                    }
                  }
                }
                instance.componentWillMount();
              }
              if (typeof instance.UNSAFE_componentWillMount === "function") {
                instance.UNSAFE_componentWillMount();
              }
              if (oldState !== instance.state) {
                {
                  error("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", getComponentNameFromType(type) || "Component");
                }
                classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
              }
            }
            function processUpdateQueue(internalInstance, inst, props, maskedLegacyContext) {
              if (internalInstance.queue !== null && internalInstance.queue.length > 0) {
                var oldQueue = internalInstance.queue;
                var oldReplace = internalInstance.replace;
                internalInstance.queue = null;
                internalInstance.replace = false;
                if (oldReplace && oldQueue.length === 1) {
                  inst.state = oldQueue[0];
                } else {
                  var nextState = oldReplace ? oldQueue[0] : inst.state;
                  var dontMutate = true;
                  for (var i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
                    var partial = oldQueue[i];
                    var partialState = typeof partial === "function" ? partial.call(inst, nextState, props, maskedLegacyContext) : partial;
                    if (partialState != null) {
                      if (dontMutate) {
                        dontMutate = false;
                        nextState = assign({}, nextState, partialState);
                      } else {
                        assign(nextState, partialState);
                      }
                    }
                  }
                  inst.state = nextState;
                }
              } else {
                internalInstance.queue = null;
              }
            }
            function mountClassInstance(instance, ctor, newProps, maskedLegacyContext) {
              {
                checkClassInstance(instance, ctor, newProps);
              }
              var initialState = instance.state !== void 0 ? instance.state : null;
              instance.updater = classComponentUpdater;
              instance.props = newProps;
              instance.state = initialState;
              var internalInstance = {
                queue: [],
                replace: false
              };
              set(instance, internalInstance);
              var contextType = ctor.contextType;
              if (typeof contextType === "object" && contextType !== null) {
                instance.context = readContext(contextType);
              } else {
                instance.context = maskedLegacyContext;
              }
              {
                if (instance.state === newProps) {
                  var componentName = getComponentNameFromType(ctor) || "Component";
                  if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
                    didWarnAboutDirectlyAssigningPropsToState.add(componentName);
                    error("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", componentName);
                  }
                }
              }
              var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
              if (typeof getDerivedStateFromProps === "function") {
                instance.state = applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, initialState, newProps);
              }
              if (typeof ctor.getDerivedStateFromProps !== "function" && typeof instance.getSnapshotBeforeUpdate !== "function" && (typeof instance.UNSAFE_componentWillMount === "function" || typeof instance.componentWillMount === "function")) {
                callComponentWillMount(ctor, instance);
                processUpdateQueue(internalInstance, instance, newProps, maskedLegacyContext);
              }
            }
            var emptyTreeContext = {
              id: 1,
              overflow: ""
            };
            function getTreeId(context) {
              var overflow = context.overflow;
              var idWithLeadingBit = context.id;
              var id = idWithLeadingBit & ~getLeadingBit(idWithLeadingBit);
              return id.toString(32) + overflow;
            }
            function pushTreeContext(baseContext, totalChildren, index) {
              var baseIdWithLeadingBit = baseContext.id;
              var baseOverflow = baseContext.overflow;
              var baseLength = getBitLength(baseIdWithLeadingBit) - 1;
              var baseId = baseIdWithLeadingBit & ~(1 << baseLength);
              var slot = index + 1;
              var length = getBitLength(totalChildren) + baseLength;
              if (length > 30) {
                var numberOfOverflowBits = baseLength - baseLength % 5;
                var newOverflowBits = (1 << numberOfOverflowBits) - 1;
                var newOverflow = (baseId & newOverflowBits).toString(32);
                var restOfBaseId = baseId >> numberOfOverflowBits;
                var restOfBaseLength = baseLength - numberOfOverflowBits;
                var restOfLength = getBitLength(totalChildren) + restOfBaseLength;
                var restOfNewBits = slot << restOfBaseLength;
                var id = restOfNewBits | restOfBaseId;
                var overflow = newOverflow + baseOverflow;
                return {
                  id: 1 << restOfLength | id,
                  overflow
                };
              } else {
                var newBits = slot << baseLength;
                var _id = newBits | baseId;
                var _overflow = baseOverflow;
                return {
                  id: 1 << length | _id,
                  overflow: _overflow
                };
              }
            }
            function getBitLength(number) {
              return 32 - clz32(number);
            }
            function getLeadingBit(id) {
              return 1 << getBitLength(id) - 1;
            }
            var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
            var log = Math.log;
            var LN2 = Math.LN2;
            function clz32Fallback(x) {
              var asUint = x >>> 0;
              if (asUint === 0) {
                return 32;
              }
              return 31 - (log(asUint) / LN2 | 0) | 0;
            }
            function is(x, y) {
              return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
            }
            var objectIs = typeof Object.is === "function" ? Object.is : is;
            var currentlyRenderingComponent = null;
            var currentlyRenderingTask = null;
            var firstWorkInProgressHook = null;
            var workInProgressHook = null;
            var isReRender = false;
            var didScheduleRenderPhaseUpdate = false;
            var localIdCounter = 0;
            var renderPhaseUpdates = null;
            var numberOfReRenders = 0;
            var RE_RENDER_LIMIT = 25;
            var isInHookUserCodeInDev = false;
            var currentHookNameInDev;
            function resolveCurrentlyRenderingComponent() {
              if (currentlyRenderingComponent === null) {
                throw new Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
              }
              {
                if (isInHookUserCodeInDev) {
                  error("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://reactjs.org/link/rules-of-hooks");
                }
              }
              return currentlyRenderingComponent;
            }
            function areHookInputsEqual(nextDeps, prevDeps) {
              if (prevDeps === null) {
                {
                  error("%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.", currentHookNameInDev);
                }
                return false;
              }
              {
                if (nextDeps.length !== prevDeps.length) {
                  error("The final argument passed to %s changed size between renders. The order and size of this array must remain constant.\n\nPrevious: %s\nIncoming: %s", currentHookNameInDev, "[" + nextDeps.join(", ") + "]", "[" + prevDeps.join(", ") + "]");
                }
              }
              for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
                if (objectIs(nextDeps[i], prevDeps[i])) {
                  continue;
                }
                return false;
              }
              return true;
            }
            function createHook() {
              if (numberOfReRenders > 0) {
                throw new Error("Rendered more hooks than during the previous render");
              }
              return {
                memoizedState: null,
                queue: null,
                next: null
              };
            }
            function createWorkInProgressHook() {
              if (workInProgressHook === null) {
                if (firstWorkInProgressHook === null) {
                  isReRender = false;
                  firstWorkInProgressHook = workInProgressHook = createHook();
                } else {
                  isReRender = true;
                  workInProgressHook = firstWorkInProgressHook;
                }
              } else {
                if (workInProgressHook.next === null) {
                  isReRender = false;
                  workInProgressHook = workInProgressHook.next = createHook();
                } else {
                  isReRender = true;
                  workInProgressHook = workInProgressHook.next;
                }
              }
              return workInProgressHook;
            }
            function prepareToUseHooks(task, componentIdentity) {
              currentlyRenderingComponent = componentIdentity;
              currentlyRenderingTask = task;
              {
                isInHookUserCodeInDev = false;
              }
              localIdCounter = 0;
            }
            function finishHooks(Component, props, children, refOrContext) {
              while (didScheduleRenderPhaseUpdate) {
                didScheduleRenderPhaseUpdate = false;
                localIdCounter = 0;
                numberOfReRenders += 1;
                workInProgressHook = null;
                children = Component(props, refOrContext);
              }
              resetHooksState();
              return children;
            }
            function checkDidRenderIdHook() {
              var didRenderIdHook = localIdCounter !== 0;
              return didRenderIdHook;
            }
            function resetHooksState() {
              {
                isInHookUserCodeInDev = false;
              }
              currentlyRenderingComponent = null;
              currentlyRenderingTask = null;
              didScheduleRenderPhaseUpdate = false;
              firstWorkInProgressHook = null;
              numberOfReRenders = 0;
              renderPhaseUpdates = null;
              workInProgressHook = null;
            }
            function readContext$1(context) {
              {
                if (isInHookUserCodeInDev) {
                  error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
                }
              }
              return readContext(context);
            }
            function useContext(context) {
              {
                currentHookNameInDev = "useContext";
              }
              resolveCurrentlyRenderingComponent();
              return readContext(context);
            }
            function basicStateReducer(state, action) {
              return typeof action === "function" ? action(state) : action;
            }
            function useState(initialState) {
              {
                currentHookNameInDev = "useState";
              }
              return useReducer(
                basicStateReducer,
                // useReducer has a special case to support lazy useState initializers
                initialState
              );
            }
            function useReducer(reducer, initialArg, init) {
              {
                if (reducer !== basicStateReducer) {
                  currentHookNameInDev = "useReducer";
                }
              }
              currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
              workInProgressHook = createWorkInProgressHook();
              if (isReRender) {
                var queue = workInProgressHook.queue;
                var dispatch = queue.dispatch;
                if (renderPhaseUpdates !== null) {
                  var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
                  if (firstRenderPhaseUpdate !== void 0) {
                    renderPhaseUpdates.delete(queue);
                    var newState = workInProgressHook.memoizedState;
                    var update = firstRenderPhaseUpdate;
                    do {
                      var action = update.action;
                      {
                        isInHookUserCodeInDev = true;
                      }
                      newState = reducer(newState, action);
                      {
                        isInHookUserCodeInDev = false;
                      }
                      update = update.next;
                    } while (update !== null);
                    workInProgressHook.memoizedState = newState;
                    return [newState, dispatch];
                  }
                }
                return [workInProgressHook.memoizedState, dispatch];
              } else {
                {
                  isInHookUserCodeInDev = true;
                }
                var initialState;
                if (reducer === basicStateReducer) {
                  initialState = typeof initialArg === "function" ? initialArg() : initialArg;
                } else {
                  initialState = init !== void 0 ? init(initialArg) : initialArg;
                }
                {
                  isInHookUserCodeInDev = false;
                }
                workInProgressHook.memoizedState = initialState;
                var _queue = workInProgressHook.queue = {
                  last: null,
                  dispatch: null
                };
                var _dispatch = _queue.dispatch = dispatchAction.bind(null, currentlyRenderingComponent, _queue);
                return [workInProgressHook.memoizedState, _dispatch];
              }
            }
            function useMemo(nextCreate, deps) {
              currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
              workInProgressHook = createWorkInProgressHook();
              var nextDeps = deps === void 0 ? null : deps;
              if (workInProgressHook !== null) {
                var prevState = workInProgressHook.memoizedState;
                if (prevState !== null) {
                  if (nextDeps !== null) {
                    var prevDeps = prevState[1];
                    if (areHookInputsEqual(nextDeps, prevDeps)) {
                      return prevState[0];
                    }
                  }
                }
              }
              {
                isInHookUserCodeInDev = true;
              }
              var nextValue = nextCreate();
              {
                isInHookUserCodeInDev = false;
              }
              workInProgressHook.memoizedState = [nextValue, nextDeps];
              return nextValue;
            }
            function useRef(initialValue) {
              currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
              workInProgressHook = createWorkInProgressHook();
              var previousRef = workInProgressHook.memoizedState;
              if (previousRef === null) {
                var ref = {
                  current: initialValue
                };
                {
                  Object.seal(ref);
                }
                workInProgressHook.memoizedState = ref;
                return ref;
              } else {
                return previousRef;
              }
            }
            function useLayoutEffect(create, inputs) {
              {
                currentHookNameInDev = "useLayoutEffect";
                error("useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format. This will lead to a mismatch between the initial, non-hydrated UI and the intended UI. To avoid this, useLayoutEffect should only be used in components that render exclusively on the client. See https://reactjs.org/link/uselayouteffect-ssr for common fixes.");
              }
            }
            function dispatchAction(componentIdentity, queue, action) {
              if (numberOfReRenders >= RE_RENDER_LIMIT) {
                throw new Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
              }
              if (componentIdentity === currentlyRenderingComponent) {
                didScheduleRenderPhaseUpdate = true;
                var update = {
                  action,
                  next: null
                };
                if (renderPhaseUpdates === null) {
                  renderPhaseUpdates = /* @__PURE__ */ new Map();
                }
                var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
                if (firstRenderPhaseUpdate === void 0) {
                  renderPhaseUpdates.set(queue, update);
                } else {
                  var lastRenderPhaseUpdate = firstRenderPhaseUpdate;
                  while (lastRenderPhaseUpdate.next !== null) {
                    lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
                  }
                  lastRenderPhaseUpdate.next = update;
                }
              }
            }
            function useCallback(callback, deps) {
              return useMemo(function() {
                return callback;
              }, deps);
            }
            function useMutableSource(source, getSnapshot, subscribe) {
              resolveCurrentlyRenderingComponent();
              return getSnapshot(source._source);
            }
            function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
              if (getServerSnapshot === void 0) {
                throw new Error("Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering.");
              }
              return getServerSnapshot();
            }
            function useDeferredValue(value) {
              resolveCurrentlyRenderingComponent();
              return value;
            }
            function unsupportedStartTransition() {
              throw new Error("startTransition cannot be called during server rendering.");
            }
            function useTransition() {
              resolveCurrentlyRenderingComponent();
              return [false, unsupportedStartTransition];
            }
            function useId() {
              var task = currentlyRenderingTask;
              var treeId = getTreeId(task.treeContext);
              var responseState = currentResponseState;
              if (responseState === null) {
                throw new Error("Invalid hook call. Hooks can only be called inside of the body of a function component.");
              }
              var localId = localIdCounter++;
              return makeId(responseState, treeId, localId);
            }
            function noop() {
            }
            var Dispatcher = {
              readContext: readContext$1,
              useContext,
              useMemo,
              useReducer,
              useRef,
              useState,
              useInsertionEffect: noop,
              useLayoutEffect,
              useCallback,
              // useImperativeHandle is not run in the server environment
              useImperativeHandle: noop,
              // Effects are not run in the server environment.
              useEffect: noop,
              // Debugging effect
              useDebugValue: noop,
              useDeferredValue,
              useTransition,
              useId,
              // Subscriptions are not setup in a server environment.
              useMutableSource,
              useSyncExternalStore
            };
            var currentResponseState = null;
            function setCurrentResponseState(responseState) {
              currentResponseState = responseState;
            }
            function getStackByComponentStackNode(componentStack) {
              try {
                var info = "";
                var node = componentStack;
                do {
                  switch (node.tag) {
                    case 0:
                      info += describeBuiltInComponentFrame(node.type, null, null);
                      break;
                    case 1:
                      info += describeFunctionComponentFrame(node.type, null, null);
                      break;
                    case 2:
                      info += describeClassComponentFrame(node.type, null, null);
                      break;
                  }
                  node = node.parent;
                } while (node);
                return info;
              } catch (x) {
                return "\nError generating stack: " + x.message + "\n" + x.stack;
              }
            }
            var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
            var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
            var PENDING = 0;
            var COMPLETED = 1;
            var FLUSHED = 2;
            var ABORTED = 3;
            var ERRORED = 4;
            var OPEN = 0;
            var CLOSING = 1;
            var CLOSED = 2;
            var DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12800;
            function defaultErrorHandler(error2) {
              console["error"](error2);
              return null;
            }
            function noop$1() {
            }
            function createRequest(children, responseState, rootFormatContext, progressiveChunkSize, onError, onAllReady, onShellReady, onShellError, onFatalError) {
              var pingedTasks = [];
              var abortSet = /* @__PURE__ */ new Set();
              var request = {
                destination: null,
                responseState,
                progressiveChunkSize: progressiveChunkSize === void 0 ? DEFAULT_PROGRESSIVE_CHUNK_SIZE : progressiveChunkSize,
                status: OPEN,
                fatalError: null,
                nextSegmentId: 0,
                allPendingTasks: 0,
                pendingRootTasks: 0,
                completedRootSegment: null,
                abortableTasks: abortSet,
                pingedTasks,
                clientRenderedBoundaries: [],
                completedBoundaries: [],
                partialBoundaries: [],
                onError: onError === void 0 ? defaultErrorHandler : onError,
                onAllReady: onAllReady === void 0 ? noop$1 : onAllReady,
                onShellReady: onShellReady === void 0 ? noop$1 : onShellReady,
                onShellError: onShellError === void 0 ? noop$1 : onShellError,
                onFatalError: onFatalError === void 0 ? noop$1 : onFatalError
              };
              var rootSegment = createPendingSegment(
                request,
                0,
                null,
                rootFormatContext,
                // Root segments are never embedded in Text on either edge
                false,
                false
              );
              rootSegment.parentFlushed = true;
              var rootTask = createTask(request, children, null, rootSegment, abortSet, emptyContextObject, rootContextSnapshot, emptyTreeContext);
              pingedTasks.push(rootTask);
              return request;
            }
            function pingTask(request, task) {
              var pingedTasks = request.pingedTasks;
              pingedTasks.push(task);
              if (pingedTasks.length === 1) {
                scheduleWork(function() {
                  return performWork(request);
                });
              }
            }
            function createSuspenseBoundary(request, fallbackAbortableTasks) {
              return {
                id: UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
                rootSegmentID: -1,
                parentFlushed: false,
                pendingTasks: 0,
                forceClientRender: false,
                completedSegments: [],
                byteSize: 0,
                fallbackAbortableTasks,
                errorDigest: null
              };
            }
            function createTask(request, node, blockedBoundary, blockedSegment, abortSet, legacyContext, context, treeContext) {
              request.allPendingTasks++;
              if (blockedBoundary === null) {
                request.pendingRootTasks++;
              } else {
                blockedBoundary.pendingTasks++;
              }
              var task = {
                node,
                ping: function() {
                  return pingTask(request, task);
                },
                blockedBoundary,
                blockedSegment,
                abortSet,
                legacyContext,
                context,
                treeContext
              };
              {
                task.componentStack = null;
              }
              abortSet.add(task);
              return task;
            }
            function createPendingSegment(request, index, boundary, formatContext, lastPushedText, textEmbedded) {
              return {
                status: PENDING,
                id: -1,
                // lazily assigned later
                index,
                parentFlushed: false,
                chunks: [],
                children: [],
                formatContext,
                boundary,
                lastPushedText,
                textEmbedded
              };
            }
            var currentTaskInDEV = null;
            function getCurrentStackInDEV() {
              {
                if (currentTaskInDEV === null || currentTaskInDEV.componentStack === null) {
                  return "";
                }
                return getStackByComponentStackNode(currentTaskInDEV.componentStack);
              }
            }
            function pushBuiltInComponentStackInDEV(task, type) {
              {
                task.componentStack = {
                  tag: 0,
                  parent: task.componentStack,
                  type
                };
              }
            }
            function pushFunctionComponentStackInDEV(task, type) {
              {
                task.componentStack = {
                  tag: 1,
                  parent: task.componentStack,
                  type
                };
              }
            }
            function pushClassComponentStackInDEV(task, type) {
              {
                task.componentStack = {
                  tag: 2,
                  parent: task.componentStack,
                  type
                };
              }
            }
            function popComponentStackInDEV(task) {
              {
                if (task.componentStack === null) {
                  error("Unexpectedly popped too many stack frames. This is a bug in React.");
                } else {
                  task.componentStack = task.componentStack.parent;
                }
              }
            }
            var lastBoundaryErrorComponentStackDev = null;
            function captureBoundaryErrorDetailsDev(boundary, error2) {
              {
                var errorMessage;
                if (typeof error2 === "string") {
                  errorMessage = error2;
                } else if (error2 && typeof error2.message === "string") {
                  errorMessage = error2.message;
                } else {
                  errorMessage = String(error2);
                }
                var errorComponentStack = lastBoundaryErrorComponentStackDev || getCurrentStackInDEV();
                lastBoundaryErrorComponentStackDev = null;
                boundary.errorMessage = errorMessage;
                boundary.errorComponentStack = errorComponentStack;
              }
            }
            function logRecoverableError(request, error2) {
              var errorDigest = request.onError(error2);
              if (errorDigest != null && typeof errorDigest !== "string") {
                throw new Error('onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' + typeof errorDigest + '" instead');
              }
              return errorDigest;
            }
            function fatalError(request, error2) {
              var onShellError = request.onShellError;
              onShellError(error2);
              var onFatalError = request.onFatalError;
              onFatalError(error2);
              if (request.destination !== null) {
                request.status = CLOSED;
                closeWithError(request.destination, error2);
              } else {
                request.status = CLOSING;
                request.fatalError = error2;
              }
            }
            function renderSuspenseBoundary(request, task, props) {
              pushBuiltInComponentStackInDEV(task, "Suspense");
              var parentBoundary = task.blockedBoundary;
              var parentSegment = task.blockedSegment;
              var fallback = props.fallback;
              var content = props.children;
              var fallbackAbortSet = /* @__PURE__ */ new Set();
              var newBoundary = createSuspenseBoundary(request, fallbackAbortSet);
              var insertionIndex = parentSegment.chunks.length;
              var boundarySegment = createPendingSegment(
                request,
                insertionIndex,
                newBoundary,
                parentSegment.formatContext,
                // boundaries never require text embedding at their edges because comment nodes bound them
                false,
                false
              );
              parentSegment.children.push(boundarySegment);
              parentSegment.lastPushedText = false;
              var contentRootSegment = createPendingSegment(
                request,
                0,
                null,
                parentSegment.formatContext,
                // boundaries never require text embedding at their edges because comment nodes bound them
                false,
                false
              );
              contentRootSegment.parentFlushed = true;
              task.blockedBoundary = newBoundary;
              task.blockedSegment = contentRootSegment;
              try {
                renderNode(request, task, content);
                pushSegmentFinale(contentRootSegment.chunks, request.responseState, contentRootSegment.lastPushedText, contentRootSegment.textEmbedded);
                contentRootSegment.status = COMPLETED;
                queueCompletedSegment(newBoundary, contentRootSegment);
                if (newBoundary.pendingTasks === 0) {
                  popComponentStackInDEV(task);
                  return;
                }
              } catch (error2) {
                contentRootSegment.status = ERRORED;
                newBoundary.forceClientRender = true;
                newBoundary.errorDigest = logRecoverableError(request, error2);
                {
                  captureBoundaryErrorDetailsDev(newBoundary, error2);
                }
              } finally {
                task.blockedBoundary = parentBoundary;
                task.blockedSegment = parentSegment;
              }
              var suspendedFallbackTask = createTask(request, fallback, parentBoundary, boundarySegment, fallbackAbortSet, task.legacyContext, task.context, task.treeContext);
              {
                suspendedFallbackTask.componentStack = task.componentStack;
              }
              request.pingedTasks.push(suspendedFallbackTask);
              popComponentStackInDEV(task);
            }
            function renderHostElement(request, task, type, props) {
              pushBuiltInComponentStackInDEV(task, type);
              var segment = task.blockedSegment;
              var children = pushStartInstance(segment.chunks, type, props, request.responseState, segment.formatContext);
              segment.lastPushedText = false;
              var prevContext = segment.formatContext;
              segment.formatContext = getChildFormatContext(prevContext, type, props);
              renderNode(request, task, children);
              segment.formatContext = prevContext;
              pushEndInstance(segment.chunks, type);
              segment.lastPushedText = false;
              popComponentStackInDEV(task);
            }
            function shouldConstruct$1(Component) {
              return Component.prototype && Component.prototype.isReactComponent;
            }
            function renderWithHooks(request, task, Component, props, secondArg) {
              var componentIdentity = {};
              prepareToUseHooks(task, componentIdentity);
              var result = Component(props, secondArg);
              return finishHooks(Component, props, result, secondArg);
            }
            function finishClassComponent(request, task, instance, Component, props) {
              var nextChildren = instance.render();
              {
                if (instance.props !== props) {
                  if (!didWarnAboutReassigningProps) {
                    error("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", getComponentNameFromType(Component) || "a component");
                  }
                  didWarnAboutReassigningProps = true;
                }
              }
              {
                var childContextTypes = Component.childContextTypes;
                if (childContextTypes !== null && childContextTypes !== void 0) {
                  var previousContext = task.legacyContext;
                  var mergedContext = processChildContext(instance, Component, previousContext, childContextTypes);
                  task.legacyContext = mergedContext;
                  renderNodeDestructive(request, task, nextChildren);
                  task.legacyContext = previousContext;
                  return;
                }
              }
              renderNodeDestructive(request, task, nextChildren);
            }
            function renderClassComponent(request, task, Component, props) {
              pushClassComponentStackInDEV(task, Component);
              var maskedContext = getMaskedContext(Component, task.legacyContext);
              var instance = constructClassInstance(Component, props, maskedContext);
              mountClassInstance(instance, Component, props, maskedContext);
              finishClassComponent(request, task, instance, Component, props);
              popComponentStackInDEV(task);
            }
            var didWarnAboutBadClass = {};
            var didWarnAboutModulePatternComponent = {};
            var didWarnAboutContextTypeOnFunctionComponent = {};
            var didWarnAboutGetDerivedStateOnFunctionComponent = {};
            var didWarnAboutReassigningProps = false;
            var didWarnAboutGenerators = false;
            var didWarnAboutMaps = false;
            var hasWarnedAboutUsingContextAsConsumer = false;
            function renderIndeterminateComponent(request, task, Component, props) {
              var legacyContext;
              {
                legacyContext = getMaskedContext(Component, task.legacyContext);
              }
              pushFunctionComponentStackInDEV(task, Component);
              {
                if (Component.prototype && typeof Component.prototype.render === "function") {
                  var componentName = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutBadClass[componentName]) {
                    error("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", componentName, componentName);
                    didWarnAboutBadClass[componentName] = true;
                  }
                }
              }
              var value = renderWithHooks(request, task, Component, props, legacyContext);
              var hasId = checkDidRenderIdHook();
              {
                if (typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === void 0) {
                  var _componentName = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutModulePatternComponent[_componentName]) {
                    error("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", _componentName, _componentName, _componentName);
                    didWarnAboutModulePatternComponent[_componentName] = true;
                  }
                }
              }
              if (
                // Run these checks in production only if the flag is off.
                // Eventually we'll delete this branch altogether.
                typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === void 0
              ) {
                {
                  var _componentName2 = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutModulePatternComponent[_componentName2]) {
                    error("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", _componentName2, _componentName2, _componentName2);
                    didWarnAboutModulePatternComponent[_componentName2] = true;
                  }
                }
                mountClassInstance(value, Component, props, legacyContext);
                finishClassComponent(request, task, value, Component, props);
              } else {
                {
                  validateFunctionComponentInDev(Component);
                }
                if (hasId) {
                  var prevTreeContext = task.treeContext;
                  var totalChildren = 1;
                  var index = 0;
                  task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
                  try {
                    renderNodeDestructive(request, task, value);
                  } finally {
                    task.treeContext = prevTreeContext;
                  }
                } else {
                  renderNodeDestructive(request, task, value);
                }
              }
              popComponentStackInDEV(task);
            }
            function validateFunctionComponentInDev(Component) {
              {
                if (Component) {
                  if (Component.childContextTypes) {
                    error("%s(...): childContextTypes cannot be defined on a function component.", Component.displayName || Component.name || "Component");
                  }
                }
                if (typeof Component.getDerivedStateFromProps === "function") {
                  var _componentName3 = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3]) {
                    error("%s: Function components do not support getDerivedStateFromProps.", _componentName3);
                    didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3] = true;
                  }
                }
                if (typeof Component.contextType === "object" && Component.contextType !== null) {
                  var _componentName4 = getComponentNameFromType(Component) || "Unknown";
                  if (!didWarnAboutContextTypeOnFunctionComponent[_componentName4]) {
                    error("%s: Function components do not support contextType.", _componentName4);
                    didWarnAboutContextTypeOnFunctionComponent[_componentName4] = true;
                  }
                }
              }
            }
            function resolveDefaultProps(Component, baseProps) {
              if (Component && Component.defaultProps) {
                var props = assign({}, baseProps);
                var defaultProps = Component.defaultProps;
                for (var propName in defaultProps) {
                  if (props[propName] === void 0) {
                    props[propName] = defaultProps[propName];
                  }
                }
                return props;
              }
              return baseProps;
            }
            function renderForwardRef(request, task, type, props, ref) {
              pushFunctionComponentStackInDEV(task, type.render);
              var children = renderWithHooks(request, task, type.render, props, ref);
              var hasId = checkDidRenderIdHook();
              if (hasId) {
                var prevTreeContext = task.treeContext;
                var totalChildren = 1;
                var index = 0;
                task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
                try {
                  renderNodeDestructive(request, task, children);
                } finally {
                  task.treeContext = prevTreeContext;
                }
              } else {
                renderNodeDestructive(request, task, children);
              }
              popComponentStackInDEV(task);
            }
            function renderMemo(request, task, type, props, ref) {
              var innerType = type.type;
              var resolvedProps = resolveDefaultProps(innerType, props);
              renderElement(request, task, innerType, resolvedProps, ref);
            }
            function renderContextConsumer(request, task, context, props) {
              {
                if (context._context === void 0) {
                  if (context !== context.Consumer) {
                    if (!hasWarnedAboutUsingContextAsConsumer) {
                      hasWarnedAboutUsingContextAsConsumer = true;
                      error("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                    }
                  }
                } else {
                  context = context._context;
                }
              }
              var render = props.children;
              {
                if (typeof render !== "function") {
                  error("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it.");
                }
              }
              var newValue = readContext(context);
              var newChildren = render(newValue);
              renderNodeDestructive(request, task, newChildren);
            }
            function renderContextProvider(request, task, type, props) {
              var context = type._context;
              var value = props.value;
              var children = props.children;
              var prevSnapshot;
              {
                prevSnapshot = task.context;
              }
              task.context = pushProvider(context, value);
              renderNodeDestructive(request, task, children);
              task.context = popProvider(context);
              {
                if (prevSnapshot !== task.context) {
                  error("Popping the context provider did not return back to the original snapshot. This is a bug in React.");
                }
              }
            }
            function renderLazyComponent(request, task, lazyComponent, props, ref) {
              pushBuiltInComponentStackInDEV(task, "Lazy");
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              var Component = init(payload);
              var resolvedProps = resolveDefaultProps(Component, props);
              renderElement(request, task, Component, resolvedProps, ref);
              popComponentStackInDEV(task);
            }
            function renderElement(request, task, type, props, ref) {
              if (typeof type === "function") {
                if (shouldConstruct$1(type)) {
                  renderClassComponent(request, task, type, props);
                  return;
                } else {
                  renderIndeterminateComponent(request, task, type, props);
                  return;
                }
              }
              if (typeof type === "string") {
                renderHostElement(request, task, type, props);
                return;
              }
              switch (type) {
                case REACT_LEGACY_HIDDEN_TYPE:
                case REACT_DEBUG_TRACING_MODE_TYPE:
                case REACT_STRICT_MODE_TYPE:
                case REACT_PROFILER_TYPE:
                case REACT_FRAGMENT_TYPE: {
                  renderNodeDestructive(request, task, props.children);
                  return;
                }
                case REACT_SUSPENSE_LIST_TYPE: {
                  pushBuiltInComponentStackInDEV(task, "SuspenseList");
                  renderNodeDestructive(request, task, props.children);
                  popComponentStackInDEV(task);
                  return;
                }
                case REACT_SCOPE_TYPE: {
                  throw new Error("ReactDOMServer does not yet support scope components.");
                }
                case REACT_SUSPENSE_TYPE: {
                  {
                    renderSuspenseBoundary(request, task, props);
                  }
                  return;
                }
              }
              if (typeof type === "object" && type !== null) {
                switch (type.$$typeof) {
                  case REACT_FORWARD_REF_TYPE: {
                    renderForwardRef(request, task, type, props, ref);
                    return;
                  }
                  case REACT_MEMO_TYPE: {
                    renderMemo(request, task, type, props, ref);
                    return;
                  }
                  case REACT_PROVIDER_TYPE: {
                    renderContextProvider(request, task, type, props);
                    return;
                  }
                  case REACT_CONTEXT_TYPE: {
                    renderContextConsumer(request, task, type, props);
                    return;
                  }
                  case REACT_LAZY_TYPE: {
                    renderLazyComponent(request, task, type, props);
                    return;
                  }
                }
              }
              var info = "";
              {
                if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                  info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
                }
              }
              throw new Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) " + ("but got: " + (type == null ? type : typeof type) + "." + info));
            }
            function validateIterable(iterable, iteratorFn) {
              {
                if (typeof Symbol === "function" && // $FlowFixMe Flow doesn't know about toStringTag
                iterable[Symbol.toStringTag] === "Generator") {
                  if (!didWarnAboutGenerators) {
                    error("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers.");
                  }
                  didWarnAboutGenerators = true;
                }
                if (iterable.entries === iteratorFn) {
                  if (!didWarnAboutMaps) {
                    error("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
            }
            function renderNodeDestructive(request, task, node) {
              {
                try {
                  return renderNodeDestructiveImpl(request, task, node);
                } catch (x) {
                  if (typeof x === "object" && x !== null && typeof x.then === "function")
                    ;
                  else {
                    lastBoundaryErrorComponentStackDev = lastBoundaryErrorComponentStackDev !== null ? lastBoundaryErrorComponentStackDev : getCurrentStackInDEV();
                  }
                  throw x;
                }
              }
            }
            function renderNodeDestructiveImpl(request, task, node) {
              task.node = node;
              if (typeof node === "object" && node !== null) {
                switch (node.$$typeof) {
                  case REACT_ELEMENT_TYPE: {
                    var element = node;
                    var type = element.type;
                    var props = element.props;
                    var ref = element.ref;
                    renderElement(request, task, type, props, ref);
                    return;
                  }
                  case REACT_PORTAL_TYPE:
                    throw new Error("Portals are not currently supported by the server renderer. Render them conditionally so that they only appear on the client render.");
                  case REACT_LAZY_TYPE: {
                    var lazyNode = node;
                    var payload = lazyNode._payload;
                    var init = lazyNode._init;
                    var resolvedNode;
                    {
                      try {
                        resolvedNode = init(payload);
                      } catch (x) {
                        if (typeof x === "object" && x !== null && typeof x.then === "function") {
                          pushBuiltInComponentStackInDEV(task, "Lazy");
                        }
                        throw x;
                      }
                    }
                    renderNodeDestructive(request, task, resolvedNode);
                    return;
                  }
                }
                if (isArray(node)) {
                  renderChildrenArray(request, task, node);
                  return;
                }
                var iteratorFn = getIteratorFn(node);
                if (iteratorFn) {
                  {
                    validateIterable(node, iteratorFn);
                  }
                  var iterator = iteratorFn.call(node);
                  if (iterator) {
                    var step = iterator.next();
                    if (!step.done) {
                      var children = [];
                      do {
                        children.push(step.value);
                        step = iterator.next();
                      } while (!step.done);
                      renderChildrenArray(request, task, children);
                      return;
                    }
                    return;
                  }
                }
                var childString = Object.prototype.toString.call(node);
                throw new Error("Objects are not valid as a React child (found: " + (childString === "[object Object]" ? "object with keys {" + Object.keys(node).join(", ") + "}" : childString) + "). If you meant to render a collection of children, use an array instead.");
              }
              if (typeof node === "string") {
                var segment = task.blockedSegment;
                segment.lastPushedText = pushTextInstance(task.blockedSegment.chunks, node, request.responseState, segment.lastPushedText);
                return;
              }
              if (typeof node === "number") {
                var _segment = task.blockedSegment;
                _segment.lastPushedText = pushTextInstance(task.blockedSegment.chunks, "" + node, request.responseState, _segment.lastPushedText);
                return;
              }
              {
                if (typeof node === "function") {
                  error("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
                }
              }
            }
            function renderChildrenArray(request, task, children) {
              var totalChildren = children.length;
              for (var i = 0; i < totalChildren; i++) {
                var prevTreeContext = task.treeContext;
                task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i);
                try {
                  renderNode(request, task, children[i]);
                } finally {
                  task.treeContext = prevTreeContext;
                }
              }
            }
            function spawnNewSuspendedTask(request, task, x) {
              var segment = task.blockedSegment;
              var insertionIndex = segment.chunks.length;
              var newSegment = createPendingSegment(
                request,
                insertionIndex,
                null,
                segment.formatContext,
                // Adopt the parent segment's leading text embed
                segment.lastPushedText,
                // Assume we are text embedded at the trailing edge
                true
              );
              segment.children.push(newSegment);
              segment.lastPushedText = false;
              var newTask = createTask(request, task.node, task.blockedBoundary, newSegment, task.abortSet, task.legacyContext, task.context, task.treeContext);
              {
                if (task.componentStack !== null) {
                  newTask.componentStack = task.componentStack.parent;
                }
              }
              var ping = newTask.ping;
              x.then(ping, ping);
            }
            function renderNode(request, task, node) {
              var previousFormatContext = task.blockedSegment.formatContext;
              var previousLegacyContext = task.legacyContext;
              var previousContext = task.context;
              var previousComponentStack = null;
              {
                previousComponentStack = task.componentStack;
              }
              try {
                return renderNodeDestructive(request, task, node);
              } catch (x) {
                resetHooksState();
                if (typeof x === "object" && x !== null && typeof x.then === "function") {
                  spawnNewSuspendedTask(request, task, x);
                  task.blockedSegment.formatContext = previousFormatContext;
                  task.legacyContext = previousLegacyContext;
                  task.context = previousContext;
                  switchContext(previousContext);
                  {
                    task.componentStack = previousComponentStack;
                  }
                  return;
                } else {
                  task.blockedSegment.formatContext = previousFormatContext;
                  task.legacyContext = previousLegacyContext;
                  task.context = previousContext;
                  switchContext(previousContext);
                  {
                    task.componentStack = previousComponentStack;
                  }
                  throw x;
                }
              }
            }
            function erroredTask(request, boundary, segment, error2) {
              var errorDigest = logRecoverableError(request, error2);
              if (boundary === null) {
                fatalError(request, error2);
              } else {
                boundary.pendingTasks--;
                if (!boundary.forceClientRender) {
                  boundary.forceClientRender = true;
                  boundary.errorDigest = errorDigest;
                  {
                    captureBoundaryErrorDetailsDev(boundary, error2);
                  }
                  if (boundary.parentFlushed) {
                    request.clientRenderedBoundaries.push(boundary);
                  }
                }
              }
              request.allPendingTasks--;
              if (request.allPendingTasks === 0) {
                var onAllReady = request.onAllReady;
                onAllReady();
              }
            }
            function abortTaskSoft(task) {
              var request = this;
              var boundary = task.blockedBoundary;
              var segment = task.blockedSegment;
              segment.status = ABORTED;
              finishedTask(request, boundary, segment);
            }
            function abortTask(task, request, reason) {
              var boundary = task.blockedBoundary;
              var segment = task.blockedSegment;
              segment.status = ABORTED;
              if (boundary === null) {
                request.allPendingTasks--;
                if (request.status !== CLOSED) {
                  request.status = CLOSED;
                  if (request.destination !== null) {
                    close(request.destination);
                  }
                }
              } else {
                boundary.pendingTasks--;
                if (!boundary.forceClientRender) {
                  boundary.forceClientRender = true;
                  var _error = reason === void 0 ? new Error("The render was aborted by the server without a reason.") : reason;
                  boundary.errorDigest = request.onError(_error);
                  {
                    var errorPrefix = "The server did not finish this Suspense boundary: ";
                    if (_error && typeof _error.message === "string") {
                      _error = errorPrefix + _error.message;
                    } else {
                      _error = errorPrefix + String(_error);
                    }
                    var previousTaskInDev = currentTaskInDEV;
                    currentTaskInDEV = task;
                    try {
                      captureBoundaryErrorDetailsDev(boundary, _error);
                    } finally {
                      currentTaskInDEV = previousTaskInDev;
                    }
                  }
                  if (boundary.parentFlushed) {
                    request.clientRenderedBoundaries.push(boundary);
                  }
                }
                boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
                  return abortTask(fallbackTask, request, reason);
                });
                boundary.fallbackAbortableTasks.clear();
                request.allPendingTasks--;
                if (request.allPendingTasks === 0) {
                  var onAllReady = request.onAllReady;
                  onAllReady();
                }
              }
            }
            function queueCompletedSegment(boundary, segment) {
              if (segment.chunks.length === 0 && segment.children.length === 1 && segment.children[0].boundary === null) {
                var childSegment = segment.children[0];
                childSegment.id = segment.id;
                childSegment.parentFlushed = true;
                if (childSegment.status === COMPLETED) {
                  queueCompletedSegment(boundary, childSegment);
                }
              } else {
                var completedSegments = boundary.completedSegments;
                completedSegments.push(segment);
              }
            }
            function finishedTask(request, boundary, segment) {
              if (boundary === null) {
                if (segment.parentFlushed) {
                  if (request.completedRootSegment !== null) {
                    throw new Error("There can only be one root segment. This is a bug in React.");
                  }
                  request.completedRootSegment = segment;
                }
                request.pendingRootTasks--;
                if (request.pendingRootTasks === 0) {
                  request.onShellError = noop$1;
                  var onShellReady = request.onShellReady;
                  onShellReady();
                }
              } else {
                boundary.pendingTasks--;
                if (boundary.forceClientRender)
                  ;
                else if (boundary.pendingTasks === 0) {
                  if (segment.parentFlushed) {
                    if (segment.status === COMPLETED) {
                      queueCompletedSegment(boundary, segment);
                    }
                  }
                  if (boundary.parentFlushed) {
                    request.completedBoundaries.push(boundary);
                  }
                  boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request);
                  boundary.fallbackAbortableTasks.clear();
                } else {
                  if (segment.parentFlushed) {
                    if (segment.status === COMPLETED) {
                      queueCompletedSegment(boundary, segment);
                      var completedSegments = boundary.completedSegments;
                      if (completedSegments.length === 1) {
                        if (boundary.parentFlushed) {
                          request.partialBoundaries.push(boundary);
                        }
                      }
                    }
                  }
                }
              }
              request.allPendingTasks--;
              if (request.allPendingTasks === 0) {
                var onAllReady = request.onAllReady;
                onAllReady();
              }
            }
            function retryTask(request, task) {
              var segment = task.blockedSegment;
              if (segment.status !== PENDING) {
                return;
              }
              switchContext(task.context);
              var prevTaskInDEV = null;
              {
                prevTaskInDEV = currentTaskInDEV;
                currentTaskInDEV = task;
              }
              try {
                renderNodeDestructive(request, task, task.node);
                pushSegmentFinale(segment.chunks, request.responseState, segment.lastPushedText, segment.textEmbedded);
                task.abortSet.delete(task);
                segment.status = COMPLETED;
                finishedTask(request, task.blockedBoundary, segment);
              } catch (x) {
                resetHooksState();
                if (typeof x === "object" && x !== null && typeof x.then === "function") {
                  var ping = task.ping;
                  x.then(ping, ping);
                } else {
                  task.abortSet.delete(task);
                  segment.status = ERRORED;
                  erroredTask(request, task.blockedBoundary, segment, x);
                }
              } finally {
                {
                  currentTaskInDEV = prevTaskInDEV;
                }
              }
            }
            function performWork(request) {
              if (request.status === CLOSED) {
                return;
              }
              var prevContext = getActiveContext();
              var prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = Dispatcher;
              var prevGetCurrentStackImpl;
              {
                prevGetCurrentStackImpl = ReactDebugCurrentFrame$1.getCurrentStack;
                ReactDebugCurrentFrame$1.getCurrentStack = getCurrentStackInDEV;
              }
              var prevResponseState = currentResponseState;
              setCurrentResponseState(request.responseState);
              try {
                var pingedTasks = request.pingedTasks;
                var i;
                for (i = 0; i < pingedTasks.length; i++) {
                  var task = pingedTasks[i];
                  retryTask(request, task);
                }
                pingedTasks.splice(0, i);
                if (request.destination !== null) {
                  flushCompletedQueues(request, request.destination);
                }
              } catch (error2) {
                logRecoverableError(request, error2);
                fatalError(request, error2);
              } finally {
                setCurrentResponseState(prevResponseState);
                ReactCurrentDispatcher$1.current = prevDispatcher;
                {
                  ReactDebugCurrentFrame$1.getCurrentStack = prevGetCurrentStackImpl;
                }
                if (prevDispatcher === Dispatcher) {
                  switchContext(prevContext);
                }
              }
            }
            function flushSubtree(request, destination, segment) {
              segment.parentFlushed = true;
              switch (segment.status) {
                case PENDING: {
                  var segmentID = segment.id = request.nextSegmentId++;
                  segment.lastPushedText = false;
                  segment.textEmbedded = false;
                  return writePlaceholder(destination, request.responseState, segmentID);
                }
                case COMPLETED: {
                  segment.status = FLUSHED;
                  var r = true;
                  var chunks = segment.chunks;
                  var chunkIdx = 0;
                  var children = segment.children;
                  for (var childIdx = 0; childIdx < children.length; childIdx++) {
                    var nextChild = children[childIdx];
                    for (; chunkIdx < nextChild.index; chunkIdx++) {
                      writeChunk(destination, chunks[chunkIdx]);
                    }
                    r = flushSegment(request, destination, nextChild);
                  }
                  for (; chunkIdx < chunks.length - 1; chunkIdx++) {
                    writeChunk(destination, chunks[chunkIdx]);
                  }
                  if (chunkIdx < chunks.length) {
                    r = writeChunkAndReturn(destination, chunks[chunkIdx]);
                  }
                  return r;
                }
                default: {
                  throw new Error("Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React.");
                }
              }
            }
            function flushSegment(request, destination, segment) {
              var boundary = segment.boundary;
              if (boundary === null) {
                return flushSubtree(request, destination, segment);
              }
              boundary.parentFlushed = true;
              if (boundary.forceClientRender) {
                writeStartClientRenderedSuspenseBoundary(destination, request.responseState, boundary.errorDigest, boundary.errorMessage, boundary.errorComponentStack);
                flushSubtree(request, destination, segment);
                return writeEndClientRenderedSuspenseBoundary(destination, request.responseState);
              } else if (boundary.pendingTasks > 0) {
                boundary.rootSegmentID = request.nextSegmentId++;
                if (boundary.completedSegments.length > 0) {
                  request.partialBoundaries.push(boundary);
                }
                var id = boundary.id = assignSuspenseBoundaryID(request.responseState);
                writeStartPendingSuspenseBoundary(destination, request.responseState, id);
                flushSubtree(request, destination, segment);
                return writeEndPendingSuspenseBoundary(destination, request.responseState);
              } else if (boundary.byteSize > request.progressiveChunkSize) {
                boundary.rootSegmentID = request.nextSegmentId++;
                request.completedBoundaries.push(boundary);
                writeStartPendingSuspenseBoundary(destination, request.responseState, boundary.id);
                flushSubtree(request, destination, segment);
                return writeEndPendingSuspenseBoundary(destination, request.responseState);
              } else {
                writeStartCompletedSuspenseBoundary(destination, request.responseState);
                var completedSegments = boundary.completedSegments;
                if (completedSegments.length !== 1) {
                  throw new Error("A previously unvisited boundary must have exactly one root segment. This is a bug in React.");
                }
                var contentSegment = completedSegments[0];
                flushSegment(request, destination, contentSegment);
                return writeEndCompletedSuspenseBoundary(destination, request.responseState);
              }
            }
            function flushClientRenderedBoundary(request, destination, boundary) {
              return writeClientRenderBoundaryInstruction(destination, request.responseState, boundary.id, boundary.errorDigest, boundary.errorMessage, boundary.errorComponentStack);
            }
            function flushSegmentContainer(request, destination, segment) {
              writeStartSegment(destination, request.responseState, segment.formatContext, segment.id);
              flushSegment(request, destination, segment);
              return writeEndSegment(destination, segment.formatContext);
            }
            function flushCompletedBoundary(request, destination, boundary) {
              var completedSegments = boundary.completedSegments;
              var i = 0;
              for (; i < completedSegments.length; i++) {
                var segment = completedSegments[i];
                flushPartiallyCompletedSegment(request, destination, boundary, segment);
              }
              completedSegments.length = 0;
              return writeCompletedBoundaryInstruction(destination, request.responseState, boundary.id, boundary.rootSegmentID);
            }
            function flushPartialBoundary(request, destination, boundary) {
              var completedSegments = boundary.completedSegments;
              var i = 0;
              for (; i < completedSegments.length; i++) {
                var segment = completedSegments[i];
                if (!flushPartiallyCompletedSegment(request, destination, boundary, segment)) {
                  i++;
                  completedSegments.splice(0, i);
                  return false;
                }
              }
              completedSegments.splice(0, i);
              return true;
            }
            function flushPartiallyCompletedSegment(request, destination, boundary, segment) {
              if (segment.status === FLUSHED) {
                return true;
              }
              var segmentID = segment.id;
              if (segmentID === -1) {
                var rootSegmentID = segment.id = boundary.rootSegmentID;
                if (rootSegmentID === -1) {
                  throw new Error("A root segment ID must have been assigned by now. This is a bug in React.");
                }
                return flushSegmentContainer(request, destination, segment);
              } else {
                flushSegmentContainer(request, destination, segment);
                return writeCompletedSegmentInstruction(destination, request.responseState, segmentID);
              }
            }
            function flushCompletedQueues(request, destination) {
              beginWriting();
              try {
                var completedRootSegment = request.completedRootSegment;
                if (completedRootSegment !== null && request.pendingRootTasks === 0) {
                  flushSegment(request, destination, completedRootSegment);
                  request.completedRootSegment = null;
                  writeCompletedRoot(destination, request.responseState);
                }
                var clientRenderedBoundaries = request.clientRenderedBoundaries;
                var i;
                for (i = 0; i < clientRenderedBoundaries.length; i++) {
                  var boundary = clientRenderedBoundaries[i];
                  if (!flushClientRenderedBoundary(request, destination, boundary)) {
                    request.destination = null;
                    i++;
                    clientRenderedBoundaries.splice(0, i);
                    return;
                  }
                }
                clientRenderedBoundaries.splice(0, i);
                var completedBoundaries = request.completedBoundaries;
                for (i = 0; i < completedBoundaries.length; i++) {
                  var _boundary = completedBoundaries[i];
                  if (!flushCompletedBoundary(request, destination, _boundary)) {
                    request.destination = null;
                    i++;
                    completedBoundaries.splice(0, i);
                    return;
                  }
                }
                completedBoundaries.splice(0, i);
                completeWriting(destination);
                beginWriting(destination);
                var partialBoundaries = request.partialBoundaries;
                for (i = 0; i < partialBoundaries.length; i++) {
                  var _boundary2 = partialBoundaries[i];
                  if (!flushPartialBoundary(request, destination, _boundary2)) {
                    request.destination = null;
                    i++;
                    partialBoundaries.splice(0, i);
                    return;
                  }
                }
                partialBoundaries.splice(0, i);
                var largeBoundaries = request.completedBoundaries;
                for (i = 0; i < largeBoundaries.length; i++) {
                  var _boundary3 = largeBoundaries[i];
                  if (!flushCompletedBoundary(request, destination, _boundary3)) {
                    request.destination = null;
                    i++;
                    largeBoundaries.splice(0, i);
                    return;
                  }
                }
                largeBoundaries.splice(0, i);
              } finally {
                completeWriting(destination);
                if (request.allPendingTasks === 0 && request.pingedTasks.length === 0 && request.clientRenderedBoundaries.length === 0 && request.completedBoundaries.length === 0) {
                  {
                    if (request.abortableTasks.size !== 0) {
                      error("There was still abortable task at the root when we closed. This is a bug in React.");
                    }
                  }
                  close(destination);
                }
              }
            }
            function startWork(request) {
              scheduleWork(function() {
                return performWork(request);
              });
            }
            function startFlowing(request, destination) {
              if (request.status === CLOSING) {
                request.status = CLOSED;
                closeWithError(destination, request.fatalError);
                return;
              }
              if (request.status === CLOSED) {
                return;
              }
              if (request.destination !== null) {
                return;
              }
              request.destination = destination;
              try {
                flushCompletedQueues(request, destination);
              } catch (error2) {
                logRecoverableError(request, error2);
                fatalError(request, error2);
              }
            }
            function abort(request, reason) {
              try {
                var abortableTasks = request.abortableTasks;
                abortableTasks.forEach(function(task) {
                  return abortTask(task, request, reason);
                });
                abortableTasks.clear();
                if (request.destination !== null) {
                  flushCompletedQueues(request, request.destination);
                }
              } catch (error2) {
                logRecoverableError(request, error2);
                fatalError(request, error2);
              }
            }
            function renderToReadableStream(children, options) {
              return new Promise(function(resolve, reject) {
                var onFatalError;
                var onAllReady;
                var allReady = new Promise(function(res, rej) {
                  onAllReady = res;
                  onFatalError = rej;
                });
                function onShellReady() {
                  var stream = new ReadableStream(
                    {
                      type: "bytes",
                      pull: function(controller) {
                        startFlowing(request, controller);
                      },
                      cancel: function(reason) {
                        abort(request);
                      }
                    },
                    // $FlowFixMe size() methods are not allowed on byte streams.
                    {
                      highWaterMark: 0
                    }
                  );
                  stream.allReady = allReady;
                  resolve(stream);
                }
                function onShellError(error2) {
                  allReady.catch(function() {
                  });
                  reject(error2);
                }
                var request = createRequest(children, createResponseState(options ? options.identifierPrefix : void 0, options ? options.nonce : void 0, options ? options.bootstrapScriptContent : void 0, options ? options.bootstrapScripts : void 0, options ? options.bootstrapModules : void 0), createRootFormatContext(options ? options.namespaceURI : void 0), options ? options.progressiveChunkSize : void 0, options ? options.onError : void 0, onAllReady, onShellReady, onShellError, onFatalError);
                if (options && options.signal) {
                  var signal = options.signal;
                  var listener = function() {
                    abort(request, signal.reason);
                    signal.removeEventListener("abort", listener);
                  };
                  signal.addEventListener("abort", listener);
                }
                startWork(request);
              });
            }
            exports.renderToReadableStream = renderToReadableStream;
            exports.version = ReactVersion;
          })();
        }
      }
    });
  
    // node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/server.browser.js
    var require_server_browser = __commonJS({
      "node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/server.browser.js"(exports) {
        "use strict";
        init_modules_watch_stub();
        var l;
        var s;
        if (false) {
          l = null;
          s = null;
        } else {
          l = require_react_dom_server_legacy_browser_development();
          s = require_react_dom_server_browser_development();
        }
        exports.version = l.version;
        exports.renderToString = l.renderToString;
        exports.renderToStaticMarkup = l.renderToStaticMarkup;
        exports.renderToNodeStream = l.renderToNodeStream;
        exports.renderToStaticNodeStream = l.renderToStaticNodeStream;
        exports.renderToReadableStream = s.renderToReadableStream;
      }
    });
  
    // src/index.js
    init_modules_watch_stub();
    var import_react2 = __toESM(require_react());
    var import_server = __toESM(require_server_browser());
  
    // src/app.js
    init_modules_watch_stub();
    var import_react = __toESM(require_react());
    var App = () => /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("title", null, "My Cool Site"), /* @__PURE__ */ import_react.default.createElement("link", { href: "https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css", rel: "stylesheet" }), /* @__PURE__ */ import_react.default.createElement("body", { className: "bg-gray-200 w-full h-screen flex items-center justify-center" }), /* @__PURE__ */ import_react.default.createElement("div", { class: "max-w-sm mx-auto flex p-6 bg-white rounded-lg shadow-xl" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h4", { class: "text-xl text-gray-900 leading-tight" }, "Hello!"))));
    var app_default = App;
  
    // src/index.js
    var constructHTML = (app) => {
      return `
      <!doctype html>
      <html>
        <body>
          <div id="content">${app}</div>
        </body>
      </html>
    `;
    };
    var handleRequest = async (request) => {
      const headers = { "Content-Type": "text/html; charset=utf-8" };
      const app = import_server.default.renderToString(/* @__PURE__ */ import_react2.default.createElement(app_default, null));
      const html = constructHTML(app);
      return new Response(html, { status: 200, headers });
    };
    addEventListener("fetch", (event) => {
      event.respondWith(handleRequest(event.request));
    });
  })();
  /*! Bundled license information:
  
  react/cjs/react.development.js:
    (**
     * @license React
     * react.development.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     *)
  
  react-dom/cjs/react-dom-server-legacy.browser.development.js:
    (**
     * @license React
     * react-dom-server-legacy.browser.development.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     *)
  
  react-dom/cjs/react-dom-server.browser.development.js:
    (**
     * @license React
     * react-dom-server.browser.development.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     *)
  */
  //# sourceMappingURL=index.js.map
  