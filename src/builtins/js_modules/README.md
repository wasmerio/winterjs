## Overview

Modules written in js, ts can be used in modules or made available in the global scope.


## How to use

1. Add code in js or ts under modules directory.
2. Create or update the `js_modules/__types/**.d.ts` file with the command `npx tsc src/builtins/js_modules/modules/*.ts --declaration --emitDeclarationOsrc/builtins/js_modules/__types`
3. Add a `declare module` to the `__types/_declareModules.ts` file to allow type checks when importing with an arbitrary path.
4. Finally, if the module needs to be used in the global scope, assign the module added to globals.ts.

## Details

### Assign Global Object

The File `js_modules/modules/**.ts` exports objects as follows:

```ts
const GLOBAL_MODULES = {
  Event,
  EventTarget,
};
export default GLOBAL_MODULES;
export { Event, EventTarget };
```

Next, assign to `globalThis` in the file `js_modules/globals.ts`.

```ts
import Event from 'winterjs:event';

Object.assign(globalThis, { ...Event });
```

As a result, it is available without import.

```ts
// import Event from 'winterjs:event';

const event = new Event('demo')
```


### Use as js modules

If the file `js_modules/modules/**.ts` exports objects, you can use js modules as follows:

```ts
export { Event, EventTarget };
```

```ts
import Event from 'winterjs:event';

const event = new Event('demo')
```

### Why do we need d.ts files?

Because the exoprt js file will be registered in runtime, ready to be used as a js module.
Typescript doesn't know which module it is, it's necessary to link the registered module to the type.



