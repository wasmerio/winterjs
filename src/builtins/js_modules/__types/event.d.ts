type DOMString = string;
type EventInit = {
    bubbles: Boolean;
    cancelable: Boolean;
    composed: Boolean;
};
type DOMHighResTimeStamp = number;
/**
 * @see: https://dom.spec.whatwg.org/#event
 */
declare class Event {
    readonly type: string;
    readonly target: EventTarget | null;
    readonly srcElement: EventTarget | null;
    readonly currentTarget: EventTarget | null;
    static readonly NONE = 0;
    static readonly CAPTURING_PHASE = 1;
    static readonly AT_TARGET = 2;
    static readonly BUBBLING_PHASE = 3;
    readonly eventPhase: number;
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    private isTrusted;
    readonly timeStamp: DOMHighResTimeStamp;
    private path;
    /**
     * flags
     */
    private stopPropagationFlag;
    private stopImmediatePropagationFlag;
    private canceledFlag;
    private inPassiveListenerFlag;
    private composedFlag;
    private initializedFlag;
    private dispatchFlag;
    constructor(type: DOMString, eventInitDict?: EventInit);
    composedPath(): EventTarget[];
    /**
     * The stopPropagation() method steps are to set this’s stop propagation flag.
     */
    stopPropagation(): void;
    /**
     * The cancelBubble getter steps are to return true if this’s stop propagation flag is set; otherwise false.
     */
    get cancelBubble(): boolean;
    /**
     * The cancelBubble setter steps are to set this’s stop propagation flag if the given value is true; otherwise do nothing.
     */
    set cancelBubble(value: boolean);
    /**
     * The stopImmediatePropagation() method steps are to set this’s stop propagation flag and this’s stop immediate propagation flag.
     */
    stopImmediatePropagation(): void;
    /**
     * The returnValue getter steps are to return false if this’s canceled flag is set; otherwise true.
     */
    get returnValue(): boolean;
    /**
     * The returnValue setter steps are to set the canceled flag with this if the given value is false; otherwise do nothing.
     */
    set returnValue(value: boolean);
    /**
     * The preventDefault() method steps are to set the canceled flag with this.
     */
    preventDefault(): void;
    get defaultPrevented(): boolean;
    get composed(): boolean;
    initEvent(type: DOMString, bubbles: boolean, cancelable: boolean): void;
    get dispatched(): boolean;
    set dispatched(value: boolean);
    get initialized(): boolean;
    set initialized(value: boolean);
}
interface Listener {
    callback: EventListenerOrEventListenerObject;
    options: AddEventListenerOptions;
}
interface EventTargetData {
    listeners: {
        [type: string]: Listener[];
    };
}
/**
 * @see: https://dom.spec.whatwg.org/#eventtarget
 */
declare class EventTarget {
    eventTargetData: EventTargetData;
    constructor();
    addEventListener(type: DOMString, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
    dispatchEvent(event: Event): boolean;
    private flattenOptions;
}
declare const GLOBAL_MODULES: {
    Event: typeof Event;
    EventTarget: typeof EventTarget;
};
export default GLOBAL_MODULES;
export { Event, EventTarget };
