#! /bin/bash

set -euo pipefail
set -x

wasmer run \
  target/wasm32-wasmer-wasi/debug/winterjs-st.wasm \
  --mapdir /app:tests \
  --net \
  -- \
  /app/simple.js