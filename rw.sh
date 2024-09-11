#! /bin/bash

set -euo pipefail
set -x

./weval-only.sh
wasmer run w-weav.wasm --net