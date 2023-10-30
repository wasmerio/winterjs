#! /bin/sh

# Note: cargo-wasix automatically runs wasm-opt with -O2, which makes the resulting binary unusable.
# Instead, we use the toolchain to build (cargo +wasix instead of cargo wasix) and optimize manually.
cargo +wasix build --target wasm32-wasmer-wasi -r
mv target/wasm32-wasmer-wasi/release/wasmer-winter.wasm x.wasm
wasm-opt x.wasm -o target/wasm32-wasmer-wasi/release/wasmer-winter.wasm -O1 --enable-bulk-memory --enable-threads --enable-reference-types --no-validation --asyncify
rm x.wasm
wasm-strip target/wasm32-wasmer-wasi/release/wasmer-winter.wasm