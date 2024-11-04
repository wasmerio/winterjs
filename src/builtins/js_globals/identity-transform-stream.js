// This is technically cloudflare-only (see: https://developers.cloudflare.com/workers/runtime-apis/streams/transformstream/#identitytransformstream)
// By putting it here we're making it available to WinterCG mode apps as well, but there's (hopefully!) no harm in having extra APIs.

class IdentityTransformStream extends TransformStream {
  constructor() {
    super({
      transform: (chunk, controller) => controller.enqueue(chunk),
    });
  }
}
