type PromiseHook = (promise: Promise<unknown>) => void;

declare module "__winterjs_core_" {
    function getPromiseState(promise: Promise<unknown>): number;

    function setPromiseHooks(
        init: PromiseHook,
        before: PromiseHook,
        after: PromiseHook,
        resolve: PromiseHook
    ): void;
}