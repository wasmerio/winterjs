use ion::{module::ModuleLoader, Context};
use mozjs::{jsapi::ReadOnlyCompileOptions, rust::RealmOptions};
use runtime::{
    module::{Loader, StandardModules},
    Runtime, RuntimeBuilder,
};
use self_cell::self_cell;

use crate::{
    request_handlers::{NewRequestHandler, RequestHandler, UserCode},
    sm_utils::{error_report_option_to_anyhow_error, AggregateStandardModules},
};

pub struct ContextWrapper {
    // Important: the context must come first, because it has to be dropped
    // before the runtime, otherwise we get a nasty error at runtime
    cx: Context,
    _rt: mozjs::rust::Runtime,
}

self_cell!(
    pub struct JsAppContextAndRuntime {
        owner: ContextWrapper,

        #[covariant]
        dependent: Runtime,
    }
);

fn compile_options(options: &mut ReadOnlyCompileOptions) {
    options._base.eagerDelazificationStrategy_ =
        mozjs::jsapi::DelazificationOption::ParseEverythingEagerly;
}

impl JsAppContextAndRuntime {
    pub fn build<Ml: ModuleLoader + 'static, Std: StandardModules + 'static>(
        loader: Option<Ml>,
        modules: Option<Std>,
    ) -> Self {
        let rt = mozjs::rust::Runtime::new(crate::sm_utils::ENGINE.clone());
        let cx = Context::from_runtime(&rt);
        unsafe {
            mozjs::jsapi::JS_SetGlobalJitCompilerOption(
                cx.as_ptr(),
                mozjs::jsapi::JSJitCompilerOption::JSJITCOMPILER_PORTABLE_BASELINE_ENABLE,
                1,
            );
            mozjs::jsapi::JS_SetGlobalJitCompilerOption(
                cx.as_ptr(),
                mozjs::jsapi::JSJitCompilerOption::JSJITCOMPILER_PORTABLE_BASELINE_WARMUP_THRESHOLD,
                0,
            );
            // TODO: why do this?
            // mozjs::jsapi::DisableIncrementalGC(cx.as_ptr());
        }
        cx.set_modify_compile_options_callback(Some(compile_options));
        let wrapper = ContextWrapper { _rt: rt, cx };
        Self::new(wrapper, |w| Self::create_runtime(w, loader, modules))
    }

    fn create_runtime<Ml: ModuleLoader + 'static, Std: StandardModules + 'static>(
        wrapper: &ContextWrapper,
        loader: Option<Ml>,
        modules: Option<Std>,
    ) -> Runtime {
        let mut realm_options = RealmOptions::default();
        realm_options.creationOptions_.streams_ = true;
        let rt_builder = RuntimeBuilder::<Ml, Std>::new()
            .microtask_queue()
            .macrotask_queue()
            .realm_options(realm_options);

        let rt_builder = match loader {
            Some(loader) => rt_builder.modules(loader),
            None => rt_builder,
        };

        let rt_builder = match modules {
            Some(modules) => rt_builder.standard_modules(modules),
            None => rt_builder,
        };

        rt_builder.build(&wrapper.cx)
    }

    pub fn cx(&self) -> &Context {
        self.borrow_dependent().cx()
    }

    pub fn rt(&self) -> &Runtime {
        self.borrow_dependent()
    }
}

pub struct JsApp<Handler: RequestHandler> {
    pub context_and_runtime: JsAppContextAndRuntime,
    pub request_handler: Handler,
}

impl<Handler: RequestHandler> JsApp<Handler> {
    pub fn build<NewHandler: NewRequestHandler<InitializedHandler = Handler>>(
        new_handler: NewHandler,
        hardware_concurrency: u32,
        code: &UserCode,
    ) -> anyhow::Result<Self> {
        Self::build_impl(new_handler, hardware_concurrency, code, |h, cx, uc| {
            h.evaluate_scripts(cx, uc)
        })
    }

    pub fn build_specialized<NewHandler: NewRequestHandler<InitializedHandler = Handler>>(
        new_handler: NewHandler,
        hardware_concurrency: u32,
        code: &UserCode,
    ) -> anyhow::Result<Self> {
        Self::build_impl(new_handler, hardware_concurrency, code, |h, cx, uc| {
            h.specialize_with_scripts(cx, uc)
        })
    }

    fn build_impl<NewHandler: NewRequestHandler<InitializedHandler = Handler>>(
        new_handler: NewHandler,
        hardware_concurrency: u32,
        code: &UserCode,
        evaluate_scripts: impl FnOnce(NewHandler, &Context, &UserCode) -> anyhow::Result<Handler>,
    ) -> anyhow::Result<Self> {
        let modules =
            JsAppModules::for_handler(&new_handler, code.is_module_mode(), hardware_concurrency);
        let cx_and_rt =
            JsAppContextAndRuntime::build(modules.module_loader, Some(modules.standard_modules));
        let request_handler = evaluate_scripts(new_handler, cx_and_rt.cx(), code)?;

        Ok(Self {
            context_and_runtime: cx_and_rt,
            request_handler,
        })
    }

    pub async fn warmup(&self) -> anyhow::Result<()> {
        // Wait for any promises resulting from running the script to be resolved, giving
        // scripts a chance to initialize before accepting requests
        // Note we will return the error here if one happens, since an error happening
        // in this stage means the script didn't initialize successfully.
        self.context_and_runtime
            .rt()
            .run_event_loop()
            .await
            .map_err(|e| error_report_option_to_anyhow_error(self.context_and_runtime.cx(), e))
    }

    pub fn cx(&self) -> &Context {
        self.context_and_runtime.cx()
    }

    pub fn rt(&self) -> &Runtime {
        self.context_and_runtime.rt()
    }
}

struct JsAppModules {
    module_loader: Option<Loader>,
    standard_modules: AggregateStandardModules<
        crate::builtins::Modules,
        Box<dyn crate::request_handlers::ByRefStandardModules>,
    >,
}

impl JsAppModules {
    fn for_handler(
        handler: &impl NewRequestHandler,
        is_module_mode: bool,
        hardware_concurrency: u32,
    ) -> Self {
        let module_loader = is_module_mode.then(runtime::module::Loader::default);
        let standard_modules = AggregateStandardModules(
            crate::builtins::Modules {
                include_internal: is_module_mode,
                hardware_concurrency,
            },
            handler.get_standard_modules(),
        );
        JsAppModules {
            module_loader,
            standard_modules,
        }
    }
}
