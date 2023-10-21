#! /bin/sh

cargo +wasix3 build --target wasm32-wasmer-wasi -r
mv target/wasm32-wasmer-wasi/release/wasmer-winter.wasm x.wasm
wasm-opt x.wasm -o target/wasm32-wasmer-wasi/release/wasmer-winter.wasm -O1 --enable-bulk-memory --enable-threads --enable-reference-types --no-validation --asyncify
rm x.wasm
wasm-strip target/wasm32-wasmer-wasi/release/wasmer-winter.wasm