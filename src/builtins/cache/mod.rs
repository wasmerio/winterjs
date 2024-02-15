use std::{
    cell::RefCell,
    ops::{Deref, DerefMut},
    rc::Rc,
};

use futures::future::Either;
use http::{header, Method};
use ion::{
    class::{NativeObject, Reflector},
    function::Opt,
    ClassDefinition, Context, Heap, Object, Promise, Result, TracedHeap,
};
use mozjs_sys::{
    jsapi::JSObject,
    jsval::{ObjectValue, UndefinedValue},
};
use runtime::{
    globals::fetch::{FetchBody, FetchBodyInner, Request, RequestInfo, Response},
    promise::future_to_promise,
};

use crate::ion_err;

use self::cache_storage::CacheEntryList;

mod cache_storage;

#[derive(FromValue, Default)]
pub struct CacheQueryOptions {
    pub ignore_search: Option<bool>,
    pub ignore_method: Option<bool>,
    pub ignore_vary: Option<bool>,
}

#[js_class]
pub struct Cache {
    reflector: Reflector,

    #[trace(no_trace)]
    entries: Rc<RefCell<CacheEntryList>>,
}

impl Cache {
    pub fn new(entries: Rc<RefCell<CacheEntryList>>) -> Self {
        Self {
            reflector: Default::default(),
            entries,
        }
    }

    pub fn entries(&self) -> impl Deref<Target = CacheEntryList> + '_ {
        self.entries
            .try_borrow()
            .expect("Should be able to borrow entries")
    }

    pub fn entries_mut(&mut self) -> impl DerefMut<Target = CacheEntryList> + '_ {
        self.entries
            .try_borrow_mut()
            .expect("Should be able to borrow entries mutably")
    }

    pub fn match_all_impl(
        entries: impl Deref<Target = CacheEntryList>,
        cx: &Context,
        key: Option<RequestInfo>,
        max_entries: usize,
        options: &CacheQueryOptions,
    ) -> Result<Vec<*mut JSObject>> {
        if max_entries == 0 {
            return Ok(vec![]);
        }

        let request = key
            .map(|key| Self::request_info_to_request(cx, key))
            .transpose()?;

        let mut responses = vec![];

        for (req, resp) in &*entries {
            let response = Response::get_mut_private(cx, &resp.root(cx).into()).unwrap();
            if Self::is_match(
                cx,
                request,
                Request::get_private(cx, &req.root(cx).into()).unwrap(),
                response,
                options,
            ) {
                responses.push(Response::new_object(cx, Box::new(response.try_clone(cx)?)));
            }

            if responses.len() >= max_entries {
                return Ok(responses);
            }
        }

        Ok(responses)
    }

    fn is_match(
        cx: &Context,
        to_match: Option<&Request>,
        key: &Request,
        value: &Response,
        options: &CacheQueryOptions,
    ) -> bool {
        let Some(request) = to_match else {
            return true;
        };

        if request.method() != Method::GET && options.ignore_method != Some(true) {
            return false;
        }

        let mut query_url = request.url().clone();
        let mut cached_url = key.url().clone();

        query_url.set_fragment(None);
        cached_url.set_fragment(None);

        if options.ignore_search == Some(true) {
            query_url.set_query(None);
            cached_url.set_query(None);
        }

        if query_url != cached_url {
            return false;
        }

        if options.ignore_vary == Some(true) || value.get_type().as_str() == "opaque" {
            return true;
        }

        let Some(vary) = value.headers(cx).get(header::VARY) else {
            return true;
        };

        let Ok(vary_header) = vary.to_str() else {
            return false;
        };
        let header_names = vary_header.split(',');

        let query_headers = request.headers(cx);
        let cached_headers = key.headers(cx);

        for header_name in header_names {
            let header_name = header_name.trim();
            let query_value = query_headers.get(header_name);
            let cached_value = cached_headers.get(header_name);
            if query_value != cached_value {
                return false;
            }
        }

        true
    }

    fn request_info_to_request<'cx>(
        cx: &'cx Context,
        request_info: RequestInfo,
    ) -> Result<&'cx Request> {
        let request_obj = match request_info {
            RequestInfo::String(s) => Request::new_object(
                cx,
                Box::new(Request::constructor(
                    cx,
                    RequestInfo::String(s.clone()),
                    Opt(None),
                )?),
            ),
            RequestInfo::Request(r) => r.reflector().get(),
        };
        let request_obj = Object::from(cx.root(request_obj));
        Ok(Request::get_private(cx, &request_obj).unwrap())
    }

    pub async fn put_impl(
        this: TracedHeap<*mut JSObject>,
        mut cx: Context,
        request: TracedHeap<*mut JSObject>,
        response: TracedHeap<*mut JSObject>,
    ) -> Result<()> {
        let request_ref = Request::get_private(&cx, &request.root(&cx).into()).unwrap();
        let response_ref = Response::get_mut_private(&cx, &response.root(&cx).into()).unwrap();

        let url = request_ref.url();
        if url.scheme() != "http" && url.scheme() != "https" {
            ion_err!("Request scheme must be 'http' or 'https'", Normal);
        }

        if request_ref.method() != Method::GET {
            ion_err!("Request method must be 'GET'", Normal);
        }

        if response_ref.get_status() == 206 {
            ion_err!(
                "The response has HTTP status 206, which cannot be cached",
                Type
            );
        }

        if response_ref.get_type().as_str() != "opaque" {
            if let Some(vary) = response_ref.headers(&cx).get(header::VARY) {
                let Ok(vary_header) = vary.to_str() else {
                    ion_err!(
                        "The response has an invalid value for the Vary header",
                        Type
                    );
                };
                let mut values = vary_header.split(',');
                if values.any(|v| v.trim() == "*") {
                    ion_err!(
                        "The response has the 'Vary: *' header, which cannot be cached",
                        Type
                    );
                }
            }
        }

        let response_body = response_ref.take_body()?;
        if let FetchBodyInner::Stream(ref body) = response_body.body {
            if body.is_locked(&cx) || body.is_disturbed(&cx) {
                ion_err!(
                    "The response body must not be locked or disturbed before caching",
                    Type
                );
            }
        }

        let body_bytes;
        (cx, body_bytes) = cx.await_native_cx(|cx| response_body.into_bytes(cx)).await;
        let body_bytes = body_bytes?.unwrap_or_default();

        let response_ref = Response::get_private(&cx, &response.root(&cx).into()).unwrap();

        let this_ref = Self::get_mut_private(&cx, &this.root(&cx).into()).unwrap();
        let request_ref = Request::get_private(&cx, &request.root(&cx).into()).unwrap();
        Self::delete_impl(this_ref.entries_mut(), &cx, request_ref, Opt(None));

        let cached_response = Heap::new(Response::new_object(
            &cx,
            Box::new(response_ref.clone_with_body(Some(FetchBody {
                body: FetchBodyInner::Bytes(body_bytes),
                ..Default::default()
            }))),
        ));

        this_ref
            .entries_mut()
            .push((Heap::new(request.get()), cached_response));

        Ok(())
    }

    pub fn delete_impl(
        mut entries: impl DerefMut<Target = CacheEntryList>,
        cx: &Context,
        key: &Request,
        Opt(options): Opt<CacheQueryOptions>,
    ) -> bool {
        let mut result = false;
        let options = options.unwrap_or_default();
        for i in (0..entries.len()).rev() {
            if Self::is_match(
                cx,
                Some(key),
                Request::get_private(cx, &entries[i].0.root(cx).into()).unwrap(),
                Response::get_private(cx, &entries[i].1.root(cx).into()).unwrap(),
                &options,
            ) {
                entries.remove(i);
                result = true;
            }
        }
        result
    }
}

