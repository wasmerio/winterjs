/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::os::raw::c_void;

// Bindgen generates a version of that type where `_bitfield_1` is an opaque type,
// so can't be used in const expressions. To avoid this, we bind JSJitInfo to a type
// where the bitfield is just a u32.

/// This struct contains metadata passed from the DOM to the JS Engine for JIT optimizations on DOM property accessors.
#[repr(C)]
#[allow(non_snake_case)]
#[derive(Debug, Copy, Clone)]
pub struct JSJitInfo {
    pub call: *const c_void,
    pub protoID: u16,
    pub depth: u16,
    pub _bitfield_1: u32,
}
