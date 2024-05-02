use ion::Context;
use runtime::module::{init_global_module, init_module, StandardModules};

pub mod cache;
pub mod core;
pub mod crypto;
pub mod internal_js_modules;
pub mod js_modules;
pub mod performance;
pub mod process;

pub struct Modules {
    pub include_internal: bool,
}

impl Modules {
    fn define_common(cx: &Context, global: &ion::Object) -> bool {
        init_global_module::<modules::Assert>(cx, global)
            && init_global_module::<modules::FileSystem>(cx, global)
            && init_global_module::<modules::PathM>(cx, global)
            && init_global_module::<modules::UrlM>(cx, global)
            && performance::define(cx, global)
            && process::define(cx, global)
            && crypto::define(cx, global)
            && cache::define(cx, global)
    }
}

impl StandardModules for Modules {
    fn init(self, cx: &Context, global: &ion::Object) -> bool {
        let result = init_module::<core::CoreModule>(cx, global) && Self::define_common(cx, global);

        js_modules::define(cx);

        if self.include_internal {
            result && internal_js_modules::define(cx)
        } else {
            result
        }
    }

    fn init_globals(self, cx: &Context, global: &ion::Object) -> bool {
        if self.include_internal {
            tracing::error!(
                "Internal error: trying to initialize internal modules in global object mode"
            );
            return false;
        }

        Self::define_common(cx, global)
    }
}
