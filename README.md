<div align="center">
  <a href="https://winterjs.org" target="_blank">
    <picture>
      <source srcset="https://raw.githubusercontent.com/wasmerio/winterjs/main/assets/logo.png"  media="(prefers-color-scheme: dark)">
      <img width="128" src="https://raw.githubusercontent.com/wasmerio/winterjs/main/assets/logo.png" alt="Wasmer logo">
    </picture>
  </a>
</div>

# WinterJS

A *blazing-fast* JavaScript server that runs Service Workers scripts according to the [Winter Community Group specification](https://wintercg.org/).

**WinterJS is able to handle up to 100,000 reqs/s in a single laptop** (see [Benchmark](./benchmark)).

> Note: WinterJS is not officially endorsed by WinterCG, despite sharing "Winter" in their name. There are many [runtimes supporting WinterCG](https://runtime-keys.proposal.wintercg.org/), WinterJS being one among those.

## Running WinterJS with Wasmer

The WinterJS server is published in Wasmer as [`wasmer/winterjs`](https://wasmer.io/wasmer/winterjs).

You can run the HTTP server locally with:

```shell
wasmer run wasmer/winterjs --net --mapdir=tests:tests tests/simple.js
```

Where `simple.js` is:

```js
addEventListener('fetch', (req) => {
  req.respondWith(new Response('hello'));
});
```

## Running WinterJS Natively

You can run WinterJS natively by simply doing

```shell
cargo run -- tests/simple.js
```

And then access the server in https://localhost:8080/

# How WinterJS works

WinterJS is powered by [SpiderMonkey](https://spidermonkey.dev/), [Spiderfire](https://github.com/Redfire75369/spiderfire) and [hyper](https://hyper.rs/)
to bring a new level of awesomeness to your Javascript apps.

WinterJS is using the [WASIX](https://wasix.org) standard to compile to WebAssembly. Please note that compiling to WASIX is currently a complex process. We recommend using precompiled versions from [`wasmer/winterjs`](https://wasmer.io/wasmer/winterjs), but please open an issue if you need to compile to WASIX locally.

## Limitations

WinterJS is fully compliant with the WinterCG spec, although the runtime itself is still a work in progress.
It is not recommended to use WinterJS in production yet.
For more information, see the API Compatibility section below.

# WinterCG API Compatibility

This section will be updated as APIs are added/fixed.
If an API is missing from this section, that means that it is still not implemented.

The following words are used to describe the status of an API:

* ✅ Stable - The API is implemented and fully compliant with the spec. This does not account for potential undiscovered implementation errors in the native code.
* 🔶 Partial - The API is implemented but not fully compliant with the spec and/or there are known limitations.
* ❌ Pending - The API is not implemented yet.

|API|Status|Notes|
|:-:|:-:|:--|
|`console`|✅ Stable|
|`fetch`|✅ Stable|
|`URL`|✅ Stable|
|`URLSearchParams`|✅ Stable|
|`Request`|✅ Stable|
|`Headers`|✅ Stable|
|`Response`|✅ Stable|
|`Blob`|✅ Stable|
|`File`|✅ Stable|
|`FormData`|✅ Stable|
|`TextDecoder`|✅ Stable|
|`TextDecoderStream`|✅ Stable|
|`TextEncoder`|✅ Stable|
|`TextEncoderStream`|✅ Stable|
|`ReadableStream` and supporting types|✅ Stable|
|`WritableStream` and supporting types|✅ Stable|
|`TransformStream` and supporting types|🔶 Partial|Back-pressure is not implemented
|`atob`|✅ Stable|
|`btoa`|✅ Stable|
|`performance.now()`|✅ Stable|
|`performance.timeOrigin`|✅ Stable|
|`crypto`|✅ Stable|
|`crypto.subtle`|🔶 Partial|Only HMAC, MD5 and SHA algorithms are supported

# Other supported APIs

The following (non-WinterCG) APIs are implemented and accessible in WinterJS:

|API|Status|Notes|
|:-:|:-:|:--|
|[Service Workers Caches API](https://www.w3.org/TR/service-workers/#cache-objects)|✅ Stable|Accessible via `caches`. `caches.default` (similar to [Cloudflare workers](https://developers.cloudflare.com/workers/runtime-apis/cache/#accessing-cache)) is also available.<br/>The current implementation is memory-backed, and cached responses will *not* persist between multiple runs of WinterJS.
