use ion::{
    class::Reflector, conversions::ToValue, ClassDefinition, Context, Heap, Object, Promise,
    Result, Value,
};
use mozjs_sys::jsapi::JSObject;
use runtime::globals::fetch::RequestInfo;

use crate::{ion_err, ion_mk_err};

use super::cache::{Cache, CacheQueryOptions};

const DEFAULT_CACHE_KEY: &'static str = "_____WINTERJS_DEFAULT_CACHE_____";

#[derive(FromValue)]
pub struct MultiCacheQueryOptions {
    ignore_search: Option<bool>,
    ignore_method: Option<bool>,
    ignore_vary: Option<bool>,
    cache_name: Option<String>,
}

#[js_class]
pub struct CacheStorage {
    reflector: Reflector,

    // Note: The order of the caches is important, so we can't naively use a hashmap here
    caches: Vec<(String, Heap<*mut JSObject>)>,
}

#[js_class]
impl CacheStorage {
    #[ion(constructor)]
    pub fn constructor() -> Result<CacheStorage> {
        ion_err!("Cannot construct this type", Type)
    }

    #[ion(name = "match")]
    pub fn r#match(
        &self,
        cx: &Context,
        key: RequestInfo,
        options: Option<MultiCacheQueryOptions>,
    ) -> Promise {
        let cache_name = options.as_ref().and_then(|o| o.cache_name.as_ref());
        let query_options = options
            .as_ref()
            .map(|o| CacheQueryOptions {
                ignore_method: o.ignore_method,
                ignore_search: o.ignore_search,
                ignore_vary: o.ignore_vary,
            })
            .unwrap_or_default();
        for c in &self.caches {
            if let Some(cache_name) = cache_name {
                if c.0.as_str() != cache_name.as_str() {
                    continue;
                }
            }

            let responses = match Cache::get_private(&c.1.root(cx).into()).match_all_impl(
                cx,
                Some(key.clone()),
                1,
                &query_options,
            ) {
                Ok(r) => r,
                Err(e) => return Promise::new_rejected(cx, e),
            };

            if responses.len() > 0 {
                return Promise::new_resolved(cx, responses[0]);
            }
        }

        Promise::new_resolved(cx, Value::undefined(cx))
    }

    pub fn has(&self, cx: &Context, key: String) -> Promise {
        Promise::new_resolved(cx, self.caches.iter().any(|c| c.0 == key))
    }

    pub fn open(&mut self, cx: &Context, key: String) -> Promise {
        for c in &self.caches {
            if c.0 == key {
                return Promise::new_resolved(cx, c.1.get());
            }
        }

        let cache = Cache::new_object(cx, Box::new(Cache::new()));
        self.caches.push((key, Heap::new(cache)));
        Promise::new_resolved(cx, cache)
    }

    pub fn delete(&mut self, cx: &Context, key: String) -> Promise {
        if key.as_str() == DEFAULT_CACHE_KEY {
            return Promise::new_rejected(cx, ion_mk_err!("Cannot delete the default cache", Type));
        }

        let index = self
            .caches
            .iter()
            .enumerate()
            .find(|c| c.1 .0 == key)
            .map(|c| c.0);
        if let Some(index) = index {
            self.caches.remove(index);
            Promise::new_resolved(cx, true)
        } else {
            Promise::new_resolved(cx, false)
        }
    }

    pub fn keys(&self, cx: &Context) -> Promise {
        let result = self.caches.iter().map(|c| c.0.clone()).collect::<Vec<_>>();
        Promise::new_resolved(cx, result)
    }

    #[ion(get)]
    pub fn get_default(&self) -> *mut JSObject {
        assert!(self.caches.len() >= 1 && self.caches[0].0.as_str() == DEFAULT_CACHE_KEY);
        self.caches[0].1.get()
    }
}

pub fn define(cx: &Context, global: &mut Object) -> bool {
    if !CacheStorage::init_class(cx, global).0 {
        return false;
    }

    let mut caches = CacheStorage {
        reflector: Default::default(),
        caches: Default::default(),
    };

    caches.caches.push((
        DEFAULT_CACHE_KEY.to_string(),
        Heap::new(Cache::new_object(cx, Box::new(Cache::new()))),
    ));

    let caches_obj = CacheStorage::new_object(cx, Box::new(caches));
    global.set(
        cx,
        "caches",
        &Object::from(cx.root_object(caches_obj)).as_value(cx),
    )
}
