// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
//
// Adapted from Node.js. Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// These are simplified versions of the "real" errors in Node.
import { nextTick } from "../_next_tick";
class NodeFalsyValueRejectionError extends Error {
  reason;
  code = "ERR_FALSY_VALUE_REJECTION";
  constructor(reason) {
    super("Promise was rejected with falsy value");
    this.reason = reason;
  }
}
class NodeInvalidArgTypeError extends TypeError {
  code = "ERR_INVALID_ARG_TYPE";
  constructor(argumentName) {
    super(`The ${argumentName} argument must be of type function.`);
  }
}
function callbackify(original) {
  if (typeof original !== "function") {
    throw new NodeInvalidArgTypeError('"original"');
  }
  const callbackified = function (...args) {
    const maybeCb = args.pop();
    if (typeof maybeCb !== "function") {
      throw new NodeInvalidArgTypeError("last");
    }
    const cb = (...args) => {
      maybeCb.apply(this, args);
    };
    original.apply(this, args).then(
      (ret) => {
        nextTick(cb.bind(this, null, ret));
      },
      (rej) => {
        rej = rej || new NodeFalsyValueRejectionError(rej);
        nextTick(cb.bind(this, rej));
      }
    );
  };
  const descriptors = Object.getOwnPropertyDescriptors(original);
  // It is possible to manipulate a functions `length` or `name` property. This
  // guards against the manipulation.
  if (typeof descriptors.length.value === "number") {
    descriptors.length.value++;
  }
  if (typeof descriptors.name.value === "string") {
    descriptors.name.value += "Callbackified";
  }
  Object.defineProperties(callbackified, descriptors);
  return callbackified;
}
export { callbackify };
