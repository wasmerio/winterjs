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
class Event {
  readonly type: string;
  readonly target: EventTarget | null;
  readonly srcElement: EventTarget | null; // legacy
  readonly currentTarget: EventTarget | null;

  static readonly NONE = 0;
  static readonly CAPTURING_PHASE = 1;
  static readonly AT_TARGET = 2;
  static readonly BUBBLING_PHASE = 3;
  readonly eventPhase: number;

  readonly bubbles: boolean;
  readonly cancelable: boolean;

  private isTrusted: boolean; // Legacy Unforgeable
  readonly timeStamp: DOMHighResTimeStamp;

  private path: any[] = [];

  /**
   * flags
   */
  private stopPropagationFlag = false;
  private stopImmediatePropagationFlag = false;
  private canceledFlag = false;
  private inPassiveListenerFlag = false;
  private composedFlag = false;
  private initializedFlag = false;
  private dispatchFlag = false;

  constructor(type: DOMString, eventInitDict?: EventInit) {
    this.initializedFlag = true;
    this.isTrusted = false;
    this.target = null;

    this.type = type;
    this.bubbles = !!eventInitDict?.bubbles;
    this.cancelable = !!eventInitDict?.cancelable;

    this.currentTarget = null;
    this.eventPhase = Event.NONE;
    this.composedFlag = !!eventInitDict?.composed;
    this.timeStamp = 0;

    this.srcElement = null;
  }

