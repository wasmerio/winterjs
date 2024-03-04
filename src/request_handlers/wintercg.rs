use anyhow::{bail, Result};
use ion::{Context, Object, Value};

use crate::sm_utils;

use super::{
    ByRefStandardModules, Either, PendingResponse, ReadyResponse, Request, RequestHandler, UserCode,
};

#[derive(Clone, Copy)]
pub struct WinterCGRequestHandler;

impl RequestHandler for WinterCGRequestHandler {
    fn get_standard_modules(&self) -> Box<dyn ByRefStandardModules> {
        Box::new(WinterCGStandardModules)
    }

    fn evaluate_scripts(&mut self, cx: &Context, code: &UserCode) -> Result<()> {
        match code {
            UserCode::Script { code, file_name } => {
                sm_utils::evaluate_script(cx, code, file_name)?;
            }
            UserCode::Module(path) => {
                sm_utils::evaluate_module(cx, path)?;
            }
            UserCode::Directory(_) => bail!("WinterCG mode does not support directories"),
        };

        Ok(())
    }

    fn start_handling_request(
        &mut self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        super::service_workers::start_request(&cx, request)
    }

    fn finish_fulfilled_request(
        &mut self,
        cx: Context,
        val: Value,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        if !val.handle().is_object() {
            bail!("Script error: value provided to respondWith was not an object");
        }
        super::service_workers::build_response(&cx, val.to_object(&cx)).map(Either::Right)
    }
}

struct WinterCGStandardModules;

impl ByRefStandardModules for WinterCGStandardModules {
    fn init_modules(&self, cx: &Context, global: &Object) -> bool {
        self.init_globals(cx, global)
    }

    fn init_globals(&self, cx: &Context, global: &Object) -> bool {
        super::service_workers::define(cx, global)
    }
}
