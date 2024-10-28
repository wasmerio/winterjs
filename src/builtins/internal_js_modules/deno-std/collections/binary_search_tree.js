// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */
import { ascend } from "./_comparators";
import { BinarySearchNode } from "./binary_search_node";
export * from "./_comparators";
/**
 * An unbalanced binary search tree. The values are in ascending order by default,
 * using JavaScript's built-in comparison operators to sort the values.
 *
 * For performance, it's recommended that you use a self-balancing binary search
 * tree instead of this one unless you are extending this to create a
 * self-balancing tree. See RedBlackTree for an example of how BinarySearchTree
 *  can be extended to create a self-balancing binary search tree.
 *
 * | Method        | Average Case | Worst Case |
 * | ------------- | ------------ | ---------- |
 * | find(value)   | O(log n)     | O(n)       |
 * | insert(value) | O(log n)     | O(n)       |
 * | remove(value) | O(log n)     | O(n)       |
 * | min()         | O(log n)     | O(n)       |
 * | max()         | O(log n)     | O(n)       |
 *
 * @example
 * ```ts
 * import {
 *   ascend,
 *   BinarySearchTree,
 *   descend,
 * } from "https://deno.land/std@$STD_VERSION/collections/binary_search_tree";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts";
 *
 * const values = [3, 10, 13, 4, 6, 7, 1, 14];
 * const tree = new BinarySearchTree<number>();
 * values.forEach((value) => tree.insert(value));
 * assertEquals([...tree], [1, 3, 4, 6, 7, 10, 13, 14]);
 * assertEquals(tree.min(), 1);
 * assertEquals(tree.max(), 14);
 * assertEquals(tree.find(42), null);
 * assertEquals(tree.find(7), 7);
 * assertEquals(tree.remove(42), false);
 * assertEquals(tree.remove(7), true);
 * assertEquals([...tree], [1, 3, 4, 6, 10, 13, 14]);
 *
 * const invertedTree = new BinarySearchTree<number>(descend);
 * values.forEach((value) => invertedTree.insert(value));
 * assertEquals([...invertedTree], [14, 13, 10, 7, 6, 4, 3, 1]);
 * assertEquals(invertedTree.min(), 14);
 * assertEquals(invertedTree.max(), 1);
 * assertEquals(invertedTree.find(42), null);
 * assertEquals(invertedTree.find(7), 7);
 * assertEquals(invertedTree.remove(42), false);
 * assertEquals(invertedTree.remove(7), true);
 * assertEquals([...invertedTree], [14, 13, 10, 6, 4, 3, 1]);
 *
 * const words = new BinarySearchTree<string>((a, b) =>
 *   ascend(a.length, b.length) || ascend(a, b)
 * );
 * ["truck", "car", "helicopter", "tank", "train", "suv", "semi", "van"]
 *   .forEach((value) => words.insert(value));
 * assertEquals([...words], [
 *   "car",
 *   "suv",
 *   "van",
 *   "semi",
 *   "tank",
 *   "train",
 *   "truck",
 *   "helicopter",
 * ]);
 * assertEquals(words.min(), "car");
 * assertEquals(words.max(), "helicopter");
 * assertEquals(words.find("scooter"), null);
 * assertEquals(words.find("tank"), "tank");
 * assertEquals(words.remove("scooter"), false);
 * assertEquals(words.remove("tank"), true);
 * assertEquals([...words], [
 *   "car",
 *   "suv",
 *   "van",
 *   "semi",
 *   "train",
 *   "truck",
 *   "helicopter",
 * ]);
 * ```
 */
