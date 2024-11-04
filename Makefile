SOURCES := $(shell find src -type f)
SOURCES += Cargo.toml
SOURCES += Cargo.lock

clean:
	rm -rf build

build/winterjs-mt.wasm: $(SOURCES)
	mkdir -p build/temp
	cargo +wasix build --target wasm32-wasmer-wasi -r $(WINTERJS_BUILD_ARGS)
	mv target/wasm32-wasmer-wasi/release/winterjs.wasm build/temp/x.wasm
	wasm-opt build/temp/x.wasm -o $@ \
		-O1 --enable-bulk-memory --enable-threads \
		--enable-reference-types --no-validation \
		--asyncify
	rm build/temp/x.wasm
	wasm-strip $@

build/winterjs-mt-debug.wasm: $(SOURCES)
	mkdir -p build/temp
	cargo +wasix build --target wasm32-wasmer-wasi $(WINTERJS_BUILD_ARGS)
	mv target/wasm32-wasmer-wasi/debug/winterjs.wasm build/temp/x.wasm
	wasm-opt build/temp/x.wasm -o $@ \
		-O1 --enable-bulk-memory --enable-threads \
		--enable-reference-types --no-validation \
		--asyncify
	rm build/temp/x.wasm
	wasm-strip $@

build/winterjs-st.wasm: $(SOURCES)
	mkdir -p build/temp
	cargo +wasix build --target wasm32-wasmer-wasi -r $(WINTERJS_BUILD_ARGS)
	mv target/wasm32-wasmer-wasi/release/winterjs.wasm build/temp/x.wasm
	wasm-opt build/temp/x.wasm -o $@ \
		-O1 --enable-bulk-memory --enable-threads \
		--enable-reference-types --no-validation
	rm build/temp/x.wasm
	wasm-strip $@

build/winterjs-st-debug.wasm: $(SOURCES)
	mkdir -p build/temp
	cargo +wasix build --target wasm32-wasmer-wasi $(WINTERJS_BUILD_ARGS)
	mv target/wasm32-wasmer-wasi/debug/winterjs.wasm build/temp/x.wasm
	wasm-opt build/temp/x.wasm -o $@ \
		-O1 --enable-bulk-memory --enable-threads \
		--enable-reference-types --no-validation
	rm build/temp/x.wasm
	wasm-strip $@

build/generate-asyncify-response-file:
	mkdir -p build/temp
	cd crates/generate-asyncify-response-file && cargo build -r
	mv crates/generate-asyncify-response-file/target/release/generate-asyncify-response-file $@

build/temp/winterjs-weval.wasm: $(SOURCES)
	cargo +wasix build --target wasm32-wasmer-wasi -r -F weval $(WINTERJS_BUILD_ARGS)
	mv target/wasm32-wasmer-wasi/release/winterjs.wasm $@

build/asyncify-response.txt: build/generate-asyncify-response-file build/temp/winterjs-weval.wasm
	build/generate-asyncify-response-file \
		build/temp/winterjs-weval.wasm \
		-o $@ \
		-l asyncify-functions.txt

build/winterjs-weval.wasm: build/asyncify-response.txt build/temp/winterjs-weval.wasm
	wasm-opt build/temp/winterjs-weval.wasm -o $@ \
		-O1 --enable-bulk-memory --enable-reference-types --no-validation \
		--asyncify \
		--pass-arg=asyncify-ignore-imports \
		--pass-arg=asyncify-ignore-indirect \
		--pass-arg=asyncify-addlist@@build/asyncify-response.txt \
		--pass-arg=asyncify-propagate-addlist

	wasm-strip $@

