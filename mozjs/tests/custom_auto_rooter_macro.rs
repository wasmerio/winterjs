/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::cell::Cell;

use mozjs::auto_root;
use mozjs::jsapi::{GCReason, JSTracer, JS_GC};
use mozjs::rust::{CustomTrace, JSEngine, Runtime};

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

#[test]
fn custom_auto_rooter_macro() {
    let engine = JSEngine::init().unwrap();
    let runtime = Runtime::new(engine.handle());
    let context = runtime.cx();

    auto_root!(in(context) let vec = vec![TraceCheck::new(), TraceCheck::new()]);

    unsafe {
        JS_GC(context, GCReason::API);
    }

    vec.iter()
        .for_each(|elem| assert!(elem.trace_was_called.get()));
}
