use ion::Heap;
use ion::{class::Reflector, ClassDefinition, Context, Promise};
use mozjs::jsapi::JSObject;

#[js_class]
pub struct FetchEvent {
    reflector: Reflector,
    pub(crate) request: Heap<*mut JSObject>,
    pub(crate) response: Option<Heap<*mut JSObject>>,
}

impl FetchEvent {
    pub fn try_new(cx: &Context, request: super::super::Request) -> anyhow::Result<Self> {
        let request = Heap::new(super::super::build_fetch_request(cx, request)?);

        Ok(Self {
            reflector: Default::default(),
            request,
            response: None,
        })
    }
}

#[js_class]
impl FetchEvent {
    #[ion(constructor)]
    pub fn constructor() -> ion::Result<FetchEvent> {
        Err(ion::Error::new(
            "Cannot construct this class",
            ion::ErrorKind::Type,
        ))
    }

    #[ion(get)]
    pub fn get_request(&self) -> *mut JSObject {
        self.request.get()
    }

    #[ion(name = "respondWith")]
    pub fn respond_with(&mut self, cx: &Context, response: ion::Value) -> ion::Result<()> {
        match self.response {
            None => {
                if response.handle().is_object() {
                    let obj = response.handle().to_object();
                    let rooted = cx.root_object(obj);
                    if Promise::is_promise(&rooted)
                        || runtime::globals::fetch::Response::instance_of(cx, &rooted.into(), None)
                    {
                        self.response = Some(Heap::new(obj));
                        Ok(())
                    } else {
                        Err(ion::Error::new(
                            "Value must be a promise or an instance of Response",
                            ion::ErrorKind::Type,
                        ))
                    }
                } else {
                    Err(ion::Error::new(
                        "Value must be a promise or an instance of Response",
                        ion::ErrorKind::Type,
                    ))
                }
            }
            Some(_) => Err(ion::Error::new(
                "Response was already provided once",
                ion::ErrorKind::Normal,
            )),
        }
    }

    #[ion(name = "waitUntil")]
    pub fn wait_until(&self, _promise: ion::Promise) {
        // No need to do anything, the runtime will run the promise anyway
    }
}
