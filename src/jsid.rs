/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use jsapi::jsid;

// No symbol generated for implicitly initialized constexpr, so we
// need to duplicate the necessary values.
pub const JSID_TYPE_VOID: usize = 0x02;
pub const JSID_VOID: jsid = jsid { asBits: JSID_TYPE_VOID };