#[js_class]
impl Cache {
    #[ion(constructor)]
    pub fn constructor() -> Result<Cache> {
        ion_err!("Cannot construct this type", Type)
    }

    #[ion(name = "match")]
    pub fn r#match(
        &self,
        cx: &Context,
        key: RequestInfo,
        Opt(options): Opt<CacheQueryOptions>,
    ) -> Promise {
        Promise::from_result(
            cx,
            Self::match_all_impl(
                self.entries(),
                cx,
                Some(key),
                1,
                &options.unwrap_or_default(),
            )
            .map(|r| {
                if !r.is_empty() {
                    ObjectValue(r[0])
                } else {
                    UndefinedValue()
                }
            }),
        )
    }

    pub fn match_all(
        &self,
        cx: &Context,
        Opt(key): Opt<RequestInfo>,
        Opt(options): Opt<CacheQueryOptions>,
    ) -> Promise {
        Promise::from_result(
            cx,
            Self::match_all_impl(
                self.entries(),
                cx,
                key,
                usize::MAX,
                &options.unwrap_or_default(),
            ),
        )
    }

    pub fn add(&self, cx: &Context, request: RequestInfo) -> Option<Promise> {
        self.add_all(cx, vec![request])
    }

    // TODO: run the requests in parallel
    pub fn add_all(&self, cx: &Context, requests: Vec<RequestInfo>) -> Option<Promise> {
        let this = TracedHeap::new(self.reflector().get());
        let requests = requests
            .into_iter()
            .map(|r| match r {
                RequestInfo::String(s) => Either::Left(s),
                RequestInfo::Request(r) => Either::Right(TracedHeap::new(r.reflector().get())),
            })
            .collect::<Vec<_>>();

        unsafe {
            future_to_promise(cx, move |mut cx| async move {
                for req in &requests {
                    if let Either::Right(req) = req {
                        let req = Request::get_private(&cx, &req.root(&cx).into()).unwrap();

                        let url = req.url();
                        if url.scheme() != "http" && url.scheme() != "https" {
                            ion_err!("Request scheme must be 'http' or 'https'", Normal);
                        }

                        if req.method() != Method::GET {
                            ion_err!("Request method must be 'GET'", Normal);
                        }
                    }
                }

                let mut to_commit: Vec<(TracedHeap<*mut JSObject>, TracedHeap<*mut JSObject>)> =
                    vec![];

                for req in requests {
                    let req_heap = match req {
                        Either::Left(s) => TracedHeap::new(Request::new_object(
                            &cx,
                            Box::new(Request::constructor(
                                &cx,
                                RequestInfo::String(s),
                                Opt(None),
                            )?),
                        )),
                        Either::Right(r) => r.clone(),
                    };
                    let req_obj = &mut req_heap.to_local().into();

                    let req = Request::get_private(&cx, req_obj).unwrap();
                    for (prev_req, prev_resp) in &to_commit {
                        let prev_req =
                            Request::get_private(&cx, &prev_req.to_local().into()).unwrap();
                        let prev_resp =
                            Response::get_private(&cx, &prev_resp.to_local().into()).unwrap();
                        if Cache::is_match(
                            &cx,
                            Some(req),
                            prev_req,
                            prev_resp,
                            &CacheQueryOptions::default(),
                        ) {
                            ion_err!("Cannot cache matching requests with addAll", Normal);
                        }
                    }

                    let response;
                    (cx, response) = cx
                        .await_native_cx(move |cx| {
                            runtime::globals::fetch::fetch_internal(
                                cx,
                                req_obj,
                                runtime::globals::fetch::GLOBAL_CLIENT
                                    .get()
                                    .unwrap()
                                    .clone(),
                            )
                        })
                        .await;

                    let response = Response::get_private(
                        &cx,
                        &cx.root(response.map_err(|e| e.to_error())?).into(),
                    )
                    .unwrap();

                    if !response.get_ok() {
                        ion_err!("A request returned a failure status code", Type);
                    }

                    if response.get_status() == 206 {
                        ion_err!("A request returned HTTP 206, which cannot be cached", Type);
                    }

                    if let Some(vary) = response.headers(&cx).get(header::VARY) {
                        let Ok(vary_header) = vary.to_str() else {
                            ion_err!(
                                "A request returned an invalid value for the Vary header",
                                Type
                            );
                        };
                        let mut values = vary_header.split(',');
                        if values.any(|v| v.trim() == "*") {
                            ion_err!(
                                "A request returned a response with 'Vary: *' header, which cannot be cached",
                                Type
                            );
                        }
                    }

                    to_commit.push((req_heap, TracedHeap::new(response.reflector().get())));
                }

                for (req, resp) in to_commit {
                    let result;
                    let this_clone = this.clone();
                    (cx, result) = cx
                        .await_native_cx(|cx| Self::put_impl(this_clone, cx, req, resp))
                        .await;
                    result?;
                }

                Ok(())
            })
        }
    }

    pub fn put(
        &mut self,
        cx: &Context,
        request: RequestInfo,
        response: &Response,
    ) -> Option<Promise> {
        let this = TracedHeap::new(self.reflector().get());
        let request = match Self::request_info_to_request(cx, request) {
            Ok(x) => x,
            Err(e) => return Some(Promise::rejected(cx, e)),
        };
        let request = TracedHeap::new(request.reflector().get());
        let response = TracedHeap::new(response.reflector().get());
        unsafe { future_to_promise(cx, |cx| Self::put_impl(this, cx, request, response)) }
    }

    pub fn delete(
        &mut self,
        cx: &Context,
        key: RequestInfo,
        options: Opt<CacheQueryOptions>,
    ) -> Promise {
        let request = match Self::request_info_to_request(cx, key) {
            Ok(x) => x,
            Err(e) => return Promise::rejected(cx, e),
        };
        Promise::resolved(
            cx,
            Self::delete_impl(self.entries_mut(), cx, request, options),
        )
    }

    pub fn keys(
        &self,
        cx: &Context,
        Opt(request): Opt<RequestInfo>,
        Opt(options): Opt<CacheQueryOptions>,
    ) -> Promise {
        match request {
            None => Promise::from_result(
                cx,
                self.entries()
                    .iter()
                    .map(|r| {
                        let req = Request::get_mut_private(cx, &r.0.root(cx).into()).unwrap();
                        Result::Ok(Request::new_object(cx, Box::new(req.try_clone(cx)?)))
                    })
                    .collect::<Result<Vec<_>>>(),
            ),
            Some(request) => {
                let request = match Self::request_info_to_request(cx, request) {
                    Ok(x) => x,
                    Err(e) => return Promise::rejected(cx, e),
                };

                let mut result = vec![];
                let options = options.unwrap_or_default();

                for entry in &*self.entries() {
                    let cached_req =
                        Request::get_mut_private(cx, &entry.0.root(cx).into()).unwrap();
                    let cached_resp = Response::get_private(cx, &entry.1.root(cx).into()).unwrap();
                    if Self::is_match(cx, Some(request), cached_req, cached_resp, &options) {
                        match cached_req.try_clone(cx) {
                            Err(e) => return Promise::rejected(cx, e),
                            Ok(r) => {
                                let req_obj = Request::new_object(cx, Box::new(r));
                                result.push(req_obj);
                            }
                        }
                    }
                }

                Promise::resolved(cx, result)
            }
        }
    }
}

pub fn define(cx: &Context, global: &Object) -> bool {
    Cache::init_class(cx, global).0 && cache_storage::define(cx, global)
}
