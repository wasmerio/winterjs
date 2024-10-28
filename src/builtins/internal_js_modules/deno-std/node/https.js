// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
import { notImplemented } from "./_utils";
import { urlToHttpOptions } from "./internal/url";
import { Agent as HttpAgent, ClientRequest } from "./http";
export class Agent extends HttpAgent {}
export class Server {
  constructor() {
    notImplemented("https.Server.prototype.constructor");
  }
}
export function createServer() {
  notImplemented("https.createServer");
}
// Store additional root CAs.
// undefined means NODE_EXTRA_CA_CERTS is not checked yet.
// null means there's no additional root CAs.
let caCerts;
// deno-lint-ignore no-explicit-any
export function get(...args) {
  const req = request(args[0], args[1], args[2]);
  req.end();
  return req;
}
export const globalAgent = undefined;
/** HttpsClientRequest class loosely follows http.ClientRequest class API. */
class HttpsClientRequest extends ClientRequest {
  defaultProtocol = "https:";
  async _createCustomClient() {
    if (caCerts === null) {
      return undefined;
    }
    if (caCerts !== undefined) {
      return Deno.createHttpClient({ caCerts });
    }
    const status = await Deno.permissions.query({
      name: "env",
      variable: "NODE_EXTRA_CA_CERTS",
    });
    if (status.state !== "granted") {
      caCerts = null;
      return undefined;
    }
    const certFilename = Deno.env.get("NODE_EXTRA_CA_CERTS");
    if (!certFilename) {
      caCerts = null;
      return undefined;
    }
    const caCert = await Deno.readTextFile(certFilename);
    caCerts = [caCert];
    return Deno.createHttpClient({ caCerts });
  }
  _createSocket() {
    // deno-lint-ignore no-explicit-any
    return { authorized: true };
  }
}
// deno-lint-ignore no-explicit-any
export function request(...args) {
  let options = {};
  if (typeof args[0] === "string") {
    options = urlToHttpOptions(new URL(args.shift()));
  } else if (args[0] instanceof URL) {
    options = urlToHttpOptions(args.shift());
  }
  if (args[0] && typeof args[0] !== "function") {
    Object.assign(options, args.shift());
  }
  args.unshift(options);
  return new HttpsClientRequest(args[0], args[1]);
}
export default {
  Agent,
  Server,
  createServer,
  get,
  globalAgent,
  request,
};
