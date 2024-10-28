// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
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
// This module ports:
// - https://github.com/nodejs/node/blob/master/src/async_wrap-inl.h
// - https://github.com/nodejs/node/blob/master/src/async_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/async_wrap.h
export function registerDestroyHook(
// deno-lint-ignore no-explicit-any
_target, _asyncId, _prop) {
    // TODO(kt3k): implement actual procedures
}
export var constants;
(function (constants) {
    constants[constants["kInit"] = 0] = "kInit";
    constants[constants["kBefore"] = 1] = "kBefore";
    constants[constants["kAfter"] = 2] = "kAfter";
    constants[constants["kDestroy"] = 3] = "kDestroy";
    constants[constants["kPromiseResolve"] = 4] = "kPromiseResolve";
    constants[constants["kTotals"] = 5] = "kTotals";
    constants[constants["kCheck"] = 6] = "kCheck";
    constants[constants["kExecutionAsyncId"] = 7] = "kExecutionAsyncId";
    constants[constants["kTriggerAsyncId"] = 8] = "kTriggerAsyncId";
    constants[constants["kAsyncIdCounter"] = 9] = "kAsyncIdCounter";
    constants[constants["kDefaultTriggerAsyncId"] = 10] = "kDefaultTriggerAsyncId";
    constants[constants["kUsesExecutionAsyncResource"] = 11] = "kUsesExecutionAsyncResource";
    constants[constants["kStackLength"] = 12] = "kStackLength";
})(constants || (constants = {}));
const asyncHookFields = new Uint32Array(Object.keys(constants).length);
export { asyncHookFields as async_hook_fields };
// Increment the internal id counter and return the value.
export function newAsyncId() {
    return ++asyncIdFields[constants.kAsyncIdCounter];
}
export var UidFields;
(function (UidFields) {
    UidFields[UidFields["kExecutionAsyncId"] = 0] = "kExecutionAsyncId";
    UidFields[UidFields["kTriggerAsyncId"] = 1] = "kTriggerAsyncId";
    UidFields[UidFields["kAsyncIdCounter"] = 2] = "kAsyncIdCounter";
    UidFields[UidFields["kDefaultTriggerAsyncId"] = 3] = "kDefaultTriggerAsyncId";
    UidFields[UidFields["kUidFieldsCount"] = 4] = "kUidFieldsCount";
})(UidFields || (UidFields = {}));
const asyncIdFields = new Float64Array(Object.keys(UidFields).length);
// `kAsyncIdCounter` should start at `1` because that'll be the id the execution
// context during bootstrap.
asyncIdFields[UidFields.kAsyncIdCounter] = 1;
// `kDefaultTriggerAsyncId` should be `-1`, this indicates that there is no
// specified default value and it should fallback to the executionAsyncId.
// 0 is not used as the magic value, because that indicates a missing
// context which is different from a default context.
asyncIdFields[UidFields.kDefaultTriggerAsyncId] = -1;
export { asyncIdFields };
export var providerType;
(function (providerType) {
    providerType[providerType["NONE"] = 0] = "NONE";
    providerType[providerType["DIRHANDLE"] = 1] = "DIRHANDLE";
    providerType[providerType["DNSCHANNEL"] = 2] = "DNSCHANNEL";
    providerType[providerType["ELDHISTOGRAM"] = 3] = "ELDHISTOGRAM";
    providerType[providerType["FILEHANDLE"] = 4] = "FILEHANDLE";
    providerType[providerType["FILEHANDLECLOSEREQ"] = 5] = "FILEHANDLECLOSEREQ";
    providerType[providerType["FIXEDSIZEBLOBCOPY"] = 6] = "FIXEDSIZEBLOBCOPY";
    providerType[providerType["FSEVENTWRAP"] = 7] = "FSEVENTWRAP";
    providerType[providerType["FSREQCALLBACK"] = 8] = "FSREQCALLBACK";
    providerType[providerType["FSREQPROMISE"] = 9] = "FSREQPROMISE";
    providerType[providerType["GETADDRINFOREQWRAP"] = 10] = "GETADDRINFOREQWRAP";
    providerType[providerType["GETNAMEINFOREQWRAP"] = 11] = "GETNAMEINFOREQWRAP";
    providerType[providerType["HEAPSNAPSHOT"] = 12] = "HEAPSNAPSHOT";
    providerType[providerType["HTTP2SESSION"] = 13] = "HTTP2SESSION";
    providerType[providerType["HTTP2STREAM"] = 14] = "HTTP2STREAM";
    providerType[providerType["HTTP2PING"] = 15] = "HTTP2PING";
    providerType[providerType["HTTP2SETTINGS"] = 16] = "HTTP2SETTINGS";
    providerType[providerType["HTTPINCOMINGMESSAGE"] = 17] = "HTTPINCOMINGMESSAGE";
    providerType[providerType["HTTPCLIENTREQUEST"] = 18] = "HTTPCLIENTREQUEST";
    providerType[providerType["JSSTREAM"] = 19] = "JSSTREAM";
    providerType[providerType["JSUDPWRAP"] = 20] = "JSUDPWRAP";
    providerType[providerType["MESSAGEPORT"] = 21] = "MESSAGEPORT";
    providerType[providerType["PIPECONNECTWRAP"] = 22] = "PIPECONNECTWRAP";
    providerType[providerType["PIPESERVERWRAP"] = 23] = "PIPESERVERWRAP";
    providerType[providerType["PIPEWRAP"] = 24] = "PIPEWRAP";
    providerType[providerType["PROCESSWRAP"] = 25] = "PROCESSWRAP";
    providerType[providerType["PROMISE"] = 26] = "PROMISE";
    providerType[providerType["QUERYWRAP"] = 27] = "QUERYWRAP";
    providerType[providerType["SHUTDOWNWRAP"] = 28] = "SHUTDOWNWRAP";
    providerType[providerType["SIGNALWRAP"] = 29] = "SIGNALWRAP";
    providerType[providerType["STATWATCHER"] = 30] = "STATWATCHER";
    providerType[providerType["STREAMPIPE"] = 31] = "STREAMPIPE";
    providerType[providerType["TCPCONNECTWRAP"] = 32] = "TCPCONNECTWRAP";
    providerType[providerType["TCPSERVERWRAP"] = 33] = "TCPSERVERWRAP";
    providerType[providerType["TCPWRAP"] = 34] = "TCPWRAP";
    providerType[providerType["TTYWRAP"] = 35] = "TTYWRAP";
    providerType[providerType["UDPSENDWRAP"] = 36] = "UDPSENDWRAP";
    providerType[providerType["UDPWRAP"] = 37] = "UDPWRAP";
    providerType[providerType["SIGINTWATCHDOG"] = 38] = "SIGINTWATCHDOG";
    providerType[providerType["WORKER"] = 39] = "WORKER";
    providerType[providerType["WORKERHEAPSNAPSHOT"] = 40] = "WORKERHEAPSNAPSHOT";
    providerType[providerType["WRITEWRAP"] = 41] = "WRITEWRAP";
    providerType[providerType["ZLIB"] = 42] = "ZLIB";
})(providerType || (providerType = {}));
const kInvalidAsyncId = -1;
export class AsyncWrap {
    provider = providerType.NONE;
    asyncId = kInvalidAsyncId;
    constructor(provider) {
        this.provider = provider;
        this.getAsyncId();
    }
    getAsyncId() {
        this.asyncId = this.asyncId === kInvalidAsyncId
            ? newAsyncId()
            : this.asyncId;
        return this.asyncId;
    }
    getProviderType() {
        return this.provider;
    }
}
