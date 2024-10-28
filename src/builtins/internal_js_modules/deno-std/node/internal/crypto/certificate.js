// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "../../_utils";
export class Certificate {
  static Certificate = Certificate;
  static exportChallenge(_spkac, _encoding) {
    notImplemented("crypto.Certificate.exportChallenge");
  }
  static exportPublicKey(_spkac, _encoding) {
    notImplemented("crypto.Certificate.exportPublicKey");
  }
  static verifySpkac(_spkac, _encoding) {
    notImplemented("crypto.Certificate.verifySpkac");
  }
}
export default Certificate;
