# WinterJS

The JavaScript server that runs Service Workers according to the [Winter Community Group specification](https://wintercg.org/).


## Running WinterJS with Wasmer

The WinterJS server is published in Wasmer as [`wasmer/winter`](https://wasmer.io/wasmer/winter).

You can run the HTTP server locally with:

```shell
wasmer run wasmer/winter --net --mapdir=tests:tests tests/simple.js
```

Where `simple.js` is:

```js
addEventListener('fetch', (req) => {
  return "hello";
});
```

## Running WinterJS Natively

You can run WinterJS natively by simply doing

```shell
cargo run -- tests/simple.js
```

And then access the server in https://localhost:8080/

# How WasmerJS works

Wasmer Winter is powered by [SpiderMonkey](https://spidermonkey.dev/) and [Axum](https://github.com/tokio-rs/axum)
to bring a new level of awesomeness to your Javascript apps.

To compile the app to WebAssembly WinterJS is using the [WASIX](https://wasix.org) standard.
