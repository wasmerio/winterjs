use std::{cell::RefCell, rc::Rc};

use ion::{
    class::Reflector,
    conversions::ToValue,
    function::Opt,
    string::byte::{ByteString, VerbatimBytes},
    ClassDefinition, Context, Heap, Object, Promise, Result, Value,
};
use lazy_static::lazy_static;
use mozjs_sys::jsapi::JSObject;
use runtime::globals::fetch::RequestInfo;

use crate::{ion_err, ion_mk_err};

use super::{Cache, CacheQueryOptions};

lazy_static! {
    static ref DEFAULT_CACHE_KEY: ByteString<VerbatimBytes> =
        ByteString::from("_____WINTERJS_DEFAULT_CACHE_____".to_string().into())
            .expect("Should be able to create default cache key");
}

#[derive(FromValue)]
pub struct MultiCacheQueryOptions {
    ignore_search: Option<bool>,
    ignore_method: Option<bool>,
    ignore_vary: Option<bool>,
    cache_name: Option<ByteString<VerbatimBytes>>,
}

// (Request, Response)
pub(super) type CacheEntryList = Vec<(Heap<*mut JSObject>, Heap<*mut JSObject>)>;

#[js_class]
pub struct CacheStorage {
    reflector: Reflector,

    // Note: The order of the caches is important, so we can't naively use a hashmap here
    #[trace(no_trace)]
    pub(super) caches: Vec<(ByteString<VerbatimBytes>, Rc<RefCell<CacheEntryList>>)>,
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
        Opt(options): Opt<MultiCacheQueryOptions>,
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
                if &c.0 != cache_name {
                    continue;
                }
            }

            let responses = match Cache::match_all_impl(
                c.1.try_borrow().expect("Should be able to borrow entries"),
                cx,
                Some(key.clone()),
                1,
                &query_options,
            ) {
                Ok(r) => r,
                Err(e) => return Promise::rejected(cx, e),
            };

            if !responses.is_empty() {
                return Promise::resolved(cx, responses[0]);
            }
        }

        Promise::resolved(cx, Value::undefined(cx))
    }

    pub fn has(&self, cx: &Context, key: ByteString<VerbatimBytes>) -> Promise {
        Promise::resolved(cx, self.caches.iter().any(|c| c.0 == key))
    }

    pub fn open(&mut self, cx: &Context, key: ByteString<VerbatimBytes>) -> Promise {
        let index =
            match self
                .caches
                .iter()
                .enumerate()
                .find_map(|(i, c)| if c.0 == key { Some(i) } else { None })
            {
                Some(i) => i,
                None => {
                    self.caches.push((key, Rc::new(RefCell::new(vec![]))));
                    self.caches.len() - 1
                }
            };

        let cache = Cache::new_object(cx, Box::new(Cache::new(self.caches[index].1.clone())));
        Promise::resolved(cx, cache)
    }

    pub fn delete(&mut self, cx: &Context, key: ByteString<VerbatimBytes>) -> Promise {
        if key == *DEFAULT_CACHE_KEY {
            return Promise::rejected(cx, ion_mk_err!("Cannot delete the default cache", Type));
        }

        let index = self
            .caches
            .iter()
            .enumerate()
            .find(|c| c.1 .0 == key)
            .map(|c| c.0);
        if let Some(index) = index {
            self.caches.remove(index);
            Promise::resolved(cx, true)
        } else {
            Promise::resolved(cx, false)
        }
    }

    pub fn keys(&self, cx: &Context) -> Promise {
        let result = self.caches.iter().map(|c| c.0.clone()).collect::<Vec<_>>();
        Promise::resolved(cx, result)
    }

    #[ion(get)]
    pub fn get_default(&self, cx: &Context) -> *mut JSObject {
        assert!(!self.caches.is_empty() && self.caches[0].0 == *DEFAULT_CACHE_KEY);
        Cache::new_object(cx, Box::new(Cache::new(self.caches[0].1.clone())))
    }
}

pub fn define(cx: &Context, global: &Object) -> bool {
    if !CacheStorage::init_class(cx, global).0 {
        return false;
    }

    let mut caches = CacheStorage {
        reflector: Default::default(),
        caches: Default::default(),
    };

    caches
        .caches
        .push((DEFAULT_CACHE_KEY.clone(), Rc::new(RefCell::new(vec![]))));

    let caches_obj = CacheStorage::new_object(cx, Box::new(caches));
    global.set(
        cx,
        "caches",
        &Object::from(cx.root(caches_obj)).as_value(cx),
    )
}