  composedPath(): EventTarget[] {
    /**
     * 1. Let composedPath be an empty list.
     */
    let composedPath: any[] = [];

    /**
     * 2. Let path be this’s path.
     * 3. If path is empty, then return composedPath.
     */
    const path = this.path;
    if (path.length === 0) {
      return [];
    }

    if (!this.currentTarget) {
      throw new Error('Error in composedPath: currentTarget is not found.');
    }

    /**
     * 4. Let currentTarget be this’s currentTarget attribute value.
     * 5. Append currentTarget to composedPath..
     * 6. Let currentTargetIndex be 0.
     * 7. Let currentTargetHiddenSubtreeLevel be 0.
     */
    composedPath.push({
      item: this.currentTarget,
      itemInShadowTree: false,
      relatedTarget: null,
      rootOfClosedTree: false,
      slotInClosedTree: false,
      target: null,
      touchTargetList: [],
    });
    let currentTargetIndex = 0;
    let currentTargetHiddenSubtreeLevel = 0;

    /**
     * 7. Let index be path’s size − 1.
     * 8. While index is greater than or equal to 0:
     * 9. If path[index]'s root-of-closed-tree is true, then increase currentTargetHiddenSubtreeLevel by 1.
     *  9-1. If path[index]'s invocation target is currentTarget, then set currentTargetIndex to index and break.
     *  9-2. If path[index]'s slot-in-closed-tree is true, then decrease currentTargetHiddenSubtreeLevel by 1.
     *  9-3. Decrease index by 1.
     */
    for (let i = path.length - 1; i >= 0; i--) {
      const { item, rootOfClosedTree, slotInClosedTree } = path[i];
      if (rootOfClosedTree) currentTargetHiddenSubtreeLevel++;
      if (item === this.currentTarget) {
        currentTargetIndex = i;
        break;
      }
      if (slotInClosedTree) currentTargetHiddenSubtreeLevel--;
    }

    /**
     * 10. Let currentHiddenLevel and maxHiddenLevel be currentTargetHiddenSubtreeLevel.
     */
    let currentHiddenLevel = currentTargetHiddenSubtreeLevel;
    let maxHiddenLevel = currentTargetHiddenSubtreeLevel;

    /**
     * 11. Set index to currentTargetIndex − 1.
     * 12. While index is greater than or equal to 0:
     *  12-1. If path[index]'s root-of-closed-tree is true, then increase currentHiddenLevel by 1.
     *  12-2. If currentHiddenLevel is less than or equal to maxHiddenLevel, then prepend path[index]'s invocation target to composedPath.
     *  12-3. If path[index]'s slot-in-closed-tree is true then:
     *   12-3-1. Decrease currentHiddenLevel by 1.
     *   12-3-2. If currentHiddenLevel is less than maxHiddenLevel, then set maxHiddenLevel to currentHiddenLevel.
     * 12-4. Decrease index by 1.
     *
     */
    for (let i = currentTargetIndex - 1; i >= 0; i--) {
      const { item, rootOfClosedTree, slotInClosedTree } = path[i];

      if (rootOfClosedTree) currentHiddenLevel++;
      if (currentHiddenLevel <= maxHiddenLevel) {
        composedPath.unshift({
          item,
          itemInShadowTree: false,
          relatedTarget: null,
          rootOfClosedTree: false,
          slotInClosedTree: false,
          target: null,
          touchTargetList: [],
        });
      }
      if (slotInClosedTree) {
        currentHiddenLevel--;
        if (currentHiddenLevel < maxHiddenLevel) {
          maxHiddenLevel = currentHiddenLevel;
        }
      }
    }

    /**
     * 13. Set currentHiddenLevel and maxHiddenLevel to currentTargetHiddenSubtreeLevel.
     */
    currentHiddenLevel = currentTargetHiddenSubtreeLevel;
    maxHiddenLevel = currentTargetHiddenSubtreeLevel;

    /**
     * 14. Set index to currentTargetIndex + 1.
     * 15. While index is less than path’s size:
     *  15-1. If path[index]'s slot-in-closed-tree is true, then increase currentHiddenLevel by 1.
     *  15-2. If currentHiddenLevel is less than or equal to maxHiddenLevel, then append path[index]'s invocation target to composedPath.
     *  15-3. If path[index]'s root-of-closed-tree is true, then:
     *   15-3-1. Decrease currentHiddenLevel by 1.
     *   15-3-2. If currentHiddenLevel is less than maxHiddenLevel, then set maxHiddenLevel to currentHiddenLevel.
     * 15-4. Increase index by 1.
     */
    for (let i = currentTargetIndex + 1; i < path.length; i++) {
      const { item, rootOfClosedTree, slotInClosedTree } = path[i];

      if (slotInClosedTree) currentHiddenLevel++;
      if (currentHiddenLevel <= maxHiddenLevel) {
        composedPath.push({
          item,
          itemInShadowTree: false,
          relatedTarget: null,
          rootOfClosedTree: false,
          slotInClosedTree: false,
          target: null,
          touchTargetList: [],
        });
      }

      if (rootOfClosedTree) {
        currentHiddenLevel--;
        if (currentHiddenLevel < maxHiddenLevel) {
          maxHiddenLevel = currentHiddenLevel;
        }
      }
    }

    /**
     * 16. Return composedPath.
     */
    return composedPath.map((i) => i.item);
  }

  /**
   * The stopPropagation() method steps are to set this’s stop propagation flag.
   */
  stopPropagation(): void {
    this.stopPropagationFlag = true;
  }

  /**
   * The cancelBubble getter steps are to return true if this’s stop propagation flag is set; otherwise false.
   */
  get cancelBubble(): boolean {
    return !!this.stopPropagationFlag;
  }

  /**
   * The cancelBubble setter steps are to set this’s stop propagation flag if the given value is true; otherwise do nothing.
   */
  set cancelBubble(value) {
    if (value) this.stopPropagationFlag = true;
  }

  /**
   * The stopImmediatePropagation() method steps are to set this’s stop propagation flag and this’s stop immediate propagation flag.
   */
  stopImmediatePropagation(): void {
    this.stopImmediatePropagationFlag = true;
    this.stopPropagationFlag = true;
  }

  /**
   * The returnValue getter steps are to return false if this’s canceled flag is set; otherwise true.
   */
  get returnValue(): boolean {
    return !!!this.canceledFlag;
  }

  /**
   * The returnValue setter steps are to set the canceled flag with this if the given value is false; otherwise do nothing.
   */
  set returnValue(value) {
    if (!value) this.canceledFlag = true;
  }

  /**
   * The preventDefault() method steps are to set the canceled flag with this.
   */
  preventDefault(): void {
    this.canceledFlag = true;
  }

