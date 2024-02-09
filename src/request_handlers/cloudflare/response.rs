use ion::{class::Reflector, ClassDefinition, Context, Result};
use mozjs_sys::jsapi::JSObject;

use crate::ion_err;

type FetchAssetResult = anyhow::Result<hyper::Response<hyper::Body>>;

#[js_class]
pub struct FetchAssetResponse {
    reflector: Reflector,

    #[trace(no_trace)]
    response: Option<FetchAssetResult>,
}

impl FetchAssetResponse {
    pub fn new(response: FetchAssetResult) -> Self {
        Self {
            reflector: Default::default(),
            response: Some(response),
        }
    }

    pub fn new_object(cx: &Context, response: FetchAssetResult) -> *mut JSObject {
        let me = Self::new(response);
        <Self as ClassDefinition>::new_object(cx, Box::new(me))
    }

    pub fn take_response(&mut self) -> Option<FetchAssetResult> {
        self.response.take()
    }
}

#[js_class]
impl FetchAssetResponse {
    #[ion(constructor)]
    pub fn constructor() -> Result<FetchAssetResponse> {
        ion_err!("Cannot construct this type", Type)
    }
}
