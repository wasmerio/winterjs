#! /bin/sh

set -euo pipefail
set -x

# Note: cargo-wasix automatically runs wasm-opt with -O2, which makes the resulting binary unusable.
# Instead, we use the toolchain to build (cargo +wasix instead of cargo wasix) and optimize manually.
cargo +wasix build --target wasm32-wasmer-wasi -r
mv target/wasm32-wasmer-wasi/release/winterjs.wasm x.wasm
# In single-thread-only builds, we skip --asyncify
wasm-opt x.wasm -o target/wasm32-wasmer-wasi/release/winterjs-st.wasm -O1 --enable-bulk-memory --enable-reference-types --no-validation
rm x.wasm
wasm-strip target/wasm32-wasmer-wasi/release/winterjs-st.wasm