use std::{ffi::OsStr, path::Path};

use anyhow::{anyhow, Context as _};
use ion::{module::ModuleLoader, Context, ErrorReport};
use mozjs::rust::{JSEngine, JSEngineHandle, RealmOptions};
use runtime::{module::StandardModules, Runtime, RuntimeBuilder};
use self_cell::self_cell;

pub static ENGINE: once_cell::sync::Lazy<JSEngineHandle> = once_cell::sync::Lazy::new(|| {
    let engine = JSEngine::init().expect("could not create engine");
    let handle = engine.handle();
    std::mem::forget(engine);
    handle
});

#[macro_export]
macro_rules! ion_mk_err {
    ($msg:expr, $ty:ident) => {
        ion::Error::new($msg, ion::ErrorKind::$ty)
    };
}

#[macro_export]
macro_rules! ion_err {
    ($msg:expr, $ty:ident) => {
        return Err($crate::ion_mk_err!($msg, $ty))
    };
}

pub struct ContextWrapper {
    // Important: the context must come first, because it has to be dropped
    // before the runtime, otherwise we get a nasty error at runtime
    cx: Context,
    _rt: mozjs::rust::Runtime,
}

self_cell!(
    pub struct JsApp {
        owner: ContextWrapper,

        #[covariant]
        dependent: Runtime,
    }
);

impl JsApp {
    pub fn build<Ml: ModuleLoader + 'static, Std: StandardModules + 'static>(
        loader: Option<Ml>,
        modules: Option<Std>,
    ) -> Self {
        let rt = mozjs::rust::Runtime::new(ENGINE.clone());
        let cx = Context::from_runtime(&rt);
        let wrapper = ContextWrapper { _rt: rt, cx };
        Self::new(wrapper, |w| Self::create_runtime(w, loader, modules))
    }

    pub fn cx(&self) -> &Context {
        self.borrow_dependent().cx()
    }

    pub fn rt(&self) -> &Runtime {
        self.borrow_dependent()
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
}

pub fn evaluate_script(
    cx: &Context,
    code: impl AsRef<str>,
    file_name: impl AsRef<OsStr>,
) -> anyhow::Result<ion::Value> {
    ion::script::Script::compile_and_evaluate(cx, Path::new(&file_name), code.as_ref())
        .map_err(|e| error_report_to_anyhow_error(cx, e))
}

pub fn evaluate_module(
    cx: &Context,
    path: impl AsRef<Path>,
) -> anyhow::Result<ion::module::Module> {
    let path = path.as_ref();

    let file_name = path
        .file_name()
        .ok_or(anyhow!("Failed to get file name from script path"))
        .map(|f| f.to_string_lossy().into_owned())?;

    let code = std::fs::read_to_string(path).context("Failed to read script file")?;

    Ok(
        ion::module::Module::compile_and_evaluate(cx, &file_name, Some(path), &code)
            .map_err(|e| {
                error_report_option_to_anyhow_error(cx, Some(e.report)).context(format!(
                    "Error while loading module during {:?} step",
                    e.kind
                ))
            })?
            .0,
    )
}

pub fn error_report_to_anyhow_error(cx: &Context, error_report: ErrorReport) -> anyhow::Error {
    match error_report.stack {
        Some(stack) => anyhow::anyhow!(
            "Script error: {}\nat:\n{}",
            error_report.exception.format(cx),
            stack.format()
        ),
        None => anyhow::anyhow!("Runtime error: {}", error_report.exception.format(cx)),
    }
}

pub fn error_report_option_to_anyhow_error(
    cx: &Context,
    error_report: Option<ErrorReport>,
) -> anyhow::Error {
    match error_report {
        Some(e) => error_report_to_anyhow_error(cx, e),
        None => anyhow!("Unknown script error"),
    }
}

// We can't take a list of modules because StandardModules::init takes self by value, which
// means that Vec<dyn StandardModule> is out of the question.
pub struct TwoStandardModules<M1: StandardModules, M2: StandardModules>(pub M1, pub M2);

impl<M1: StandardModules, M2: StandardModules> StandardModules for TwoStandardModules<M1, M2> {
    fn init(self, cx: &ion::Context, global: &ion::Object) -> bool {
        self.0.init(cx, global) && self.1.init(cx, global)
    }

    fn init_globals(self, cx: &ion::Context, global: &ion::Object) -> bool {
        self.0.init_globals(cx, global) && self.1.init_globals(cx, global)
    }
}
