/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::any::Any;
use std::cell::RefCell;
use std::panic::{catch_unwind, resume_unwind, AssertUnwindSafe};

thread_local!(static PANIC_PAYLOAD: RefCell<Option<Box<dyn Any + Send>>> = RefCell::new(None));

/// If there is a pending panic, resume unwinding.
pub fn maybe_resume_unwind() {
    if let Some(error) = PANIC_PAYLOAD.with(|result| result.borrow_mut().take()) {
        resume_unwind(error);
    }
}

/// Generic wrapper for JS engine callbacks panic-catching
// https://github.com/servo/servo/issues/26585
#[inline(never)]
pub fn wrap_panic(function: &mut dyn FnMut()) {
    match catch_unwind(AssertUnwindSafe(function)) {
        Ok(()) => {}
        Err(payload) => {
            PANIC_PAYLOAD.with(|opt_payload| {
                let mut opt_payload = opt_payload.borrow_mut();
                assert!(opt_payload.is_none());
                *opt_payload = Some(payload);
            });
        }
    }
}
