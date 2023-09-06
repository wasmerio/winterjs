/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::cell::Cell;

use mozjs::jsapi::{GCReason, JSTracer, JS_GC};
use mozjs::rust::{CustomAutoRooter, CustomTrace, JSEngine, Runtime};

struct TraceCheck {
    trace_was_called: Cell<bool>,
}

impl TraceCheck {
    fn new() -> TraceCheck {
        TraceCheck {
            trace_was_called: Cell::new(false),
        }
    }
}

unsafe impl CustomTrace for TraceCheck {
    fn trace(&self, _: *mut JSTracer) {
        self.trace_was_called.set(true);
    }
}

/// Check if Rust reimplementation of CustomAutoRooter properly appends itself
/// to autoGCRooters stack list and if C++ inheritance was properly simulated
/// by checking if appropriate virtual trace function was called.
#[test]
fn virtual_trace_called() {
    let engine = JSEngine::init().unwrap();
    let runtime = Runtime::new(engine.handle());
    let context = runtime.cx();

    let mut rooter = CustomAutoRooter::new(TraceCheck::new());
    let guard = rooter.root(context);

    unsafe {
        JS_GC(context, GCReason::API);
    }

    assert!(guard.trace_was_called.get());
}
