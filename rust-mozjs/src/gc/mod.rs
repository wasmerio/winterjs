pub use crate::gc::collections::*;
pub use crate::gc::custom::*;
pub use crate::gc::root::*;
pub use crate::gc::trace::*;
pub use mozjs_sys::jsgc::{GCMethods, RootKind};

mod collections;
mod custom;
mod macros;
mod root;
mod trace;
