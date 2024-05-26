import { assert_equals } from "../test-utils";

async function handleRequest(request) {
  try {
    const TEST_EVENT1 = "testEvent1";
    const TEST_EVENT2 = "testEvent2";

    const target = new EventTarget();
    const testEvent1 = new Event(TEST_EVENT1);
    const testEvent2 = new Event(TEST_EVENT2);

    let testEvent1CalledCount = 0;
    const testEvent1CallBack = () => {
      testEvent1CalledCount++;
    };

    let testEvent2CalledCount = 0;
    const testEvent2CallBack = () => {
      testEvent2CalledCount++;
    };

    target.addEventListener(TEST_EVENT1, testEvent1CallBack);
    target.addEventListener(TEST_EVENT2, testEvent2CallBack);

    // Check if dispatch can be executed successfully
    target.dispatchEvent(testEvent1);
    assert_equals(
      testEvent1CalledCount,
      1,
      "test event 1 callback was not called"
    );

    // Check if dispatch isn't executed when other event target was executed
    assert_equals(
      testEvent2CalledCount,
      0,
      "test event 2 callback was unexpectedly called"
    );

    // Check if dispatch can be executed successfully
    target.dispatchEvent(testEvent2);
    assert_equals(
      testEvent2CalledCount,
      1,
      "test event 2 callback was not called"
    );

    // Check if dispatch isn't executed when eventListener was removed
    target.removeEventListener(TEST_EVENT1, testEvent1CallBack);
    target.dispatchEvent(testEvent1);
    assert_equals(
      testEvent1CalledCount,
      1,
      "test event 1 callback was unexpectedly called"
    );

    // Check if dispatch can be executed successfully when other eventListener was remove
    target.dispatchEvent(testEvent2);
    assert_equals(
      testEvent2CalledCount,
      2,
      "test event 2 callback was not called"
    );

    // Check if dispatch isn't executed when eventListener was removed
    target.removeEventListener(TEST_EVENT2, testEvent2CallBack);
    target.dispatchEvent(testEvent2);
    assert_equals(
      testEvent2CalledCount,
      2,
      "test event 2 callback was unexpectedly called"
    );

    return new Response("All tests passed!");
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
