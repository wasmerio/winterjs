pub use gc::collections::*;
pub use gc::custom::*;
pub use gc::root::*;
pub use gc::trace::*;
pub use mozjs_sys::jsgc::{RootKind, GCMethods};

mod collections;
mod custom;
mod macros;
mod root;
mod trace;
