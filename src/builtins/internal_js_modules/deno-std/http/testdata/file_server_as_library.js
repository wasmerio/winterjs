import { serve } from "../server";
import { serveFile } from "../file_server";
serve(
  (req) => {
    return serveFile(req, "./testdata/hello.html");
  },
  { port: 8000, onListen: () => console.log("Server running...") }
);
