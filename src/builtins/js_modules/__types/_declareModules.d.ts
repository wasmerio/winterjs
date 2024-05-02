/**
 * NOTE:
 * This file is used to declare the module so that the types will be available when the `winterjs:` path is used.
 * Other files such as `[moduleName].d.ts` are automatically created by the tsc command.
 */

// declare module 'winterjs:[moduleName]' {
//   import moduleName = require('moduleName');
//   export = moduleName;
// }

declare module 'winterjs:event' {
  import event = require('event');
  export = event;
}
