use futures::future::Either;
use http::{header, Method};
use ion::{
    class::{NativeObject, Reflector},
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

mod cache_storage;

#[derive(FromValue, Default)]
pub struct CacheQueryOptions {
    pub ignore_search: Option<bool>,
    pub ignore_method: Option<bool>,
    pub ignore_vary: Option<bool>,
}

#[js_class]
#[derive(Default)]
pub struct Cache {
    reflector: Reflector,

    entries: Vec<(Heap<*mut JSObject>, Heap<*mut JSObject>)>, // (Request, Response)
}

impl Cache {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn match_all_impl(
        &self,
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

        for (req, resp) in &self.entries {
            let response = Response::get_mut_private(&mut resp.root(cx).into());
            if Self::is_match(
                cx,
                request,
                Request::get_private(&req.root(cx).into()),
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

        if options.ignore_vary == Some(true) {
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
                    None,
                )?),
            ),
            RequestInfo::Request(r) => r.reflector().get(),
        };
        let request_obj = Object::from(cx.root_object(request_obj));
        Ok(Request::get_private(&request_obj))
    }

    pub async fn put_impl(
        this: TracedHeap<*mut JSObject>,
        mut cx: Context,
        request: TracedHeap<*mut JSObject>,
        response: TracedHeap<*mut JSObject>,
    ) -> Result<()> {
        let request_ref = Request::get_private(&request.root(&cx).into());
        let response_ref = Response::get_mut_private(&mut response.root(&cx).into());

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

        let response_ref = Response::get_private(&response.root(&cx).into());

        let this_ref = Self::get_mut_private(&mut this.root(&cx).into());
        let request_ref = Request::get_private(&request.root(&cx).into());
        this_ref.delete_impl(&cx, request_ref, None)?;

        let cached_response = Heap::new(Response::new_object(
            &cx,
            Box::new(response_ref.clone_with_body(Some(FetchBody {
                body: FetchBodyInner::Bytes(body_bytes),
                ..Default::default()
            }))),
        ));

        this_ref
            .entries
            .push((Heap::new(request.get()), cached_response));

        Ok(())
    }

    pub fn delete_impl(
        &mut self,
        cx: &Context,
        key: &Request,
        options: Option<CacheQueryOptions>,
    ) -> Result<()> {
        let options = options.unwrap_or_default();
        for i in (0..self.entries.len()).rev() {
            if Self::is_match(
                cx,
                Some(key),
                Request::get_private(&self.entries[i].0.root(cx).into()),
                Response::get_private(&self.entries[i].1.root(cx).into()),
                &options,
            ) {
                self.entries.remove(i);
            }
        }
        Ok(())
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
        options: Option<CacheQueryOptions>,
    ) -> Promise {
        Promise::new_from_result(
            cx,
            self.match_all_impl(cx, Some(key), 1, &options.unwrap_or_default())
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
        key: Option<RequestInfo>,
        options: Option<CacheQueryOptions>,
    ) -> Promise {
        Promise::new_from_result(
            cx,
            self.match_all_impl(cx, key, usize::MAX, &options.unwrap_or_default()),
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
                        let req = Request::get_private(&req.root(&cx).into());

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
                            Box::new(Request::constructor(&cx, RequestInfo::String(s), None)?),
                        )),
                        Either::Right(r) => r.clone(),
                    };
                    let req_obj = &mut req_heap.to_local().into();
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
                        &cx.root_object(response.map_err(|e| e.to_error())?).into(),
                    );

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
            Err(e) => return Some(Promise::new_rejected(cx, e)),
        };
        let request = TracedHeap::new(request.reflector().get());
        let response = TracedHeap::new(response.reflector().get());
        unsafe { future_to_promise(cx, |cx| Self::put_impl(this, cx, request, response)) }
    }

    pub fn delete(
        &mut self,
        cx: &Context,
        key: RequestInfo,
        options: Option<CacheQueryOptions>,
    ) -> Promise {
        let request = match Self::request_info_to_request(cx, key) {
            Ok(x) => x,
            Err(e) => return Promise::new_rejected(cx, e),
        };
        Promise::new_from_result(cx, self.delete_impl(cx, request, options))
    }

    pub fn keys(
        &self,
        cx: &Context,
        request: Option<RequestInfo>,
        options: Option<CacheQueryOptions>,
    ) -> Promise {
        match request {
            None => Promise::new_from_result(
                cx,
                self.entries
                    .iter()
                    .map(|r| {
                        let req = Request::get_mut_private(&mut r.0.root(cx).into());
                        Result::Ok(Request::new_object(cx, Box::new(req.try_clone(cx)?)))
                    })
                    .collect::<Result<Vec<_>>>(),
            ),
            Some(request) => {
                let request = match Self::request_info_to_request(cx, request) {
                    Ok(x) => x,
                    Err(e) => return Promise::new_rejected(cx, e),
                };

                let mut result = vec![];
                let options = options.unwrap_or_default();

                for entry in &self.entries {
                    let cached_req = Request::get_mut_private(&mut entry.0.root(cx).into());
                    let cached_resp = Response::get_private(&entry.1.root(cx).into());
                    if Self::is_match(cx, Some(request), cached_req, cached_resp, &options) {
                        match cached_req.try_clone(cx) {
                            Err(e) => return Promise::new_rejected(cx, e),
                            Ok(r) => {
                                let req_obj = Request::new_object(cx, Box::new(r));
                                result.push(req_obj);
                            }
                        }
                    }
                }

                Promise::new_resolved(cx, result)
            }
        }
    }
}

pub fn define(cx: &Context, global: &mut Object) -> bool {
    Cache::init_class(cx, global).0 && cache_storage::define(cx, global)
}
