#! /bin/bash

set -euo pipefail
set -x

rm w-wize.wasm || true
rm w-weav.wasm || true

echo "Wizening module"
../wizex/target/release/wizex \
    target/wasm32-wasmer-wasi/debug/winterjs-wevalable.wasm \
    -o w-wize.wasm \
    -r _start=wizex.resume \
    --allow-wasix \
    --inherit-stdio true \
    --mapdir /app::./tests \
    --wasm-bulk-memory true \
    --preload weval=../wevalx/lib/weval-stubs.wat

echo "Pre-evaluating module"
../wevalx/target/release/wevalx weval \
    -i w-wize.wasm \
    -o w-weav.wasm \
    &> w-output.log