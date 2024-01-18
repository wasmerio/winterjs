import { assert_equals, assert_throws_js, assert_true, test } from "../test-utils";

async function handleRequest(request) {
    try {
        const iterations = 256;
        // Track all the UUIDs generated during test run, bail if we ever collide:
        const uuids = new Set()
        function randomUUID() {
            const uuid = crypto.randomUUID();
            if (uuids.has(uuid)) {
                throw new Error(`uuid collision ${uuid}`)
            }
            uuids.add(uuid);
            return uuid;
        }

        // UUID is in namespace format (16 bytes separated by dashes):
        test(function () {
            const UUIDRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
            for (let i = 0; i < iterations; i++) {
                assert_true(UUIDRegex.test(randomUUID()));
            }
        }, "namespace format");

        // Set the 4 most significant bits of array[6], which represent the UUID
        // version, to 0b0100:
        test(function () {
            for (let i = 0; i < iterations; i++) {
                let value = parseInt(randomUUID().split('-')[2].slice(0, 2), 16);
                value &= 0b11110000;
                assert_true(value === 0b01000000);
            }
        }, "version set");

        // Set the 2 most significant bits of array[8], which represent the UUID
        // variant, to 0b10:
        test(function () {
            for (let i = 0; i < iterations; i++) {
                // Grab the byte representing array[8]:
                let value = parseInt(randomUUID().split('-')[3].slice(0, 2), 16);
                value &= 0b11000000
                assert_true(value === 0b10000000);
            }
        }, "variant set");

        test(function () {
            assert_throws_js(function () {
                crypto.getRandomValues(new Float32Array(6))
            }, "Float32Array")
            assert_throws_js(function () {
                crypto.getRandomValues(new Float64Array(6))
            }, "Float64Array")

            assert_throws_js(function () {
                const len = 65536 / Float32Array.BYTES_PER_ELEMENT + 1;
                crypto.getRandomValues(new Float32Array(len));
            }, "Float32Array (too long)")
            assert_throws_js(function () {
                const len = 65536 / Float64Array.BYTES_PER_ELEMENT + 1;
                crypto.getRandomValues(new Float64Array(len))
            }, "Float64Array (too long)")
        }, "Float arrays");

        test(function () {
            assert_throws_js(function () {
                crypto.getRandomValues(new DataView(new ArrayBuffer(6)))
            }, "DataView")

            assert_throws_js(function () {
                crypto.getRandomValues(new DataView(new ArrayBuffer(65536 + 1)))
            }, "DataView (too long)")
        }, "DataView");

        const arrays = [
            'Int8Array',
            'Int16Array',
            'Int32Array',
            'BigInt64Array',
            'Uint8Array',
            'Uint8ClampedArray',
            'Uint16Array',
            'Uint32Array',
            'BigUint64Array',
        ];

        for (const array of arrays) {
            const ctor = globalThis[array];

            test(function () {
                assert_equals(crypto.getRandomValues(new ctor(8)).constructor,
                    ctor, "crypto.getRandomValues(new " + array + "(8))")
            }, "Integer array: " + array);

            test(function () {
                const maxLength = 65536 / ctor.BYTES_PER_ELEMENT;
                assert_throws_js(function () {
                    crypto.getRandomValues(new ctor(maxLength + 1))
                }, "crypto.getRandomValues length over 65536")
            }, "Large length: " + array);

            test(function () {
                assert_true(crypto.getRandomValues(new ctor(0)).length == 0)
            }, "Null arrays: " + array);
        }

        return new Response('All Tests Passed!');
    }
    catch (e) {
        return new Response(e.toString(), { status: 500 });
    }
}

export { handleRequest };