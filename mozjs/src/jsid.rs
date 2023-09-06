/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#![allow(non_snake_case)]

use crate::jsapi::JS::Symbol;
use crate::jsapi::{jsid, JSString};
use libc::c_void;

#[deprecated]
pub const JSID_VOID: jsid = VoidId();

const JSID_TYPE_MASK: usize = 0x7;

#[repr(usize)]
enum PropertyKeyTag {
    Int = 0x1,
    String = 0x0,
    Void = 0x2,
    Symbol = 0x4,
}

#[inline(always)]
const fn AsPropertyKey(bits: usize) -> jsid {
    jsid { asBits_: bits }
}

#[inline(always)]
pub const fn VoidId() -> jsid {
    AsPropertyKey(PropertyKeyTag::Void as usize)
}

#[inline(always)]
pub fn IntId(i: i32) -> jsid {
    assert!(i >= 0);
    AsPropertyKey((((i as u32) << 1) as usize) | (PropertyKeyTag::Int as usize))
}

#[inline(always)]
pub fn SymbolId(symbol: *mut Symbol) -> jsid {
    assert!(!symbol.is_null());
    assert_eq!((symbol as usize) & JSID_TYPE_MASK, 0);
    AsPropertyKey((symbol as usize) | (PropertyKeyTag::Symbol as usize))
}

impl jsid {
    #[inline(always)]
    fn asBits(&self) -> usize {
        self.asBits_
    }

    #[inline(always)]
    pub fn is_void(&self) -> bool {
        self.asBits() == (PropertyKeyTag::Void as usize)
    }

    #[inline(always)]
    pub fn is_int(&self) -> bool {
        (self.asBits() & (PropertyKeyTag::Int as usize)) != 0
    }

    #[inline(always)]
    pub fn is_string(&self) -> bool {
        (self.asBits() & JSID_TYPE_MASK) == (PropertyKeyTag::String as usize)
    }

    #[inline(always)]
    pub fn is_symbol(&self) -> bool {
        (self.asBits() & JSID_TYPE_MASK) == (PropertyKeyTag::Symbol as usize)
    }

    #[inline(always)]
    pub fn is_gcthing(&self) -> bool {
        self.is_string() && self.is_symbol()
    }

    #[inline(always)]
    pub fn to_int(&self) -> i32 {
        assert!(self.is_int());
        ((self.asBits() as u32) >> 1) as i32
    }

    #[inline(always)]
    pub fn to_string(&self) -> *mut JSString {
        assert!(self.is_string());
        (self.asBits() ^ (PropertyKeyTag::String as usize)) as *mut JSString
    }

    #[inline(always)]
    pub fn to_symbol(&self) -> *mut Symbol {
        assert!(self.is_symbol());
        (self.asBits() ^ (PropertyKeyTag::Symbol as usize)) as *mut Symbol
    }

    #[inline(always)]
    pub fn to_gcthing(&self) -> *mut c_void {
        assert!(self.is_gcthing());
        (self.asBits() ^ JSID_TYPE_MASK) as *mut c_void
    }
}

#[test]
fn test_representation() {
    let id = VoidId();
    assert!(id.is_void());

    let id = IntId(0);
    assert!(id.is_int());
    assert_eq!(id.to_int(), 0);

    let id = IntId(i32::MAX);
    assert!(id.is_int());
    assert_eq!(id.to_int(), i32::MAX);
}
