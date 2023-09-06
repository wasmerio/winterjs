/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use mozjs::rust::{JSEngine, Runtime};

#[test]
#[should_panic]
fn runtime() {
    let engine = JSEngine::init().unwrap();
    let runtime = Runtime::new(engine.handle());
    let _parent = runtime.prepare_for_new_child();
    drop(runtime);
}
