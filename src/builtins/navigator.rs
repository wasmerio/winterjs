use ion::{class::Reflector, flags::PropertyFlags, ClassDefinition, Context, Result, Value};

use crate::ion_err;

#[js_class]
pub struct Navigator {
    reflector: Reflector,

    concurrency: u32,
    language: String,
}

#[js_class]
impl Navigator {
    #[ion(constructor)]
    pub fn constructor() -> Result<Navigator> {
        ion_err!("Cannot construct this type", Type)
    }

    #[ion(get, name = "userAgent")]
    pub fn get_user_agent(&self) -> &'static str {
        "WinterJS"
    }

    #[ion(get)]
    pub fn get_platform(&self) -> &'static str {
        "WASIX-Wasm32"
    }

    #[ion(get, name = "hardwareConcurrency")]
    pub fn get_hardware_concurrency(&self) -> u32 {
        self.concurrency
    }

    #[ion(get)]
    pub fn get_language(&self) -> &str {
        &self.language
    }

    #[ion(get)]
    pub fn get_languages(&self) -> Vec<&str> {
        vec![&self.language]
    }
}

pub fn define(cx: &Context, global: &ion::Object, concurrency: u32) -> bool {
    if !Navigator::init_class(cx, global).0 {
        return false;
    }

    let navigator = Navigator::new_rooted(
        cx,
        Box::new(Navigator {
            reflector: Default::default(),
            concurrency,
            language: sys_locale::get_locale().unwrap_or("en-US".into()),
        }),
    );

    global.define(
        cx,
        "navigator",
        &Value::object(cx, &navigator),
        PropertyFlags::ENUMERATE,
    )
}
