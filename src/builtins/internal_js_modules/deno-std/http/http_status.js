// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Contains the enum {@linkcode Status} which enumerates standard HTTP status
 * codes and provides several type guards for handling status codes with type
 * safety.
 *
 * @example
 * ```ts
 * import {
 *   Status,
 *   STATUS_TEXT,
 * } from "https://deno.land/std@$STD_VERSION/http/http_status";
 *
 * console.log(Status.NotFound); //=> 404
 * console.log(STATUS_TEXT[Status.NotFound]); //=> "Not Found"
 * ```
 *
 * ```ts
 * import { isErrorStatus } from "https://deno.land/std@$STD_VERSION/http/http_status";
 *
 * const res = await fetch("https://example.com/");
 *
 * if (isErrorStatus(res.status)) {
 *   // error handling here...
 * }
 * ```
 *
 * @module
 */
/** Standard HTTP status codes. */
export var Status;
(function (Status) {
  /** RFC 7231, 6.2.1 */
  Status[(Status["Continue"] = 100)] = "Continue";
  /** RFC 7231, 6.2.2 */
  Status[(Status["SwitchingProtocols"] = 101)] = "SwitchingProtocols";
  /** RFC 2518, 10.1 */
  Status[(Status["Processing"] = 102)] = "Processing";
  /** RFC 8297 **/
  Status[(Status["EarlyHints"] = 103)] = "EarlyHints";
  /** RFC 7231, 6.3.1 */
  Status[(Status["OK"] = 200)] = "OK";
  /** RFC 7231, 6.3.2 */
  Status[(Status["Created"] = 201)] = "Created";
  /** RFC 7231, 6.3.3 */
  Status[(Status["Accepted"] = 202)] = "Accepted";
  /** RFC 7231, 6.3.4 */
  Status[(Status["NonAuthoritativeInfo"] = 203)] = "NonAuthoritativeInfo";
  /** RFC 7231, 6.3.5 */
  Status[(Status["NoContent"] = 204)] = "NoContent";
  /** RFC 7231, 6.3.6 */
  Status[(Status["ResetContent"] = 205)] = "ResetContent";
  /** RFC 7233, 4.1 */
  Status[(Status["PartialContent"] = 206)] = "PartialContent";
  /** RFC 4918, 11.1 */
  Status[(Status["MultiStatus"] = 207)] = "MultiStatus";
  /** RFC 5842, 7.1 */
  Status[(Status["AlreadyReported"] = 208)] = "AlreadyReported";
  /** RFC 3229, 10.4.1 */
  Status[(Status["IMUsed"] = 226)] = "IMUsed";
  /** RFC 7231, 6.4.1 */
  Status[(Status["MultipleChoices"] = 300)] = "MultipleChoices";
  /** RFC 7231, 6.4.2 */
  Status[(Status["MovedPermanently"] = 301)] = "MovedPermanently";
  /** RFC 7231, 6.4.3 */
  Status[(Status["Found"] = 302)] = "Found";
  /** RFC 7231, 6.4.4 */
  Status[(Status["SeeOther"] = 303)] = "SeeOther";
  /** RFC 7232, 4.1 */
  Status[(Status["NotModified"] = 304)] = "NotModified";
  /** RFC 7231, 6.4.5 */
  Status[(Status["UseProxy"] = 305)] = "UseProxy";
  /** RFC 7231, 6.4.7 */
  Status[(Status["TemporaryRedirect"] = 307)] = "TemporaryRedirect";
  /** RFC 7538, 3 */
  Status[(Status["PermanentRedirect"] = 308)] = "PermanentRedirect";
  /** RFC 7231, 6.5.1 */
  Status[(Status["BadRequest"] = 400)] = "BadRequest";
  /** RFC 7235, 3.1 */
  Status[(Status["Unauthorized"] = 401)] = "Unauthorized";
  /** RFC 7231, 6.5.2 */
  Status[(Status["PaymentRequired"] = 402)] = "PaymentRequired";
  /** RFC 7231, 6.5.3 */
  Status[(Status["Forbidden"] = 403)] = "Forbidden";
  /** RFC 7231, 6.5.4 */
  Status[(Status["NotFound"] = 404)] = "NotFound";
  /** RFC 7231, 6.5.5 */
  Status[(Status["MethodNotAllowed"] = 405)] = "MethodNotAllowed";
  /** RFC 7231, 6.5.6 */
  Status[(Status["NotAcceptable"] = 406)] = "NotAcceptable";
  /** RFC 7235, 3.2 */
  Status[(Status["ProxyAuthRequired"] = 407)] = "ProxyAuthRequired";
  /** RFC 7231, 6.5.7 */
  Status[(Status["RequestTimeout"] = 408)] = "RequestTimeout";
  /** RFC 7231, 6.5.8 */
  Status[(Status["Conflict"] = 409)] = "Conflict";
  /** RFC 7231, 6.5.9 */
  Status[(Status["Gone"] = 410)] = "Gone";
  /** RFC 7231, 6.5.10 */
  Status[(Status["LengthRequired"] = 411)] = "LengthRequired";
  /** RFC 7232, 4.2 */
  Status[(Status["PreconditionFailed"] = 412)] = "PreconditionFailed";
  /** RFC 7231, 6.5.11 */
  Status[(Status["RequestEntityTooLarge"] = 413)] = "RequestEntityTooLarge";
  /** RFC 7231, 6.5.12 */
  Status[(Status["RequestURITooLong"] = 414)] = "RequestURITooLong";
  /** RFC 7231, 6.5.13 */
  Status[(Status["UnsupportedMediaType"] = 415)] = "UnsupportedMediaType";
  /** RFC 7233, 4.4 */
  Status[(Status["RequestedRangeNotSatisfiable"] = 416)] =
    "RequestedRangeNotSatisfiable";
  /** RFC 7231, 6.5.14 */
  Status[(Status["ExpectationFailed"] = 417)] = "ExpectationFailed";
  /** RFC 7168, 2.3.3 */
  Status[(Status["Teapot"] = 418)] = "Teapot";
  /** RFC 7540, 9.1.2 */
  Status[(Status["MisdirectedRequest"] = 421)] = "MisdirectedRequest";
  /** RFC 4918, 11.2 */
  Status[(Status["UnprocessableEntity"] = 422)] = "UnprocessableEntity";
  /** RFC 4918, 11.3 */
  Status[(Status["Locked"] = 423)] = "Locked";
  /** RFC 4918, 11.4 */
  Status[(Status["FailedDependency"] = 424)] = "FailedDependency";
  /** RFC 8470, 5.2 */
  Status[(Status["TooEarly"] = 425)] = "TooEarly";
  /** RFC 7231, 6.5.15 */
  Status[(Status["UpgradeRequired"] = 426)] = "UpgradeRequired";
  /** RFC 6585, 3 */
  Status[(Status["PreconditionRequired"] = 428)] = "PreconditionRequired";
  /** RFC 6585, 4 */
  Status[(Status["TooManyRequests"] = 429)] = "TooManyRequests";
  /** RFC 6585, 5 */
  Status[(Status["RequestHeaderFieldsTooLarge"] = 431)] =
    "RequestHeaderFieldsTooLarge";
  /** RFC 7725, 3 */
  Status[(Status["UnavailableForLegalReasons"] = 451)] =
    "UnavailableForLegalReasons";
  /** RFC 7231, 6.6.1 */
  Status[(Status["InternalServerError"] = 500)] = "InternalServerError";
  /** RFC 7231, 6.6.2 */
  Status[(Status["NotImplemented"] = 501)] = "NotImplemented";
  /** RFC 7231, 6.6.3 */
  Status[(Status["BadGateway"] = 502)] = "BadGateway";
  /** RFC 7231, 6.6.4 */
  Status[(Status["ServiceUnavailable"] = 503)] = "ServiceUnavailable";
  /** RFC 7231, 6.6.5 */
  Status[(Status["GatewayTimeout"] = 504)] = "GatewayTimeout";
  /** RFC 7231, 6.6.6 */
  Status[(Status["HTTPVersionNotSupported"] = 505)] = "HTTPVersionNotSupported";
  /** RFC 2295, 8.1 */
  Status[(Status["VariantAlsoNegotiates"] = 506)] = "VariantAlsoNegotiates";
  /** RFC 4918, 11.5 */
  Status[(Status["InsufficientStorage"] = 507)] = "InsufficientStorage";
  /** RFC 5842, 7.2 */
  Status[(Status["LoopDetected"] = 508)] = "LoopDetected";
  /** RFC 2774, 7 */
  Status[(Status["NotExtended"] = 510)] = "NotExtended";
  /** RFC 6585, 6 */
  Status[(Status["NetworkAuthenticationRequired"] = 511)] =
    "NetworkAuthenticationRequired";
})(Status || (Status = {}));
/** A record of all the status codes text. */
export const STATUS_TEXT = {
  [Status.Accepted]: "Accepted",
  [Status.AlreadyReported]: "Already Reported",
  [Status.BadGateway]: "Bad Gateway",
  [Status.BadRequest]: "Bad Request",
  [Status.Conflict]: "Conflict",
  [Status.Continue]: "Continue",
  [Status.Created]: "Created",
  [Status.EarlyHints]: "Early Hints",
  [Status.ExpectationFailed]: "Expectation Failed",
  [Status.FailedDependency]: "Failed Dependency",
  [Status.Forbidden]: "Forbidden",
  [Status.Found]: "Found",
  [Status.GatewayTimeout]: "Gateway Timeout",
  [Status.Gone]: "Gone",
  [Status.HTTPVersionNotSupported]: "HTTP Version Not Supported",
  [Status.IMUsed]: "IM Used",
  [Status.InsufficientStorage]: "Insufficient Storage",
  [Status.InternalServerError]: "Internal Server Error",
  [Status.LengthRequired]: "Length Required",
  [Status.Locked]: "Locked",
  [Status.LoopDetected]: "Loop Detected",
  [Status.MethodNotAllowed]: "Method Not Allowed",
  [Status.MisdirectedRequest]: "Misdirected Request",
  [Status.MovedPermanently]: "Moved Permanently",
  [Status.MultiStatus]: "Multi Status",
  [Status.MultipleChoices]: "Multiple Choices",
  [Status.NetworkAuthenticationRequired]: "Network Authentication Required",
  [Status.NoContent]: "No Content",
  [Status.NonAuthoritativeInfo]: "Non Authoritative Info",
  [Status.NotAcceptable]: "Not Acceptable",
  [Status.NotExtended]: "Not Extended",
  [Status.NotFound]: "Not Found",
  [Status.NotImplemented]: "Not Implemented",
  [Status.NotModified]: "Not Modified",
  [Status.OK]: "OK",
  [Status.PartialContent]: "Partial Content",
  [Status.PaymentRequired]: "Payment Required",
  [Status.PermanentRedirect]: "Permanent Redirect",
  [Status.PreconditionFailed]: "Precondition Failed",
  [Status.PreconditionRequired]: "Precondition Required",
  [Status.Processing]: "Processing",
  [Status.ProxyAuthRequired]: "Proxy Auth Required",
  [Status.RequestEntityTooLarge]: "Request Entity Too Large",
  [Status.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
  [Status.RequestTimeout]: "Request Timeout",
  [Status.RequestURITooLong]: "Request URI Too Long",
  [Status.RequestedRangeNotSatisfiable]: "Requested Range Not Satisfiable",
  [Status.ResetContent]: "Reset Content",
  [Status.SeeOther]: "See Other",
  [Status.ServiceUnavailable]: "Service Unavailable",
  [Status.SwitchingProtocols]: "Switching Protocols",
  [Status.Teapot]: "I'm a teapot",
  [Status.TemporaryRedirect]: "Temporary Redirect",
  [Status.TooEarly]: "Too Early",
  [Status.TooManyRequests]: "Too Many Requests",
  [Status.Unauthorized]: "Unauthorized",
  [Status.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
  [Status.UnprocessableEntity]: "Unprocessable Entity",
  [Status.UnsupportedMediaType]: "Unsupported Media Type",
  [Status.UpgradeRequired]: "Upgrade Required",
  [Status.UseProxy]: "Use Proxy",
  [Status.VariantAlsoNegotiates]: "Variant Also Negotiates",
};
/** A type guard that determines if the status code is informational. */
export function isInformationalStatus(status) {
  return status >= 100 && status < 200;
}
/** A type guard that determines if the status code is successful. */
export function isSuccessfulStatus(status) {
  return status >= 200 && status < 300;
}
/** A type guard that determines if the status code is a redirection. */
export function isRedirectStatus(status) {
  return status >= 300 && status < 400;
}
/** A type guard that determines if the status code is a client error. */
export function isClientErrorStatus(status) {
  return status >= 400 && status < 500;
}
/** A type guard that determines if the status code is a server error. */
export function isServerErrorStatus(status) {
  return status >= 500 && status < 600;
}
/** A type guard that determines if the status code is an error. */
export function isErrorStatus(status) {
  return status >= 400 && status < 600;
}
