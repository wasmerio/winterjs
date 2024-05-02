/**
 * NOTE:
 * This file is used to assign the global scope modules to the globalThis object.
 * You need to export all the objects you want to assign together using the `export default` keyword.
 *
 *
 * ex:
 * const GLOBAL_MODULES = {
 *  Event,
 *  EventTarget,
 * };
 * export default GLOBAL_MODULES;
 * export { Event, EventTarget }; <- when use it as standard js modules only.
 */

import Event from 'winterjs:event';

Object.assign(globalThis, { ...Event });
