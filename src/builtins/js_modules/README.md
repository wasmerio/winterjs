## Overview

Modules written in js, ts can be used in modules or made available in the global scope.


## How to use

1. Add code in js or ts under modules directory.
2. Create or update the `js_modules/__types/**.d.ts` file with the command `npx tsc src/builtins/js_modules/modules/*.ts --declaration --emitDeclarationOsrc/builtins/js_modules/__types`
3. Add a `declare module` to the `__types/_declareModules.ts` file to allow type checks when importing with an arbitrary path.
4. Finally, if the module needs to be used in the global scope, assign the module added to globals.ts.

