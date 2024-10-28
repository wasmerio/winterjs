import cp from "../child_process";
import * as path from "../../path/mod";

const script = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "infinite_loop.js"
);
const childProcess = cp.spawn(Deno.execPath(), ["run", script]);
childProcess.unref();
