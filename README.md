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

> Note: WinterJS is not officially endorsed by WinterCG, despite sharing "Winter" in their name. There are many [runtimes supporting WinterCG](https://runtime-keys.proposal.wintercg.org/), WinterJS being one among those.

⚠️ WinterJS is **early, pre-release software**. It is currently not fully compliant with the WinterCG spec and there are missing APIs. Also, the runtime itself is still a work in progress, so you may encounter stability and performance issues. Is it not recommended to use WinterJS in production yet.
For more information, see the API Compatibility section below.

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

WinterJS is powered by [SpiderMonkey](https://spidermonkey.dev/), [Spiderfire](https://github.com/Redfire75369/spiderfire) and [hyper](https://hyper.rs/)
to bring a new level of awesomeness to your Javascript apps.

WinterJS is using the [WASIX](https://wasix.org) standard to compile to WebAssembly. Please note that compiling to WASIX is currently a complex process. We recommend using precompiled versions from [`wasmer/winterjs`](https://wasmer.io/wasmer/winterjs), but please open an issue if you need to compile to WASIX locally.

# WinterCG API Compatibility

This section will be updated as APIs are added/fixed.
If an API is missing from this section, that means that it is still not implemented.

The following words are used to describe the status of an API:

* Pending - The API is not implemented yet.
* Partial - The API is implemented but not fully compliant with the spec and/or there are known limitations.
* Stable - The API is implemented and fully compliant with the spec. This does not account for potential undiscovered implementation errors in the native code.

|API|Status|Notes|
|:-:|:-:|:--|
|`console`|Stable|
|`fetch`|Partial|`Request`, `Response` and `ReadableStream` need to be stabilized before `fetch` can be considered Stable
|`URL`|Stable|
|`URLSearchParams`|Stable|
|`Request`|Partial|`ReadableStream` needs to be stabilized before `Request` can be considered Stable<br/>Requests cannot be sent with `ReadableStream` bodies
|`Headers`|Stable|
|`Response`|Partial|`ReadableStream` needs to be stabilized before `Response` can be considered Stable.<br/>`Response.body` returns a Promise that resolves to a `ReadableStream` instead of returning a `ReadableStream` directly.
|`Blob`|Partial|`Blob.stream()` is not implemented yet
|`FormData`|Stable|
|`TextDecoder`|Partial|Only UTF-8 is supported|
|`TextEncoder`|Partial|Only UTF-8 is supported|
|`ReadableStream`|Partial|Creating `ReadableStream`s with `type: 'bytes'` is not supported yet.<br/>Returning `ReadableStream`s to native code is not supported yet.
|`atob`|Stable|
|`btoa`|Stable|
|`performance.now()`|Stable|
