const assert = (condition, message) => {
  if (!condition) {
    let msg = typeof (message) === 'function' ? message() : (message || "Assertion failed");
    throw new Error(msg);
  }
};

const assert_true = (condition, message) => {
  if (condition !== true) {
    throw new Error(message || "Assertion failed");
  }
}

const assert_false = (condition, message) => {
  if (condition !== false) {
    throw new Error(message || "Assertion failed");
  }
}

const assert_array_equals = (array1, array2, message) => {
  if (array1.length != array2.length || array1.length === undefined) {
    throw new Error(`Expected ${array1} to be equal to ${array2}: ${message}`);
  }

  for (let i in array1) {
    if (array1[i] != array2[i]) {
      throw new Error(`Expected ${array1} to be equal to ${array2}: ${message}`);
    }
  }

  // Make sure array2 has no keys that array1 doesn't
  for (let i in array2) {
    if (array1[i] != array2[i]) {
      throw new Error(`Expected ${array1} to be equal to ${array2}: ${message}`);
    }
  }
}

const assert_unreached = (message) => {
  throw new Error(message || "Assertion failed: should not be reached");
}

const assert_throws_js = (f, message) => {
  try {
    f();
    throw undefined;
  }
  catch (e) {
    if (e === undefined) {
      throw new Error(`Should have thrown error: ${message}`);
    }
  }
}

const assert_equals = (actual, expected, message) => {
  assert(
    actual === expected,
    () => `Expected ${expected} but got ${actual}: ${message}`
  );
};

const assert_not_equals = (actual, expected, message) => {
  assert(
    actual !== expected,
    () => `Expected ${expected} to be unequal to ${actual}: ${message}`
  );
};

const assert_less_than = (v1, v2, message) => {
  assert(
    v1 < v2,
    message || `Expected ${v1} to be greater than or equal to ${v1}`
  );
}

const assert_less_than_equal = (v1, v2, message) => {
  assert(
    v1 <= v2,
    message || `Expected ${v1} to be greater than or equal to ${v1}`
  );
}

const assert_greater_than = (v1, v2, message) => {
  assert(
    v1 > v2,
    message || `Expected ${v1} to be greater than or equal to ${v1}`
  );
}

const assert_greater_than_equal = (v1, v2, message) => {
  assert(
    v1 >= v2,
    message || `Expected ${v1} to be greater than or equal to ${v1}`
  );
}

const test = (f, desc) => {
  try {
    f();
  }
  catch (e) {
    throw new Error(`Test ${desc} failed with ${e}`);
  }
}

const promise_test = async (f, desc) => {
  try {
    await f();
  }
  catch (e) {
    throw new Error(`Test ${desc} failed with ${e}`);
  }
}

const promise_rejects_exactly = async (error, p, message) => {
  try {
    await p;
    throw undefined;
  } catch (e) {
    if (e === undefined) {
      throw new Error(`Promise should throw but succeeded: ${message}`);
    } else if (e !== error) {
      throw new Error(`Promise should reject with ${error} but rejected with ${e}: ${message}`);
    }
  }
}

const readStream = async (stream) => {
  let reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let result = "";
  while (true) {
    let chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    result += chunk.value.toString();
  }
  return result;
}

const readableStreamFromArray = arr => {
  let s = new ReadableStream({
    start: controller => {
      for (let a of arr) {
        controller.enqueue(a);
      }
      controller.close();
    }
  })
  return s;
}

const readableStreamToArray = async stream => {
  let reader = stream.getReader();
  let result = [];
  while (true) {
    let chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    result.push(chunk.value);
  }
  return result;
}

const async_test = (f) => {
  let resolve, reject;
  let p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  let t = {
    step_func: (f) => {
      return () => {
        try {
          f();
        } catch (e) {
          reject(e);
        }
      };
    },
    step_timeout: (f, t) => {
      setTimeout(() => {
        try {
          f();
        } catch (e) {
          reject(e);
        }
      }, t);
    },
    done: () => {
      resolve();
    }
  };

  f(t);

  return p;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const flushAsyncEvents = () => delay(0).then(() => delay(0)).then(() => delay(0)).then(() => delay(0));

export {
  assert,
  assert_array_equals,
  assert_equals,
  assert_not_equals,
  assert_greater_than,
  assert_greater_than_equal,
  assert_less_than,
  assert_less_than_equal,
  assert_false,
  assert_throws_js,
  assert_true,
  assert_unreached,
  delay,
  flushAsyncEvents,
  promise_test,
  promise_rejects_exactly,
  test,
  readStream,
  readableStreamFromArray,
  readableStreamToArray,
  async_test,
};