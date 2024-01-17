# http-echo-plain

A simple http echo server that responds with information about the incoming
request.

The response format can be customized with:

* The `Accept` header (`application/json` or `text/html`)
* The `?format` query param
  - `json`
  - `html`
  - `echo` (returns request headers and body unmodified)

## Running locally

```bash
wasmer run wasmer/winterjs --net --mapdir=src:src -- src/index.js --watch
```

This example is also deployed to Wasmer Edge at: https://httpinfo-winterjs.wasmer.app .
