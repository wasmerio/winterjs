use ion::{Context, Object};

mod cache;
mod cache_storage;

pub fn define(cx: &Context, global: &mut Object) -> bool {
    cache::define(cx, global) && cache_storage::define(cx, global)
}
