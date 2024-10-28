// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { Buffer } from "../../buffer";
import { ERR_INVALID_ARG_TYPE } from "../errors";
import { isArrayBufferView } from "../util/types";
import { notImplemented } from "../../_utils";
export class X509Certificate {
  constructor(buffer) {
    if (typeof buffer === "string") {
      buffer = Buffer.from(buffer);
    }
    if (!isArrayBufferView(buffer)) {
      throw new ERR_INVALID_ARG_TYPE(
        "buffer",
        ["string", "Buffer", "TypedArray", "DataView"],
        buffer
      );
    }
    notImplemented("crypto.X509Certificate");
  }
  get ca() {
    notImplemented("crypto.X509Certificate.prototype.ca");
    return false;
  }
  checkEmail(_email, _options) {
    notImplemented("crypto.X509Certificate.prototype.checkEmail");
  }
  checkHost(_name, _options) {
    notImplemented("crypto.X509Certificate.prototype.checkHost");
  }
  checkIP(_ip) {
    notImplemented("crypto.X509Certificate.prototype.checkIP");
  }
  checkIssued(_otherCert) {
    notImplemented("crypto.X509Certificate.prototype.checkIssued");
  }
  checkPrivateKey(_privateKey) {
    notImplemented("crypto.X509Certificate.prototype.checkPrivateKey");
  }
  get fingerprint() {
    notImplemented("crypto.X509Certificate.prototype.fingerprint");
    return "";
  }
  get fingerprint256() {
    notImplemented("crypto.X509Certificate.prototype.fingerprint256");
    return "";
  }
  get fingerprint512() {
    notImplemented("crypto.X509Certificate.prototype.fingerprint512");
    return "";
  }
  get infoAccess() {
    notImplemented("crypto.X509Certificate.prototype.infoAccess");
    return "";
  }
  get issuer() {
    notImplemented("crypto.X509Certificate.prototype.issuer");
    return "";
  }
  get issuerCertificate() {
    notImplemented("crypto.X509Certificate.prototype.issuerCertificate");
    return {};
  }
  get keyUsage() {
    notImplemented("crypto.X509Certificate.prototype.keyUsage");
    return [];
  }
  get publicKey() {
    notImplemented("crypto.X509Certificate.prototype.publicKey");
    return {};
  }
  get raw() {
    notImplemented("crypto.X509Certificate.prototype.raw");
    return {};
  }
  get serialNumber() {
    notImplemented("crypto.X509Certificate.prototype.serialNumber");
    return "";
  }
  get subject() {
    notImplemented("crypto.X509Certificate.prototype.subject");
    return "";
  }
  get subjectAltName() {
    notImplemented("crypto.X509Certificate.prototype.subjectAltName");
    return "";
  }
  toJSON() {
    return this.toString();
  }
  toLegacyObject() {
    notImplemented("crypto.X509Certificate.prototype.toLegacyObject");
  }
  toString() {
    notImplemented("crypto.X509Certificate.prototype.toString");
  }
  get validFrom() {
    notImplemented("crypto.X509Certificate.prototype.validFrom");
    return "";
  }
  get validTo() {
    notImplemented("crypto.X509Certificate.prototype.validTo");
    return "";
  }
  verify(_publicKey) {
    notImplemented("crypto.X509Certificate.prototype.verify");
  }
}
export default {
  X509Certificate,
};
