import * as path from "../../../path/mod";
import Module from "../../module";

const modulePath = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "./cjs_import"
);
Module._load(modulePath, null, true);