export class BinarySearchTree {
  compare;
  root = null;
  _size = 0;
  constructor(compare = ascend) {
    this.compare = compare;
  }
  static from(collection, options) {
    let result;
    let unmappedValues = [];
    if (collection instanceof BinarySearchTree) {
      result = new BinarySearchTree(options?.compare ?? collection.compare);
      if (options?.compare || options?.map) {
        unmappedValues = collection;
      } else {
        const nodes = [];
        if (collection.root) {
          result.root = BinarySearchNode.from(collection.root);
          nodes.push(result.root);
        }
        while (nodes.length) {
          const node = nodes.pop();
          const left = node.left ? BinarySearchNode.from(node.left) : null;
          const right = node.right ? BinarySearchNode.from(node.right) : null;
          if (left) {
            left.parent = node;
            nodes.push(left);
          }
          if (right) {
            right.parent = node;
            nodes.push(right);
          }
        }
      }
    } else {
      result = options?.compare
        ? new BinarySearchTree(options.compare)
        : new BinarySearchTree();
      unmappedValues = collection;
    }
    const values = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : unmappedValues;
    for (const value of values) result.insert(value);
    return result;
  }
  /** The amount of values stored in the binary search tree. */
  get size() {
    return this._size;
  }
  findNode(value) {
    let node = this.root;
    while (node) {
      const order = this.compare(value, node.value);
      if (order === 0) break;
      const direction = order < 0 ? "left" : "right";
      node = node[direction];
    }
    return node;
  }
  rotateNode(node, direction) {
    const replacementDirection = direction === "left" ? "right" : "left";
    if (!node[replacementDirection]) {
      throw new TypeError(
        `cannot rotate ${direction} without ${replacementDirection} child`
      );
    }
    const replacement = node[replacementDirection];
    node[replacementDirection] = replacement[direction] ?? null;
    if (replacement[direction]) replacement[direction].parent = node;
    replacement.parent = node.parent;
    if (node.parent) {
      const parentDirection =
        node === node.parent[direction] ? direction : replacementDirection;
      node.parent[parentDirection] = replacement;
    } else {
      this.root = replacement;
    }
    replacement[direction] = node;
    node.parent = replacement;
  }
  insertNode(Node, value) {
    if (!this.root) {
      this.root = new Node(null, value);
      this._size++;
      return this.root;
    } else {
      let node = this.root;
      while (true) {
        const order = this.compare(value, node.value);
        if (order === 0) break;
        const direction = order < 0 ? "left" : "right";
        if (node[direction]) {
          node = node[direction];
        } else {
          node[direction] = new Node(node, value);
          this._size++;
          return node[direction];
        }
      }
    }
    return null;
  }
  /** Removes the given node, and returns the node that was physically removed from the tree. */
  removeNode(node) {
    /**
     * The node to physically remove from the tree.
     * Guaranteed to have at most one child.
     */
    const flaggedNode =
      !node.left || !node.right ? node : node.findSuccessorNode();
    /** Replaces the flagged node. */
    const replacementNode = flaggedNode.left ?? flaggedNode.right;
    if (replacementNode) replacementNode.parent = flaggedNode.parent;
    if (!flaggedNode.parent) {
      this.root = replacementNode;
    } else {
      flaggedNode.parent[flaggedNode.directionFromParent()] = replacementNode;
    }
    if (flaggedNode !== node) {
      /** Swaps values, in case value of the removed node is still needed by consumer. */
      const swapValue = node.value;
      node.value = flaggedNode.value;
      flaggedNode.value = swapValue;
    }
    this._size--;
    return flaggedNode;
  }
  /**
   * Adds the value to the binary search tree if it does not already exist in it.
   * Returns true if successful.
   */
  insert(value) {
    return !!this.insertNode(BinarySearchNode, value);
  }
  /**
   * Removes node value from the binary search tree if found.
   * Returns true if found and removed.
   */
  remove(value) {
    const node = this.findNode(value);
    if (node) this.removeNode(node);
    return node !== null;
  }
  /** Returns node value if found in the binary search tree. */
  find(value) {
    return this.findNode(value)?.value ?? null;
  }
  /** Returns the minimum value in the binary search tree or null if empty. */
  min() {
    return this.root ? this.root.findMinNode().value : null;
  }
  /** Returns the maximum value in the binary search tree or null if empty. */
  max() {
    return this.root ? this.root.findMaxNode().value : null;
  }
  /** Removes all values from the binary search tree. */
  clear() {
    this.root = null;
    this._size = 0;
  }
  /** Checks if the binary search tree is empty. */
  isEmpty() {
    return this.size === 0;
  }
  /**
   * Returns an iterator that uses in-order (LNR) tree traversal for
   * retrieving values from the binary search tree.
   */
  *lnrValues() {
    const nodes = [];
    let node = this.root;
    while (nodes.length || node) {
      if (node) {
        nodes.push(node);
        node = node.left;
      } else {
        node = nodes.pop();
        yield node.value;
        node = node.right;
      }
    }
  }
  /**
   * Returns an iterator that uses reverse in-order (RNL) tree traversal for
   * retrieving values from the binary search tree.
   */
  *rnlValues() {
    const nodes = [];
    let node = this.root;
    while (nodes.length || node) {
      if (node) {
        nodes.push(node);
        node = node.right;
      } else {
        node = nodes.pop();
        yield node.value;
        node = node.left;
      }
    }
  }
  /**
   * Returns an iterator that uses pre-order (NLR) tree traversal for
   * retrieving values from the binary search tree.
   */
  *nlrValues() {
    const nodes = [];
    if (this.root) nodes.push(this.root);
    while (nodes.length) {
      const node = nodes.pop();
      yield node.value;
      if (node.right) nodes.push(node.right);
      if (node.left) nodes.push(node.left);
    }
  }
  /**
   * Returns an iterator that uses post-order (LRN) tree traversal for
   * retrieving values from the binary search tree.
   */
  *lrnValues() {
    const nodes = [];
    let node = this.root;
    let lastNodeVisited = null;
    while (nodes.length || node) {
      if (node) {
        nodes.push(node);
        node = node.left;
      } else {
        const lastNode = nodes[nodes.length - 1];
        if (lastNode.right && lastNode.right !== lastNodeVisited) {
          node = lastNode.right;
        } else {
          yield lastNode.value;
          lastNodeVisited = nodes.pop();
        }
      }
    }
  }
  /**
   * Returns an iterator that uses level order tree traversal for
   * retrieving values from the binary search tree.
   */
  *lvlValues() {
    const children = [];
    let cursor = this.root;
    while (cursor) {
      yield cursor.value;
      if (cursor.left) children.push(cursor.left);
      if (cursor.right) children.push(cursor.right);
      cursor = children.shift() ?? null;
    }
  }
  /**
   * Returns an iterator that uses in-order (LNR) tree traversal for
   * retrieving values from the binary search tree.
   */
  *[Symbol.iterator]() {
    yield* this.lnrValues();
  }
}
