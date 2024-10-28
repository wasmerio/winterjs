// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** Functions for specific common tasks around collection types like `Array` and
 * `Record`. This module is heavily inspired by `kotlin`s stdlib.
 *
 * - All provided functions are **pure**, which also means that they do **not
 *   mutate** your inputs, **returning a new value** instead.
 * - All functions are importable on their own by referencing their snake_case
 *   named file (e.g. `collections/sort_by.ts`)
 *
 * This module re-exports several modules, and importing this module directly
 * will likely include a lot of code that you might not use.
 *
 * Consider importing the function directly. For example to import
 * {@linkcode groupBy} import the module using the snake cased version of the
 * module:
 *
 * ```ts
 * import { groupBy } from "https://deno.land/std@$STD_VERSION/collections/group_by";
 * ```
 *
 * @module
 */
// Not sure what's causing this warning? Run `deno info <entry-point-path>` to
// analyze the module graph. It's not recommended to import directly from
// mod.ts here because it adds a lot of bloat.
console.warn(
  "%c[WARN] deno_std: prefer importing collections/<function_name_in_snake_case>.ts " +
    "instead of collections/mod.ts",
  "color: yellow;"
);
export * from "./aggregate_groups";
export * from "./associate_by";
export * from "./associate_with";
export * from "./chunk";
export * from "./deep_merge";
export * from "./distinct";
export * from "./distinct_by";
export * from "./drop_while";
export * from "./filter_entries";
export * from "./filter_keys";
export * from "./filter_values";
export * from "./group_by";
export * from "./intersect";
export * from "./map_entries";
export * from "./map_keys";
export * from "./map_not_nullish";
export * from "./map_values";
export * from "./partition";
export * from "./permutations";
export * from "./find_single";
export * from "./sliding_windows";
export * from "./sum_of";
export * from "./max_by";
export * from "./max_of";
export * from "./min_by";
export * from "./min_of";
export * from "./sort_by";
export * from "./union";
export * from "./without_all";
export * from "./unzip";
export * from "./zip";
export * from "./join_to_string";
export * from "./max_with";
export * from "./min_with";
export * from "./includes_value";
export * from "./take_last_while";
export * from "./take_while";
export * from "./first_not_nullish_of";
export * from "./drop_last_while";
export * from "./reduce_groups";
export * from "./sample";
export * from "./running_reduce";
export * from "./binary_heap";
