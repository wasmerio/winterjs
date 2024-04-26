import {
  assert_unreached,
  async_test
} from "../test-utils.js";

async function handleRequest(request) {
  try {
    await Promise.all([
      async_test((t) => {
        let wasPreviouslyCalled = false;

        const handle = setInterval(
          t.step_func(() => {
            if (!wasPreviouslyCalled) {
              wasPreviouslyCalled = true;

              clearInterval(handle);

              // Make the test succeed after the callback would've run next.
              setTimeout(t.done, 750);
            } else {
              assert_unreached();
            }
          }),
          500
        );
      }, "Clearing an interval from the callback should still clear it."),

      async_test((t) => {
        const handle = setTimeout(
          t.step_func(() => {
            assert_unreached("Timeout was not canceled");
          }),
          0
        );

        clearInterval(handle);

        setTimeout(() => {
          t.done();
        }, 100);
      }, "Clear timeout with clearInterval"),

      async_test((t) => {
        const handle = setInterval(
          t.step_func(() => {
            assert_unreached("Interval was not canceled");
          }),
          0
        );

        clearTimeout(handle);

        setTimeout(() => {
          t.done();
        }, 100);
      }, "Clear interval with clearTimeout"),
    ]);

    function timeout_trampoline(t, timeout, message) {
      t.step_timeout(function () {
        // Yield in case we managed to be called before the second interval callback.
        t.step_timeout(function () {
          assert_unreached(message);
        }, timeout);
      }, timeout);
    }

    await async_test(function (t) {
      let ctr = 0;
      let h = setInterval(t.step_func(function () {
        if (++ctr == 2) {
          clearInterval(h);
          t.done();
          return;
        }
      }) /* no interval */);

      timeout_trampoline(t, 100, "Expected setInterval callback to be called two times");
    }, "Calling setInterval with no interval should be the same as if called with 0 interval");

    await async_test(function (t) {
      let ctr = 0;
      let h = setInterval(t.step_func(function () {
        if (++ctr == 2) {
          clearInterval(h);
          t.done();
          return;
        }
      }), undefined);

      timeout_trampoline(t, 100, "Expected setInterval callback to be called two times");
    }, "Calling setInterval with undefined interval should be the same as if called with 0 interval");

    return new Response('All tests passed!');
  }
  catch (e) {
    return new Response(e.toString(), { status: 500 });
  }
}

export { handleRequest };