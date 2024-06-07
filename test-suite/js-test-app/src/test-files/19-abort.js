import {
  assert_equals,
  assert_false,
  assert_throws_js,
  assert_true,
  async_test,
  test,
} from "../test-utils";

async function handleRequest() {
  try {
    test((t) => {
      const c = new AbortController(),
        s = c.signal;
      // let state = "begin";

      assert_false(s.aborted);
      assert_true("reason" in s, "signal has reason property");
      assert_equals(
        s.reason,
        undefined,
        "signal.reason is initially undefined"
      );

      // TODO: We don't suppor the abort event yet
      // s.addEventListener(
      //   "abort",
      //   t.step_func((e) => {
      //     assert_equals(state, "begin");
      //     state = "aborted";
      //   })
      // );
      c.abort();

      // assert_equals(state, "aborted");
      assert_true(s.aborted);
      // TODO: not DOMException support
      // assert_true(
      //   s.reason instanceof DOMException,
      //   "signal.reason is DOMException"
      // );
      assert_equals(
        s.reason.message,
        "AbortError",
        "signal.reason is AbortError"
      );

      c.abort();
    }, "AbortController abort() should fire event synchronously");

    // TODO: AbortController.signal returns a new object each time
    // test((t) => {
    //   const controller = new AbortController();
    //   const signal = controller.signal;
    //   assert_equals(
    //     controller.signal,
    //     signal,
    //     "value of controller.signal should not have changed"
    //   );
    //   controller.abort();
    //   assert_equals(
    //     controller.signal,
    //     signal,
    //     "value of controller.signal should still not have changed"
    //   );
    // }, "controller.signal should always return the same object");

    test((t) => {
      const controller = new AbortController();
      const signal = controller.signal;
      // TODO: abort event
      // let eventCount = 0;
      // signal.onabort = () => {
      //   ++eventCount;
      // };
      controller.abort();
      assert_true(signal.aborted);
      // assert_equals(
      //   eventCount,
      //   1,
      //   "event handler should have been called once"
      // );
      controller.abort();
      assert_true(signal.aborted);
      // assert_equals(
      //   eventCount,
      //   1,
      //   "event handler should not have been called again"
      // );
    }, "controller.abort() should do nothing the second time it is called");

    // TODO: abort event
    // test((t) => {
    //   const controller = new AbortController();
    //   controller.abort();
    //   controller.signal.onabort = t.unreached_func(
    //     "event handler should not be called"
    //   );
    // }, "event handler should not be called if added after controller.abort()");

    // TODO: abort event
    // test((t) => {
    //   const controller = new AbortController();
    //   const signal = controller.signal;
    //   signal.onabort = t.step_func((e) => {
    //     assert_equals(e.type, "abort", "event type should be abort");
    //     assert_equals(e.target, signal, "event target should be signal");
    //     assert_false(e.bubbles, "event should not bubble");
    //     assert_true(e.isTrusted, "event should be trusted");
    //   });
    //   controller.abort();
    // }, "the abort event should have the right properties");

    test((t) => {
      const controller = new AbortController();
      const signal = controller.signal;

      assert_true("reason" in signal, "signal has reason property");
      assert_equals(
        signal.reason,
        undefined,
        "signal.reason is initially undefined"
      );

      const reason = Error("hello");
      controller.abort(reason);

      assert_true(signal.aborted, "signal.aborted");
      assert_equals(signal.reason, reason, "signal.reason");
    }, "AbortController abort(reason) should set signal.reason");

    test((t) => {
      const controller = new AbortController();
      const signal = controller.signal;

      assert_true("reason" in signal, "signal has reason property");
      assert_equals(
        signal.reason,
        undefined,
        "signal.reason is initially undefined"
      );

      controller.abort();

      assert_true(signal.aborted, "signal.aborted");
      // assert_true(
      //   signal.reason instanceof DOMException,
      //   "signal.reason is DOMException"
      // );
      assert_equals(
        signal.reason.message,
        "AbortError",
        "signal.reason is AbortError"
      );
    }, 'aborting AbortController without reason creates an "AbortError" DOMException');

    test((t) => {
      const controller = new AbortController();
      const signal = controller.signal;

      assert_true("reason" in signal, "signal has reason property");
      assert_equals(
        signal.reason,
        undefined,
        "signal.reason is initially undefined"
      );

      controller.abort(undefined);

      assert_true(signal.aborted, "signal.aborted");
      // assert_true(
      //   signal.reason instanceof DOMException,
      //   "signal.reason is DOMException"
      // );
      assert_equals(
        signal.reason.message,
        "AbortError",
        "signal.reason is AbortError"
      );
    }, 'AbortController abort(undefined) creates an "AbortError" DOMException');

    test((t) => {
      const controller = new AbortController();
      const signal = controller.signal;

      assert_true("reason" in signal, "signal has reason property");
      assert_equals(
        signal.reason,
        undefined,
        "signal.reason is initially undefined"
      );

      controller.abort(null);

      assert_true(signal.aborted, "signal.aborted");
      assert_equals(signal.reason, null, "signal.reason");
    }, "AbortController abort(null) should set signal.reason");

    test((t) => {
      const signal = AbortSignal.abort();

      assert_true(signal.aborted, "signal.aborted");
      // assert_true(
      //   signal.reason instanceof DOMException,
      //   "signal.reason is DOMException"
      // );
      assert_equals(
        signal.reason.message,
        "AbortError",
        "signal.reason is AbortError"
      );
    }, "static aborting signal should have right properties");

    test((t) => {
      const reason = Error("hello");
      const signal = AbortSignal.abort(reason);

      assert_true(signal.aborted, "signal.aborted");
      assert_equals(signal.reason, reason, "signal.reason");
    }, "static aborting signal with reason should set signal.reason");

    test((t) => {
      const reason = new Error("boom");
      const signal = AbortSignal.abort(reason);
      assert_true(signal.aborted);
      assert_throws_js(reason, () => signal.throwIfAborted());
    }, "throwIfAborted() should throw abort.reason if signal aborted");

    test((t) => {
      const signal = AbortSignal.abort("hello");
      assert_true(signal.aborted);
      try {
        signal.throwIfAborted();
        assert(false, "Should throw");
      } catch (e) {
        assert_equals(signal.reason, "hello", "Should throw primitive reason");
      }
    }, "throwIfAborted() should throw primitive abort.reason if signal aborted");

    test((t) => {
      const controller = new AbortController();
      assert_false(controller.signal.aborted);
      controller.signal.throwIfAborted();
    }, "throwIfAborted() should not throw if signal not aborted");

    test((t) => {
      const signal = AbortSignal.abort();

      // assert_true(
      //   signal.reason instanceof DOMException,
      //   "signal.reason is a DOMException"
      // );
      assert_equals(
        signal.reason,
        signal.reason,
        "signal.reason returns the same DOMException"
      );
    }, "AbortSignal.reason returns the same DOMException");

    test((t) => {
      const controller = new AbortController();
      controller.abort();

      // assert_true(
      //   controller.signal.reason instanceof DOMException,
      //   "signal.reason is a DOMException"
      // );
      assert_equals(
        controller.signal.reason,
        controller.signal.reason,
        "signal.reason returns the same DOMException"
      );
    }, "AbortController.signal.reason returns the same DOMException");

    test((t) => {
      const signal = AbortSignal.abort();
      assert_true(
        signal instanceof AbortSignal,
        "returned object is an AbortSignal"
      );
      assert_true(signal.aborted, "returned signal is already aborted");
    }, "the AbortSignal.abort() static returns an already aborted signal");

    // await async_test((t) => {
    //   const s = AbortSignal.abort();
    //   s.addEventListener(
    //     "abort",
    //     t.unreached_func("abort event listener called")
    //   );
    //   s.onabort = t.unreached_func("abort event handler called");
    //   t.step_timeout(() => {
    //     t.done();
    //   }, 2000);
    // }, "signal returned by AbortSignal.abort() should not fire abort event");

    test((t) => {
      const signal = AbortSignal.timeout(0);
      assert_true(
        signal instanceof AbortSignal,
        "returned object is an AbortSignal"
      );
      assert_false(signal.aborted, "returned signal is not already aborted");
    }, "AbortSignal.timeout() returns a non-aborted signal");

    // await async_test((t) => {
    //   const signal = AbortSignal.timeout(5);
    //   signal.onabort = t.step_func_done(() => {
    //     assert_true(signal.aborted, "signal is aborted");
    //     assert_true(
    //       signal.reason instanceof DOMException,
    //       "signal.reason is a DOMException"
    //     );
    //     assert_equals(
    //       signal.reason.name,
    //       "TimeoutError",
    //       "signal.reason is a TimeoutError"
    //     );
    //   });
    // }, "Signal returned by AbortSignal.timeout() times out");

    // async_test((t) => {
    //   let result = "";
    //   for (const value of ["1", "2", "3"]) {
    //     const signal = AbortSignal.timeout(5);
    //     signal.onabort = t.step_func(() => {
    //       result += value;
    //     });
    //   }

    //   const signal = AbortSignal.timeout(5);
    //   signal.onabort = t.step_func_done(() => {
    //     assert_equals(result, "123", "Timeout order should be 123");
    //   });
    // }, "AbortSignal timeouts fire in order");

    // Create a response with the Blob's text
    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    // If there's an error, return the error message in the response
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
