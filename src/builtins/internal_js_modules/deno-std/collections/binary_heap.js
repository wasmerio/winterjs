// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */
import { descend } from "./_comparators";
export * from "./_comparators";
/** Swaps the values at two indexes in an array. */
function swap(array, a, b) {
  const temp = array[a];
  array[a] = array[b];
  array[b] = temp;
}
/** Returns the parent index for a child index. */
function getParentIndex(index) {
  return Math.floor((index + 1) / 2) - 1;
}
/**
 * A priority queue implemented with a binary heap. The heap is in descending
 * order by default, using JavaScript's built-in comparison operators to sort
 * the values.
 *
 * | Method      | Average Case | Worst Case |
 * | ----------- | ------------ | ---------- |
 * | peek()      | O(1)         | O(1)       |
 * | pop()       | O(log n)     | O(log n)   |
 * | push(value) | O(1)         | O(log n)   |
 *
 * @example
 * ```ts
 * import {
 *   ascend,
 *   BinaryHeap,
 *   descend,
 * } from "https://deno.land/std@$STD_VERSION/collections/binary_heap";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const maxHeap = new BinaryHeap<number>();
 * maxHeap.push(4, 1, 3, 5, 2);
 * assertEquals(maxHeap.peek(), 5);
 * assertEquals(maxHeap.pop(), 5);
 * assertEquals([...maxHeap], [4, 3, 2, 1]);
 * assertEquals([...maxHeap], []);
 *
 * const minHeap = new BinaryHeap<number>(ascend);
 * minHeap.push(4, 1, 3, 5, 2);
 * assertEquals(minHeap.peek(), 1);
 * assertEquals(minHeap.pop(), 1);
 * assertEquals([...minHeap], [2, 3, 4, 5]);
 * assertEquals([...minHeap], []);
 *
 * const words = new BinaryHeap<string>((a, b) => descend(a.length, b.length));
 * words.push("truck", "car", "helicopter", "tank");
 * assertEquals(words.peek(), "helicopter");
 * assertEquals(words.pop(), "helicopter");
 * assertEquals([...words], ["truck", "tank", "car"]);
 * assertEquals([...words], []);
 * ```
 */
export class BinaryHeap {
  compare;
  #data = [];
  constructor(compare = descend) {
    this.compare = compare;
  }
  /** Returns the underlying cloned array in arbitrary order without sorting */
  toArray() {
    return Array.from(this.#data);
  }
  static from(collection, options) {
    let result;
    let unmappedValues = [];
    if (collection instanceof BinaryHeap) {
      result = new BinaryHeap(options?.compare ?? collection.compare);
      if (options?.compare || options?.map) {
        unmappedValues = collection.#data;
      } else {
        result.#data = Array.from(collection.#data);
      }
    } else {
      result = options?.compare
        ? new BinaryHeap(options.compare)
        : new BinaryHeap();
      unmappedValues = collection;
    }
    const values = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : unmappedValues;
    result.push(...values);
    return result;
  }
  /** The amount of values stored in the binary heap. */
  get length() {
    return this.#data.length;
  }
  /** Returns the greatest value in the binary heap, or undefined if it is empty. */
  peek() {
    return this.#data[0];
  }
  /** Removes the greatest value from the binary heap and returns it, or null if it is empty. */
  pop() {
    const size = this.#data.length - 1;
    swap(this.#data, 0, size);
    let parent = 0;
    let right = 2 * (parent + 1);
    let left = right - 1;
    while (left < size) {
      const greatestChild =
        right === size || this.compare(this.#data[left], this.#data[right]) <= 0
          ? left
          : right;
      if (this.compare(this.#data[greatestChild], this.#data[parent]) < 0) {
        swap(this.#data, parent, greatestChild);
        parent = greatestChild;
      } else {
        break;
      }
      right = 2 * (parent + 1);
      left = right - 1;
    }
    return this.#data.pop();
  }
  /** Adds values to the binary heap. */
  push(...values) {
    for (const value of values) {
      let index = this.#data.length;
      let parent = getParentIndex(index);
      this.#data.push(value);
      while (
        index !== 0 &&
        this.compare(this.#data[index], this.#data[parent]) < 0
      ) {
        swap(this.#data, parent, index);
        index = parent;
        parent = getParentIndex(index);
      }
    }
    return this.#data.length;
  }
  /** Removes all values from the binary heap. */
  clear() {
    this.#data = [];
  }
  /** Checks if the binary heap is empty. */
  isEmpty() {
    return this.#data.length === 0;
  }
  /** Returns an iterator for retrieving and removing values from the binary heap. */
  *drain() {
    while (!this.isEmpty()) {
      yield this.pop();
    }
  }
  *[Symbol.iterator]() {
    yield* this.drain();
  }
}