  get defaultPrevented(): boolean {
    return !!this.canceledFlag;
  }

  get composed(): boolean {
    return !!this.composedFlag;
  }

  initEvent(type: DOMString, bubbles: boolean, cancelable: boolean): void {}

  // other setter/getter
  get dispatched(): boolean {
    return this.dispatchFlag;
  }

  set dispatched(value: boolean) {
    this.dispatchFlag = value;
  }

  get initialized(): boolean {
    return this.initializedFlag;
  }

  set initialized(value: boolean) {
    this.initializedFlag = value;
  }
}

interface Listener {
  callback: EventListenerOrEventListenerObject;
  options: AddEventListenerOptions;
}

interface EventTargetData {
  listeners: { [type: string]: Listener[] };
}

/**
 * @see: https://dom.spec.whatwg.org/#eventtarget
 */
class EventTarget {
  eventTargetData: EventTargetData = {
    listeners: Object.create(null),
  };

  constructor() {
    // The new EventTarget() constructor steps are to do nothing.
  }

  addEventListener(type: DOMString, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    if (callback === null) return;
    const self = this;

    // flatten options
    if (options) {
      options = this.flattenOptions(options);
    } else {
      options = { capture: false, once: false, passive: undefined, signal: undefined };
    }

    const { listeners } = self.eventTargetData;

    // init listeners[type]
    if (!listeners[type]) {
      listeners[type] = [];
    }

    const listenerList = listeners[type];

    // check if the same callback is already added then skip
    for (let i = 0; i < listenerList.length; ++i) {
      const listener = listenerList[i];
      const matchWithBooleanOptions = typeof listener.options === 'boolean' && listener.options === options.capture;
      const matchWithObjectOptions = typeof listener.options === 'object' && listener.options.capture === options.capture;
      const matchCallback = listener.callback === callback;

      if ((matchWithBooleanOptions || matchWithObjectOptions) && matchCallback) return;
    }

    const signal = options.signal;

    // If an AbortSignal is passed for options’s signal, then the event listener will be removed when signal is aborted.
    if (signal) {
      if (signal.aborted) {
        return;
      } else {
        signal.addEventListener('abort', () => {
          self.removeEventListener(type, callback, options);
        });
      }
    }

    listenerList.push({ callback, options });
  }

  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
    const self = this;
    const { listeners } = self.eventTargetData;

    const notExistListeners = !listeners[type] || listeners[type].length === 0;
    if (notExistListeners) return;

    // flatten options
    if (typeof options === 'boolean' || typeof options === 'undefined') {
      options = {
        capture: Boolean(options),
      };
    }

    // remove match listeners
    for (let i = 0; i < listeners[type].length; ++i) {
      const listener = listeners[type][i];
      const matchWithBooleanOptions = typeof listener.options === 'boolean' && listener.options === options.capture;
      const matchWithObjectOptions = typeof listener.options === 'object' && listener.options.capture === options.capture;
      const matchCallback = listener.callback === callback;

      if ((matchWithBooleanOptions || matchWithObjectOptions) && matchCallback) {
        listeners[type].splice(i, 1);
        break;
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    const self = this;

    // If event’s dispatch flag is set, or if its initialized flag is not set, then throw an "InvalidStateError" DOMException.
    if (event.dispatched || !event.initialized) {
      throw new DOMException('Invalid event state.', 'InvalidStateError');
    }

    if (event.eventPhase !== Event.NONE) {
      throw new DOMException('Invalid event state.', 'InvalidStateError');
    }

    return dispatch(self, event);
  }

  private flattenOptions(options: AddEventListenerOptions | boolean): AddEventListenerOptions {
    if (typeof options === 'boolean') {
      return { capture: options, once: false, passive: false };
    }

    return options;
  }
}

// TODO: implement according to https://dom.spec.whatwg.org/#concept-event-dispatch
function dispatch(eventTarget: EventTarget, event: Event): boolean {
  // Tentative implementation that just calls the callback
  eventTarget.eventTargetData.listeners[event.type].forEach((listener: any) => {
    listener.callback(event);
  });
  return true;
}

export { Event, EventTarget };
