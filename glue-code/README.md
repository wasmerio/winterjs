# WinterJS Glue Code

This package bridges the gap between WinterJS's native API and the Winter CG
API.

## Getting Started

You can use `npm` to build this project like any other TypeScript project.

```console
$ npm install
$ npm run build
> @wasmer/winterjs-glue-code@0.0.0 build
> node ./build.mjs && tsc
```

The `build` script will populate the `dist/` folder with a `index.js`
file containing all bundled code and several `*.d.ts` files defining the code's
public interface.

```console
$ ls dist
index.d.ts
index.js
...
```

There is also a `dev` script which will automatically recompile the JavaScript
bundle and re-generate type definitions whenever a file changes.

```console
$ npm run dev
> @wasmer/winterjs-glue-code@0.0.0 dev
> concurrently --kill-others "node ./build.mjs --watch" "tsc --watch"

[0] ESBuild watching...
[1]
1:18:02 pm - Starting compilation in watch mode...
[1]
[1]
[1] 1:18:02 pm - Found 0 errors. Watching for file changes.
```

## Type Definitions

Whenever a new WinterJS version is released, we should make a PR to the
[DefinitelyTyped][dt] repo to update the type definitions for `@types/winterjs`
and bump the version number.

That way downstream users can do `npm install --save-dev @types/winterjs` and
get correct type definitions out of the box.

[dt]: https://github.com/DefinitelyTyped/DefinitelyTyped
