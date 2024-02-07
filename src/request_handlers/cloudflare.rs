use anyhow::Result;
use ion::{Context, Object};
use runtime::Runtime;

use super::{Either, PendingResponse, ReadyResponse, Request, RequestHandler, UserCode};

#[derive(Clone)]
pub struct CloudflareRequestHandler;

impl RequestHandler for CloudflareRequestHandler {
    fn init_modules(&self, cx: &Context, global: &mut Object) -> bool {
        todo!()
    }

    fn init_globals(&self, cx: &Context, global: &mut Object) -> bool {
        todo!()
    }

    fn evaluate_scripts(&self, cx: &Context, code: &UserCode) -> Result<()> {
        todo!()
    }

    fn start_handling_request(
        &self,
        cx: Context,
        request: Request,
    ) -> Result<Either<PendingResponse, ReadyResponse>> {
        todo!()
    }

    fn finish_request(&self, cx: Context, response: PendingResponse) -> Result<ReadyResponse> {
        todo!()
    }
}
