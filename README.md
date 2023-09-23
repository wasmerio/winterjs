# Wasmer Winter

The JavaScript runtime that brings JavaScript to Wasmer Edge via the [Winter Community Group specification](https://wintercg.org/).

The application is [published in Wasmer as `wasmer/winter`](https://wasmer.io/wasmer/winter).

You can run the HTTP server locally with `wasmer run wasmer/winter --net --mapdir=tests:tests tests/simple.js`.

Where `simple.js` is:

```js
addEventListener('fetch', (req) => {
  return "hello";
});
```

And then access the server in https://localhost:8080/

## How it works

Wasmer Winter is powered by [SpiderMonkey](https://spidermonkey.dev/),
[WASIX](https://wasix.org) and [Axum](https://github.com/tokio-rs/axum)
to bring a new level of awesomeness to your Javascript apps.
