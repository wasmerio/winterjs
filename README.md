<div align="center">
  <a href="https://winterjs.org" target="_blank">
    <picture>
      <source srcset="https://raw.githubusercontent.com/wasmerio/winterjs/main/assets/logo.png"  media="(prefers-color-scheme: dark)">
      <img width="300" src="https://raw.githubusercontent.com/wasmerio/winterjs/main/assets/logo.png" alt="Wasmer logo">
    </picture>
  </a>
</div>

# WinterJS

The JavaScript server that runs Service Workers according to the [Winter Community Group specification](https://wintercg.org/).

> Note: WinterJS is not officially endorsed by WinterCG, despite sharing "Winter" in their name. There are many [runtimes supporting WinterCG](https://runtime-keys.proposal.wintercg.org/), WinterJS being one among those

## Running WinterJS with Wasmer

The WinterJS server is published in Wasmer as [`wasmer/winterjs`](https://wasmer.io/wasmer/winterjs).

You can run the HTTP server locally with:

```shell
wasmer run wasmer/winterjs --net --mapdir=tests:tests tests/simple.js
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
