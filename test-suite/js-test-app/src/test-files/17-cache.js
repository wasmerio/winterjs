import { assert_array_equals, assert_class_string, assert_equals, assert_false, assert_not_equals, assert_throws_js, assert_true, assert_unreached, promise_rejects_js, promise_test } from "../test-utils";

const winterTestsBaseUrl = process.env.TESTS_BACKEND_URL;

// This will log the URL as the script is initially parsed, regardless of whether
// any tests in this file will actually be run
console.log('Tests backend base URL is: ' + winterTestsBaseUrl);

async function handleRequest(request) {
  try {
    var next_cache_index = 1;

    function create_temporary_cache() {
      var uniquifier = String(++next_cache_index);
      var cache_name = `temporary_cache/${uniquifier}`;

      return caches.delete(cache_name)
        .then(function () {
          return caches.open(cache_name);
        });
    }

    function cache_test(test_function, description) {
      return promise_test(async function () {
        let cache = await create_temporary_cache();
        await test_function(cache);
      }, description);
    }

    var simple_entries = [
      {
        name: 'a',
        request: new Request('http://example.com/a'),
        response: new Response('')
      },

      {
        name: 'b',
        request: new Request('http://example.com/b'),
        response: new Response('')
      },

      {
        name: 'a_with_query',
        request: new Request('http://example.com/a?q=r'),
        response: new Response('')
      },

      {
        name: 'A',
        request: new Request('http://example.com/A'),
        response: new Response('')
      },

      {
        name: 'a_https',
        request: new Request('https://example.com/a'),
        response: new Response('')
      },

      {
        name: 'a_org',
        request: new Request('http://example.org/a'),
        response: new Response('')
      },

      {
        name: 'cat',
        request: new Request('http://example.com/cat'),
        response: new Response('')
      },

      {
        name: 'catmandu',
        request: new Request('http://example.com/catmandu'),
        response: new Response('')
      },

      {
        name: 'cat_num_lives',
        request: new Request('http://example.com/cat?lives=9'),
        response: new Response('')
      },

      {
        name: 'cat_in_the_hat',
        request: new Request('http://example.com/cat/in/the/hat'),
        response: new Response('')
      },

      {
        name: 'non_2xx_response',
        request: new Request('http://example.com/non2xx'),
        response: new Response('', { status: 404, statusText: 'nope' })
      },

      {
        name: 'error_response',
        request: new Request('http://example.com/error'),
        response: Response.error()
      },
    ];

    // A set of Request/Response pairs to be used with prepopulated_await cache_test().
    // These contain a mix of test cases that use Vary headers.
    var vary_entries = [
      {
        name: 'vary_cookie_is_cookie',
        request: new Request('http://example.com/c',
          { headers: { 'Cookies': 'is-for-cookie' } }),
        response: new Response('',
          { headers: { 'Vary': 'Cookies' } })
      },

      {
        name: 'vary_cookie_is_good',
        request: new Request('http://example.com/c',
          { headers: { 'Cookies': 'is-good-enough-for-me' } }),
        response: new Response('',
          { headers: { 'Vary': 'Cookies' } })
      },

      {
        name: 'vary_cookie_absent',
        request: new Request('http://example.com/c'),
        response: new Response('',
          { headers: { 'Vary': 'Cookies' } })
      }
    ];

    // Run |test_function| with a Cache object and a map of entries. Prior to the
    // call, the Cache is populated by cache entries from |entries|. The latter is
    // expected to be an Object mapping arbitrary keys to objects of the form
    // {request: <Request object>, response: <Response object>}. Entries are
    // serially added to the cache in the order specified.
    //
    // |test_function| should return a Promise that can be used with promise_test.
    function prepopulated_cache_test(entries, test_function, description) {
      return cache_test(function (cache) {
        var p = Promise.resolve();
        var hash = {};
        entries.forEach(function (entry) {
          hash[entry.name] = entry;
          p = p.then(function () {
            return cache.put(entry.request.clone(), entry.response.clone())
              .catch(function (e) {
                assert_unreached(
                  'Test setup failed for entry ' + entry.name + ': ' + e
                );
              });
          });
        });
        return p
          .then(function () {
            assert_equals(Object.keys(hash).length, entries.length);
          })
          .then(function () {
            return test_function(cache, hash);
          });
      }, description);
    }

    // Helper for testing with Headers objects. Compares Headers instances
    // by serializing |expected| and |actual| to arrays and comparing.
    function assert_header_equals(actual, expected, description) {
      assert_class_string(actual, "Headers", description);
      var header;
      var actual_headers = [];
      var expected_headers = [];
      for (header of actual)
        actual_headers.push(header[0] + ": " + header[1]);
      for (header of expected)
        expected_headers.push(header[0] + ": " + header[1]);
      assert_array_equals(actual_headers, expected_headers,
        description + " Headers differ.");
    }

    // Helper for testing with Response objects. Compares simple
    // attributes defined on the interfaces, as well as the headers. It
    // does not compare the response bodies.
    function assert_response_equals(actual, expected, description) {
      assert_class_string(actual, "Response", description);
      ["type", "url", "status", "ok", "statusText"].forEach(function (attribute) {
        assert_equals(actual[attribute], expected[attribute],
          description + " Attributes differ: " + attribute + ".");
      });
      assert_header_equals(actual.headers, expected.headers, description);
    }

    // Assert that the two arrays |actual| and |expected| contain the same
    // set of Responses as determined by assert_response_equals. The order
    // is not significant.
    //
    // |expected| is assumed to not contain any duplicates.
    function assert_response_array_equivalent(actual, expected, description) {
      assert_true(Array.isArray(actual), description);
      assert_equals(actual.length, expected.length, description);
      expected.forEach(function (expected_element) {
        // assert_response_in_array treats the first argument as being
        // 'actual', and the second as being 'expected array'. We are
        // switching them around because we want to be resilient
        // against the |actual| array containing duplicates.
        assert_response_in_array(expected_element, actual, description);
      });
    }

    // Asserts that two arrays |actual| and |expected| contain the same
    // set of Responses as determined by assert_response_equals(). The
    // corresponding elements must occupy corresponding indices in their
    // respective arrays.
    function assert_response_array_equals(actual, expected, description) {
      assert_true(Array.isArray(actual), description);
      assert_equals(actual.length, expected.length, description);
      actual.forEach(function (value, index) {
        assert_response_equals(value, expected[index],
          description + " : object[" + index + "]");
      });
    }

    // Equivalent to assert_in_array, but uses assert_response_equals.
    function assert_response_in_array(actual, expected_array, description) {
      assert_true(expected_array.some(function (element) {
        try {
          assert_response_equals(actual, element);
          return true;
        } catch (e) {
          return false;
        }
      }), description);
    }

    // Helper for testing with Request objects. Compares simple
    // attributes defined on the interfaces, as well as the headers.
    function assert_request_equals(actual, expected, description) {
      assert_class_string(actual, "Request", description);
      ["url"].forEach(function (attribute) {
        assert_equals(actual[attribute], expected[attribute],
          description + " Attributes differ: " + attribute + ".");
      });
      assert_header_equals(actual.headers, expected.headers, description);
    }

    // Asserts that two arrays |actual| and |expected| contain the same
    // set of Requests as determined by assert_request_equals(). The
    // corresponding elements must occupy corresponding indices in their
    // respective arrays.
    function assert_request_array_equals(actual, expected, description) {
      assert_true(Array.isArray(actual), description);
      assert_equals(actual.length, expected.length, description);
      actual.forEach(function (value, index) {
        assert_request_equals(value, expected[index],
          description + " : object[" + index + "]");
      });
    }

    // We have an extra "default" cache, which is not part of the standard
    const winterJsBuiltInDefaultCacheName = "_____WINTERJS_DEFAULT_CACHE_____";

    // Deletes all caches, returning a promise indicating success.
    function delete_all_caches() {
      return caches.keys()
        .then(function (keys) {
          return Promise.all(
            keys
              // The default cache can't be deleted
              .filter(key => key !== winterJsBuiltInDefaultCacheName)
              .map(caches.delete.bind(caches))
          );
        });
    }

    // TODO: we throw an error from cache.add directly rather than returning a rejected promise
    // await cache_test(function (cache) {
    //   return promise_rejects_js(
    //     cache.add(),
    //     'Cache.add should throw a TypeError when no arguments are given.');
    // }, 'Cache.add called with no arguments');

    // Skipped: we don't support relative URLs without a base.
    // await cache_test(function (cache) {
    //   return cache.add(winterTestsBaseUrl)
    //     .then(function (result) {
    //       assert_equals(result, undefined,
    //         'Cache.add should resolve with undefined on success.');
    //       return cache.match(winterTestsBaseUrl);
    //     })
    //     .then(function (response) {
    //       assert_class_string(response, 'Response',
    //         'Cache.add should put a resource in the cache.');
    //       return response.text();
    //     })
    //     .then(function (body) {
    //       assert_equals(body, 'GET request successful',
    //         'Cache.add should retrieve the correct body.');
    //     });
    // }, 'Cache.add called with relative URL specified as a string');

    await cache_test(function (cache) {
      return promise_rejects_js(
        cache.add('javascript://this-is-not-http-mmkay'),
        'Cache.add should throw a TypeError for non-HTTP/HTTPS URLs.');
    }, 'Cache.add called with non-HTTP/HTTPS URL');

    await cache_test(function (cache) {
      var request = new Request(winterTestsBaseUrl);
      return cache.add(request)
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.add should resolve with undefined on success.');
        });
    }, 'Cache.add called with Request object');

    await cache_test(function (cache) {
      var request = new Request(winterTestsBaseUrl,
        { method: 'POST', body: 'This is a body.' });
      return promise_rejects_js(
        cache.add(request),
        'Cache.add should throw a TypeError for non-GET requests.');
    }, 'Cache.add called with POST request');

    await cache_test(function (cache) {
      var request = new Request(winterTestsBaseUrl);
      return cache.add(request)
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.add should resolve with undefined on success.');
        })
        .then(function () {
          return cache.add(request);
        })
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.add should resolve with undefined on success.');
        });
    }, 'Cache.add called twice with the same Request object');

    await cache_test(function (cache) {
      var request = new Request(winterTestsBaseUrl);
      return request.text()
        .then(function () {
          assert_false(request.bodyUsed);
        })
        .then(function () {
          return cache.add(request);
        });
    }, 'Cache.add with request with null body (not consumed)');

    await cache_test(function (cache) {
      return promise_rejects_js(
        cache.add(winterTestsBaseUrl + "?status=206"),
        'Cache.add should reject on partial response');
    }, 'Cache.add with 206 response');

    await cache_test(function (cache) {
      var urls = [winterTestsBaseUrl + "?status=206",
      winterTestsBaseUrl + "?status=200"];
      var requests = urls.map(function (url) {
        return new Request(url);
      });
      return promise_rejects_js(
        cache.addAll(requests),
        'Cache.addAll should reject with TypeError if any request fails');
    }, 'Cache.addAll with 206 response');

    await cache_test(function (cache) {
      return promise_rejects_js(
        cache.add(winterTestsBaseUrl + "?status=404"),
        'Cache.add should reject if response is !ok');
    }, 'Cache.add with request that results in a status of 404');


    await cache_test(function (cache) {
      return promise_rejects_js(
        cache.add(winterTestsBaseUrl + "?status=500"),
        'Cache.add should reject if response is !ok');
    }, 'Cache.add with request that results in a status of 500');

    // TODO: we throw an error from cache.addAll directly rather than returning a rejected promise
    // await cache_test(function (cache) {
    //   return promise_rejects_js(
    //     cache.addAll(),
    //     'Cache.addAll with no arguments should throw TypeError.');
    // }, 'Cache.addAll with no arguments');

    // await cache_test(function (cache) {
    //   // Assumes the existence of ../resources/simple.txt and ../resources/blank.html
    //   var urls = ['./resources/simple.txt', undefined, './resources/blank.html'];
    //   return promise_rejects_js(
    //     cache.addAll(urls),
    //     'Cache.addAll should throw TypeError for an undefined argument.');
    // }, 'Cache.addAll with a mix of valid and undefined arguments');

    await cache_test(function (cache) {
      return cache.addAll([])
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.addAll should resolve with undefined on ' +
            'success.');
          return cache.keys();
        })
        .then(function (result) {
          assert_equals(result.length, 0,
            'There should be no entry in the cache.');
        });
    }, 'Cache.addAll with an empty array');

    await cache_test(function (cache) {
      // Assumes the existence of ../resources/simple.txt and
      // ../resources/blank.html
      var urls = [winterTestsBaseUrl + "?status=200",
      winterTestsBaseUrl + "?status=201",
      winterTestsBaseUrl + "?status=202"];
      return cache.addAll(urls)
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.addAll should resolve with undefined on ' +
            'success.');
          return Promise.all(
            urls.map(function (url) { return cache.match(url); }));
        })
        .then(function (responses) {
          assert_class_string(
            responses[0], 'Response',
            'Cache.addAll should put a resource in the cache.');
          assert_class_string(
            responses[1], 'Response',
            'Cache.addAll should put a resource in the cache.');
          assert_class_string(
            responses[2], 'Response',
            'Cache.addAll should put a resource in the cache.');
          return Promise.all(
            responses.map(function (response) { return response.text(); }));
        })
        .then(function (bodies) {
          assert_equals(
            bodies[0], 'GET request successful',
            'Cache.add should retrieve the correct body.');
          assert_equals(
            bodies[1], 'GET request successful',
            'Cache.add should retrieve the correct body.');
          assert_equals(
            bodies[2], 'GET request successful',
            'Cache.add should retrieve the correct body.');
        });
    }, 'Cache.addAll with string URL arguments');

    await cache_test(function (cache) {
      // Assumes the existence of ../resources/simple.txt and
      // ../resources/blank.html
      var urls = [winterTestsBaseUrl + "?status=200",
      winterTestsBaseUrl + "?status=201",
      winterTestsBaseUrl + "?status=202"];
      var requests = urls.map(function (url) {
        return new Request(url);
      });
      return cache.addAll(requests)
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.addAll should resolve with undefined on ' +
            'success.');
          return Promise.all(
            urls.map(function (url) { return cache.match(url); }));
        })
        .then(function (responses) {
          assert_class_string(
            responses[0], 'Response',
            'Cache.addAll should put a resource in the cache.');
          assert_class_string(
            responses[1], 'Response',
            'Cache.addAll should put a resource in the cache.');
          assert_class_string(
            responses[2], 'Response',
            'Cache.addAll should put a resource in the cache.');
          return Promise.all(
            responses.map(function (response) { return response.text(); }));
        })
        .then(function (bodies) {
          assert_equals(
            bodies[0], 'GET request successful',
            'Cache.add should retrieve the correct body.');
          assert_equals(
            bodies[1], 'GET request successful',
            'Cache.add should retrieve the correct body.');
          assert_equals(
            bodies[2], 'GET request successful',
            'Cache.add should retrieve the correct body.');
        });
    }, 'Cache.addAll with Request arguments');

    await cache_test(function (cache) {
      // Assumes that ../resources/simple.txt and ../resources/blank.html exist.
      // The second resource does not.
      var urls = [winterTestsBaseUrl + "?status=200",
      winterTestsBaseUrl + "?status=404",
      winterTestsBaseUrl + "?status=202"];
      var requests = urls.map(function (url) {
        return new Request(url);
      });
      return promise_rejects_js(
        cache.addAll(requests),
        'Cache.addAll should reject with TypeError if any request fails')
        .then(function () {
          return Promise.all(urls.map(function (url) {
            return cache.match(url);
          }));
        })
        .then(function (matches) {
          assert_array_equals(
            matches,
            [undefined, undefined, undefined],
            'If any response fails, no response should be added to cache');
        });
    }, 'Cache.addAll with a mix of succeeding and failing requests');

    await cache_test(function (cache) {
      var request = new Request(winterTestsBaseUrl + "?status=200");
      return promise_rejects_js(
        cache.addAll([request, request]),
        'Cache.addAll should throw InvalidStateError if the same request is added ' +
        'twice.');
    }, 'Cache.addAll called with the same Request object specified twice');

    await cache_test(async function (cache) {
      const url = winterTestsBaseUrl + "?vary=x-shape";
      let requests = [
        new Request(url, { headers: { 'x-shape': 'circle' } }),
        new Request(url, { headers: { 'x-shape': 'square' } }),
      ];
      let result = await cache.addAll(requests);
      assert_equals(result, undefined, 'Cache.addAll() should succeed');
    }, 'Cache.addAll should succeed when entries differ by vary header');

    await cache_test(async function (cache) {
      const url = winterTestsBaseUrl + "?vary=x-shape";
      let requests = [
        new Request(url, { headers: { 'x-shape': 'circle' } }),
        new Request(url, { headers: { 'x-shape': 'circle' } }),
      ];
      await promise_rejects_js(
        cache.addAll(requests),
        'Cache.addAll() should reject when entries are duplicate by vary header');
    }, 'Cache.addAll should reject when entries are duplicate by vary header');

    const methodsToTest = {
      put: async (cache, request) => {
        const response = await fetch(request);
        return cache.put(request, response);
      },
      add: async (cache, request) => cache.add(request),
      addAll: async (cache, request) => cache.addAll([request]),
    };

    for (const method in methodsToTest) {
      const perform = methodsToTest[method];

      await cache_test(async (cache) => {
        const controller = new AbortController();
        const signal = controller.signal;
        controller.abort();
        const request = new Request(winterTestsBaseUrl, { signal });
        return promise_rejects_js(perform(cache, request), `${method} should reject`);
      }, `${method}() on an already-aborted request should reject with AbortError`);

      await cache_test(async (cache) => {
        const controller = new AbortController();
        const signal = controller.signal;
        const request = new Request(winterTestsBaseUrl, { signal });
        const promise = perform(cache, request);
        controller.abort();
        return promise_rejects_js(promise, `${method} should reject`);
      }, `${method}() synchronously followed by abort should reject with ` +
      `AbortError`);
    }

    // Construct a generic Request object. The URL is |test_url|. All other fields
    // are defaults.
    function new_test_request() {
      return new Request(test_url);
    }

    // Construct a generic Response object.
    function new_test_response() {
      return new Response('Hello world!', { status: 200 });
    }

    var test_url = 'https://example.com/foo';

    // TODO: we throw an error directly rather than returning a rejected promise
    // await cache_test(function (cache, test) {
    //   return promise_rejects_js(
    //     cache.delete(),
    //     'Cache.delete should reject with a TypeError when called with no ' +
    //     'arguments.');
    // }, 'Cache.delete with no arguments');

    await cache_test(function (cache) {
      return cache.put(new_test_request(), new_test_response())
        .then(function () {
          return cache.delete(test_url);
        })
        .then(function (result) {
          assert_true(result,
            'Cache.delete should resolve with "true" if an entry ' +
            'was successfully deleted.');
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.delete should remove matching entries from cache.');
        });
    }, 'Cache.delete called with a string URL');

    await cache_test(function (cache) {
      var request = new Request(test_url);
      return cache.put(request, new_test_response())
        .then(function () {
          return cache.delete(request);
        })
        .then(function (result) {
          assert_true(result,
            'Cache.delete should resolve with "true" if an entry ' +
            'was successfully deleted.');
        });
    }, 'Cache.delete called with a Request object');

    await cache_test(function (cache) {
      var request = new Request(test_url);
      var response = new_test_response();
      return cache.put(request, response)
        .then(function () {
          return cache.delete(new Request(test_url, { method: 'HEAD' }));
        })
        .then(function (result) {
          assert_false(result,
            'Cache.delete should not match a non-GET request ' +
            'unless ignoreMethod option is set.');
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_response_equals(result, response,
            'Cache.delete should leave non-matching response in the cache.');
          return cache.delete(new Request(test_url, { method: 'HEAD' }),
            { ignoreMethod: true });
        })
        .then(function (result) {
          assert_true(result,
            'Cache.delete should match a non-GET request ' +
            ' if ignoreMethod is true.');
        });
    }, 'Cache.delete called with a HEAD request');

    await cache_test(function (cache) {
      var vary_request = new Request('http://example.com/c',
        { headers: { 'Cookies': 'is-for-cookie' } });
      var vary_response = new Response('', { headers: { 'Vary': 'Cookies' } });
      var mismatched_vary_request = new Request('http://example.com/c');

      return cache.put(vary_request.clone(), vary_response.clone())
        .then(function () {
          return cache.delete(mismatched_vary_request.clone());
        })
        .then(function (result) {
          assert_false(result,
            'Cache.delete should not delete if vary does not ' +
            'match unless ignoreVary is true');
          return cache.delete(mismatched_vary_request.clone(),
            { ignoreVary: true });
        })
        .then(function (result) {
          assert_true(result,
            'Cache.delete should ignore vary if ignoreVary is true');
        });
    }, 'Cache.delete supports ignoreVary');

    await cache_test(function (cache) {
      return cache.delete(test_url)
        .then(function (result) {
          assert_false(result,
            'Cache.delete should resolve with "false" if there ' +
            'are no matching entries.');
        });
    }, 'Cache.delete with a non-existent entry');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.a_with_query.request,
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.a.response,
              entries.a_with_query.response
            ]);
          return cache.delete(entries.a_with_query.request,
            { ignoreSearch: true });
        })
        .then(function (result) {
          return cache.matchAll(entries.a_with_query.request,
            { ignoreSearch: true });
        })
        .then(function (result) {
          assert_response_array_equals(result, []);
        });
    },
      'Cache.delete with ignoreSearch option (request with search parameters)');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.a_with_query.request,
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.a.response,
              entries.a_with_query.response
            ]);
          // cache.delete()'s behavior should be the same if ignoreSearch is
          // not provided or if ignoreSearch is false.
          return cache.delete(entries.a_with_query.request,
            { ignoreSearch: false });
        })
        .then(function (result) {
          return cache.matchAll(entries.a_with_query.request,
            { ignoreSearch: true });
        })
        .then(function (result) {
          assert_response_array_equals(result, [entries.a.response]);
        });
    }, 'Cache.delete with ignoreSearch option (when it is specified as false)');

    await cache_test(cache => {
      return cache.keys()
        .then(requests => {
          assert_equals(
            requests.length, 0,
            'Cache.keys should resolve to an empty array for an empty cache');
        });
    }, 'Cache.keys() called on an empty cache');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys('http://something-something-we-dont-have-this.com')
        .then(function (result) {
          assert_request_array_equals(
            result, [],
            'Cache.keys should resolve with an empty array on failure.');
        });
    }, 'Cache.keys with no matching entries');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(entries.a.request.url)
        .then(function (result) {
          assert_request_array_equals(result, [entries.a.request],
            'Cache.keys should match by URL.');
        });
    }, 'Cache.keys with URL');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(entries.a.request)
        .then(function (result) {
          assert_request_array_equals(
            result, [entries.a.request],
            'Cache.keys should match by Request.');
        });
    }, 'Cache.keys with Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(new Request(entries.a.request.url))
        .then(function (result) {
          assert_request_array_equals(
            result, [entries.a.request],
            'Cache.keys should match by Request.');
        });
    }, 'Cache.keys with new Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(entries.a.request, { ignoreSearch: true })
        .then(function (result) {
          assert_request_array_equals(
            result,
            [
              entries.a.request,
              entries.a_with_query.request
            ],
            'Cache.keys with ignoreSearch should ignore the ' +
            'search parameters of cached request.');
        });
    },
      'Cache.keys with ignoreSearch option (request with no search ' +
      'parameters)');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(entries.a_with_query.request, { ignoreSearch: true })
        .then(function (result) {
          assert_request_array_equals(
            result,
            [
              entries.a.request,
              entries.a_with_query.request
            ],
            'Cache.keys with ignoreSearch should ignore the ' +
            'search parameters of request.');
        });
    },
      'Cache.keys with ignoreSearch option (request with search parameters)');

    await cache_test(function (cache) {
      var request = new Request('http://example.com/');
      var head_request = new Request('http://example.com/', { method: 'HEAD' });
      var response = new Response('foo');
      return cache.put(request.clone(), response.clone())
        .then(function () {
          return cache.keys(head_request.clone());
        })
        .then(function (result) {
          assert_request_array_equals(
            result, [],
            'Cache.keys should resolve with an empty array with a ' +
            'mismatched method.');
          return cache.keys(head_request.clone(),
            { ignoreMethod: true });
        })
        .then(function (result) {
          assert_request_array_equals(
            result,
            [
              request,
            ],
            'Cache.keys with ignoreMethod should ignore the ' +
            'method of request.');
        });
    }, 'Cache.keys supports ignoreMethod');

    await cache_test(function (cache) {
      var vary_request = new Request('http://example.com/c',
        { headers: { 'Cookies': 'is-for-cookie' } });
      var vary_response = new Response('', { headers: { 'Vary': 'Cookies' } });
      var mismatched_vary_request = new Request('http://example.com/c');

      return cache.put(vary_request.clone(), vary_response.clone())
        .then(function () {
          return cache.keys(mismatched_vary_request.clone());
        })
        .then(function (result) {
          assert_request_array_equals(
            result, [],
            'Cache.keys should resolve with an empty array with a ' +
            'mismatched vary.');
          return cache.keys(mismatched_vary_request.clone(),
            { ignoreVary: true });
        })
        .then(function (result) {
          assert_request_array_equals(
            result,
            [
              vary_request,
            ],
            'Cache.keys with ignoreVary should ignore the ' +
            'vary of request.');
        });
    }, 'Cache.keys supports ignoreVary');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(entries.cat.request.url + '#mouse')
        .then(function (result) {
          assert_request_array_equals(
            result,
            [
              entries.cat.request,
            ],
            'Cache.keys should ignore URL fragment.');
        });
    }, 'Cache.keys with URL containing fragment');

    // Skipped: We don't allow relative URLs without a base
    // await prepopulated_cache_test(simple_entries, function (cache, entries) {
    //   return cache.keys('http')
    //     .then(function (result) {
    //       assert_request_array_equals(
    //         result, [],
    //         'Cache.keys should treat query as a URL and not ' +
    //         'just a string fragment.');
    //     });
    // }, 'Cache.keys with string fragment "http" as query');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys()
        .then(function (result) {
          assert_request_array_equals(
            result,
            simple_entries.map(entry => entry.request),
            'Cache.keys without parameters should match all entries.');
        });
    }, 'Cache.keys without parameters');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(undefined)
        .then(function (result) {
          assert_request_array_equals(
            result,
            simple_entries.map(entry => entry.request),
            'Cache.keys with undefined request should match all entries.');
        });
    }, 'Cache.keys with explicitly undefined request');

    await cache_test(cache => {
      return cache.keys(undefined, {})
        .then(requests => {
          assert_equals(
            requests.length, 0,
            'Cache.keys should resolve to an empty array for an empty cache');
        });
    }, 'Cache.keys with explicitly undefined request and empty options');

    await prepopulated_cache_test(vary_entries, function (cache, entries) {
      return cache.keys()
        .then(function (result) {
          assert_request_array_equals(
            result,
            [
              entries.vary_cookie_is_cookie.request,
              entries.vary_cookie_is_good.request,
              entries.vary_cookie_absent.request,
            ],
            'Cache.keys without parameters should match all entries.');
        });
    }, 'Cache.keys without parameters and VARY entries');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.keys(new Request(entries.cat.request.url, { method: 'HEAD' }))
        .then(function (result) {
          assert_request_array_equals(
            result, [],
            'Cache.keys should not match HEAD request unless ignoreMethod ' +
            'option is set.');
        });
    }, 'Cache.keys with a HEAD Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match('http://something-something-we-dont-have-this.com')
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.match failures should resolve with undefined.');
        });
    }, 'Cache.match with no matching entries');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(entries.a.request.url)
        .then(function (result) {
          assert_response_equals(result, entries.a.response,
            'Cache.match should match by URL.');
        });
    }, 'Cache.match with URL');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(entries.a.request)
        .then(function (result) {
          assert_response_equals(result, entries.a.response,
            'Cache.match should match by Request.');
        });
    }, 'Cache.match with Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      var alt_response = new Response('', { status: 201 });

      return caches.open('second_matching_cache')
        .then(function (cache) {
          return cache.put(entries.a.request, alt_response.clone());
        })
        .then(function () {
          return cache.match(entries.a.request);
        })
        .then(function (result) {
          assert_response_equals(
            result, entries.a.response,
            'Cache.match should match the first cache.');
        });
    }, 'Cache.match with multiple cache hits');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(new Request(entries.a.request.url))
        .then(function (result) {
          assert_response_equals(result, entries.a.response,
            'Cache.match should match by Request.');
        });
    }, 'Cache.match with new Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(new Request(entries.a.request.url, { method: 'HEAD' }))
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.match should not match HEAD Request.');
        });
    }, 'Cache.match with HEAD');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(entries.a.request,
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_in_array(
            result,
            [
              entries.a.response,
              entries.a_with_query.response
            ],
            'Cache.match with ignoreSearch should ignore the ' +
            'search parameters of cached request.');
        });
    },
      'Cache.match with ignoreSearch option (request with no search ' +
      'parameters)');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(entries.a_with_query.request,
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_in_array(
            result,
            [
              entries.a.response,
              entries.a_with_query.response
            ],
            'Cache.match with ignoreSearch should ignore the ' +
            'search parameters of request.');
        });
    },
      'Cache.match with ignoreSearch option (request with search parameter)');

    await cache_test(function (cache) {
      var request = new Request('http://example.com/');
      var head_request = new Request('http://example.com/', { method: 'HEAD' });
      var response = new Response('foo');
      return cache.put(request.clone(), response.clone())
        .then(function () {
          return cache.match(head_request.clone());
        })
        .then(function (result) {
          assert_equals(
            result, undefined,
            'Cache.match should resolve as undefined with a ' +
            'mismatched method.');
          return cache.match(head_request.clone(),
            { ignoreMethod: true });
        })
        .then(function (result) {
          assert_response_equals(
            result, response,
            'Cache.match with ignoreMethod should ignore the ' +
            'method of request.');
        });
    }, 'Cache.match supports ignoreMethod');

    await cache_test(function (cache) {
      var vary_request = new Request('http://example.com/c',
        { headers: { 'Cookies': 'is-for-cookie' } });
      var vary_response = new Response('', { headers: { 'Vary': 'Cookies' } });
      var mismatched_vary_request = new Request('http://example.com/c');

      return cache.put(vary_request.clone(), vary_response.clone())
        .then(function () {
          return cache.match(mismatched_vary_request.clone());
        })
        .then(function (result) {
          assert_equals(
            result, undefined,
            'Cache.match should resolve as undefined with a ' +
            'mismatched vary.');
          return cache.match(mismatched_vary_request.clone(),
            { ignoreVary: true });
        })
        .then(function (result) {
          assert_response_equals(
            result, vary_response,
            'Cache.match with ignoreVary should ignore the ' +
            'vary of request.');
        });
    }, 'Cache.match supports ignoreVary');

    await cache_test(function (cache) {
      let has_cache_name = false;
      const opts = {
        get cacheName() {
          has_cache_name = true;
          return undefined;
        }
      };
      return caches.open('foo')
        .then(function () {
          return cache.match('http://bar', opts);
        })
        .then(function () {
          assert_false(has_cache_name,
            'Cache.match does not support cacheName option ' +
            'which was removed in CacheQueryOptions.');
        });
    }, 'Cache.match does not support cacheName option');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.match(entries.cat.request.url + '#mouse')
        .then(function (result) {
          assert_response_equals(result, entries.cat.response,
            'Cache.match should ignore URL fragment.');
        });
    }, 'Cache.match with URL containing fragment');

    // Skipped: we don't support relative URLs without a base.
    // await prepopulated_cache_test(simple_entries, function (cache, entries) {
    //   return cache.match('http')
    //     .then(function (result) {
    //       assert_equals(
    //         result, undefined,
    //         'Cache.match should treat query as a URL and not ' +
    //         'just a string fragment.');
    //     });
    // }, 'Cache.match with string fragment "http" as query');

    await prepopulated_cache_test(vary_entries, function (cache, entries) {
      return cache.match('http://example.com/c')
        .then(function (result) {
          assert_response_in_array(
            result,
            [
              entries.vary_cookie_absent.response
            ],
            'Cache.match should honor "Vary" header.');
        });
    }, 'Cache.match with responses containing "Vary" header');

    await cache_test(function (cache) {
      var request = new Request('http://example.com');
      var response;
      var request_url = winterTestsBaseUrl;
      return fetch(request_url)
        .then(function (fetch_result) {
          response = fetch_result;
          assert_equals(
            response.url, request_url,
            '[https://fetch.spec.whatwg.org/#dom-response-url] ' +
            'Reponse.url should return the URL of the response.');
          return cache.put(request, response.clone());
        })
        .then(function () {
          return cache.match(request.url);
        })
        .then(function (result) {
          assert_response_equals(
            result, response,
            'Cache.match should return a Response object that has the same ' +
            'properties as the stored response.');
          return cache.match(response.url);
        })
        .then(function (result) {
          assert_equals(
            result, undefined,
            'Cache.match should not match cache entry based on response URL.');
        });
    }, 'Cache.match with Request and Response objects with different URLs');

    await cache_test(function (cache) {
      var request_url = winterTestsBaseUrl;
      return fetch(request_url)
        .then(function (fetch_result) {
          return cache.put(new Request(request_url), fetch_result);
        })
        .then(function () {
          return cache.match(request_url);
        })
        .then(function (result) {
          return result.text();
        })
        .then(function (body_text) {
          assert_equals(body_text, 'GET request successful',
            'Cache.match should return a Response object with a ' +
            'valid body.');
        })
        .then(function () {
          return cache.match(request_url);
        })
        .then(function (result) {
          return result.text();
        })
        .then(function (body_text) {
          assert_equals(body_text, 'GET request successful',
            'Cache.match should return a Response object with a ' +
            'valid body each time it is called.');
        });
    }, 'Cache.match invoked multiple times for the same Request/Response');

    await cache_test(function (cache) {
      var request_url = winterTestsBaseUrl;
      return fetch(request_url)
        .then(function (fetch_result) {
          return cache.put(new Request(request_url), fetch_result);
        })
        .then(function () {
          return cache.match(request_url);
        })
        .then(function (result) {
          return result.blob();
        })
        .then(function (blob) {
          var slice = blob.slice(4, 11);
          return slice.text();
        })
        .then(function (text) {
          assert_equals(text, 'request',
            'A Response blob returned by Cache.match should be ' +
            'sliceable.');
        });
    }, 'Cache.match blob should be sliceable');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      var request = new Request(entries.a.request.clone(), { method: 'POST' });
      return cache.match(request)
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.match should not find a match');
        });
    }, 'Cache.match with POST Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      var response = entries.non_2xx_response.response;
      return cache.match(entries.non_2xx_response.request.url)
        .then(function (result) {
          assert_response_equals(
            result, entries.non_2xx_response.response,
            'Cache.match should return a Response object that has the ' +
            'same properties as a stored non-2xx response.');
        });
    }, 'Cache.match with a non-2xx Response');

    prepopulated_cache_test(simple_entries, function (cache, entries) {
      var response = entries.error_response.response;
      return cache.match(entries.error_response.request.url)
        .then(function (result) {
          assert_response_equals(
            result, entries.error_response.response,
            'Cache.match should return a Response object that has the ' +
            'same properties as a stored network error response.');
        });
    }, 'Cache.match with a network error Response');

    await cache_test(function (cache) {
      // This test validates that we can get a Response from the Cache API,
      // clone it, and read just one side of the clone.  This was previously
      // bugged in FF for Responses with large bodies.
      var data = [];
      data.length = 80 * 1024;
      data.fill('F');
      var response;
      return cache.put('http://example.com', new Response(data.toString()))
        .then(function (result) {
          return cache.match('http://example.com');
        })
        .then(function (r) {
          // Make sure the original response is not GC'd.
          response = r;
          // Return only the clone.  We purposefully test that the other
          // half of the clone does not need to be read here.
          return response.clone().text();
        })
        .then(function (text) {
          assert_equals(text, data.toString(), 'cloned body text can be read correctly');
        });
    }, 'Cache produces large Responses that can be cloned and read correctly.');

    await cache_test(async (cache) => {
      // A URL that should load a resource with a known mime type.
      const url = winterTestsBaseUrl + '?mime=text/html';
      const expected_mime_type = 'text/html';

      // Verify we get the expected mime type from the network.  Note,
      // we cannot use an exact match here since some browsers append
      // character encoding information to the blob.type value.
      const net_response = await fetch(url);
      const net_mime_type = (await net_response.blob()).type;
      assert_true(net_mime_type.includes(expected_mime_type),
        'network response should include the expected mime type');

      // Verify we get the exact same mime type when reading the same
      // URL resource back out of the cache.
      await cache.add(url);
      const cache_response = await cache.match(url);
      const cache_mime_type = (await cache_response.blob()).type;
      assert_equals(cache_mime_type, net_mime_type,
        'network and cache response mime types should match');
    }, 'MIME type should be set from content-header correctly.');

    await cache_test(async (cache) => {
      const url = 'http://example.com';
      const original_type = 'text/html';
      const override_type = 'text/plain';
      const init_with_headers = {
        headers: {
          'content-type': original_type
        }
      }

      // Verify constructing a synthetic response with a content-type header
      // gets the correct mime type.
      const response = new Response('hello world', init_with_headers);
      const original_response_type = (await response.blob()).type;
      assert_true(original_response_type.includes(original_type),
        'original response should include the expected mime type');

      // Verify overwriting the content-type header changes the mime type.
      const overwritten_response = new Response('hello world', init_with_headers);
      overwritten_response.headers.set('content-type', override_type);
      const overwritten_response_type = (await overwritten_response.blob()).type;
      assert_equals(overwritten_response_type, override_type,
        'mime type can be overridden');

      // Verify the Response read from Cache uses the original mime type
      // computed when it was first constructed.
      const tmp = new Response('hello world', init_with_headers);
      tmp.headers.set('content-type', override_type);
      await cache.put(url, tmp);
      const cache_response = await cache.match(url);
      const cache_mime_type = (await cache_response.blob()).type;
      assert_equals(cache_mime_type, override_type,
        'overwritten and cached response mime types should match');
    }, 'MIME type should reflect Content-Type headers of response.');

    // TODO: Opaque response is not implemented correctly
    // await cache_test(async (cache) => {
    //   const url = new URL(winterTestsBaseUrl + '?vary=foo');
    //   const original_request = new Request(url, {
    //     mode: 'no-cors',
    //     headers: { 'foo': 'bar' }
    //   });
    //   const fetch_response = await fetch(original_request);
    //   assert_equals(fetch_response.type, 'opaque');

    //   await cache.put(original_request, fetch_response);

    //   const match_response_1 = await cache.match(original_request);
    //   assert_not_equals(match_response_1, undefined);

    //   // Verify that cache.match() finds the entry even if queried with a varied
    //   // header that does not match the cache key.  Vary headers should be ignored
    //   // for opaque responses.
    //   const different_request = new Request(url, { headers: { 'foo': 'CHANGED' } });
    //   const match_response_2 = await cache.match(different_request);
    //   assert_not_equals(match_response_2, undefined);
    // }, 'Cache.match ignores vary headers on opaque response.');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll('http://something-something-we-dont-have-this.com')
        .then(function (result) {
          assert_response_array_equals(
            result, [],
            'Cache.matchAll should resolve with an empty array on failure.');
        });
    }, 'Cache.matchAll with no matching entries');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.a.request.url)
        .then(function (result) {
          assert_response_array_equals(result, [entries.a.response],
            'Cache.matchAll should match by URL.');
        });
    }, 'Cache.matchAll with URL');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.a.request)
        .then(function (result) {
          assert_response_array_equals(
            result, [entries.a.response],
            'Cache.matchAll should match by Request.');
        });
    }, 'Cache.matchAll with Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(new Request(entries.a.request.url))
        .then(function (result) {
          assert_response_array_equals(
            result, [entries.a.response],
            'Cache.matchAll should match by Request.');
        });
    }, 'Cache.matchAll with new Request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(new Request(entries.a.request.url, { method: 'HEAD' }),
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_array_equals(
            result, [],
            'Cache.matchAll should not match HEAD Request.');
        });
    }, 'Cache.matchAll with HEAD');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.a.request,
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.a.response,
              entries.a_with_query.response
            ],
            'Cache.matchAll with ignoreSearch should ignore the ' +
            'search parameters of cached request.');
        });
    },
      'Cache.matchAll with ignoreSearch option (request with no search ' +
      'parameters)');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.a_with_query.request,
        { ignoreSearch: true })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.a.response,
              entries.a_with_query.response
            ],
            'Cache.matchAll with ignoreSearch should ignore the ' +
            'search parameters of request.');
        });
    },
      'Cache.matchAll with ignoreSearch option (request with search parameters)');

    await cache_test(function (cache) {
      var request = new Request('http://example.com/');
      var head_request = new Request('http://example.com/', { method: 'HEAD' });
      var response = new Response('foo');
      return cache.put(request.clone(), response.clone())
        .then(function () {
          return cache.matchAll(head_request.clone());
        })
        .then(function (result) {
          assert_response_array_equals(
            result, [],
            'Cache.matchAll should resolve with empty array for a ' +
            'mismatched method.');
          return cache.matchAll(head_request.clone(),
            { ignoreMethod: true });
        })
        .then(function (result) {
          assert_response_array_equals(
            result, [response],
            'Cache.matchAll with ignoreMethod should ignore the ' +
            'method of request.');
        });
    }, 'Cache.matchAll supports ignoreMethod');

    await cache_test(function (cache) {
      var vary_request = new Request('http://example.com/c',
        { headers: { 'Cookies': 'is-for-cookie' } });
      var vary_response = new Response('', { headers: { 'Vary': 'Cookies' } });
      var mismatched_vary_request = new Request('http://example.com/c');

      return cache.put(vary_request.clone(), vary_response.clone())
        .then(function () {
          return cache.matchAll(mismatched_vary_request.clone());
        })
        .then(function (result) {
          assert_response_array_equals(
            result, [],
            'Cache.matchAll should resolve as undefined with a ' +
            'mismatched vary.');
          return cache.matchAll(mismatched_vary_request.clone(),
            { ignoreVary: true });
        })
        .then(function (result) {
          assert_response_array_equals(
            result, [vary_response],
            'Cache.matchAll with ignoreVary should ignore the ' +
            'vary of request.');
        });
    }, 'Cache.matchAll supports ignoreVary');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(entries.cat.request.url + '#mouse')
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.cat.response,
            ],
            'Cache.matchAll should ignore URL fragment.');
        });
    }, 'Cache.matchAll with URL containing fragment');

    // Skipped: we don't support relative URLs without a base.
    // await prepopulated_cache_test(simple_entries, function (cache, entries) {
    //   return cache.matchAll('http')
    //     .then(function (result) {
    //       assert_response_array_equals(
    //         result, [],
    //         'Cache.matchAll should treat query as a URL and not ' +
    //         'just a string fragment.');
    //     });
    // }, 'Cache.matchAll with string fragment "http" as query');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll()
        .then(function (result) {
          assert_response_array_equals(
            result,
            simple_entries.map(entry => entry.response),
            'Cache.matchAll without parameters should match all entries.');
        });
    }, 'Cache.matchAll without parameters');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(undefined)
        .then(result => {
          assert_response_array_equals(
            result,
            simple_entries.map(entry => entry.response),
            'Cache.matchAll with undefined request should match all entries.');
        });
    }, 'Cache.matchAll with explicitly undefined request');

    await prepopulated_cache_test(simple_entries, function (cache, entries) {
      return cache.matchAll(undefined, {})
        .then(result => {
          assert_response_array_equals(
            result,
            simple_entries.map(entry => entry.response),
            'Cache.matchAll with undefined request should match all entries.');
        });
    }, 'Cache.matchAll with explicitly undefined request and empty options');

    await prepopulated_cache_test(vary_entries, function (cache, entries) {
      return cache.matchAll('http://example.com/c')
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.vary_cookie_absent.response
            ],
            'Cache.matchAll should exclude matches if a vary header is ' +
            'missing in the query request, but is present in the cached ' +
            'request.');
        })

        .then(function () {
          return cache.matchAll(
            new Request('http://example.com/c',
              { headers: { 'Cookies': 'none-of-the-above' } }));
        })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
            ],
            'Cache.matchAll should exclude matches if a vary header is ' +
            'missing in the cached request, but is present in the query ' +
            'request.');
        })

        .then(function () {
          return cache.matchAll(
            new Request('http://example.com/c',
              { headers: { 'Cookies': 'is-for-cookie' } }));
        })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [entries.vary_cookie_is_cookie.response],
            'Cache.matchAll should match the entire header if a vary header ' +
            'is present in both the query and cached requests.');
        });
    }, 'Cache.matchAll with responses containing "Vary" header');

    await prepopulated_cache_test(vary_entries, function (cache, entries) {
      return cache.matchAll('http://example.com/c',
        { ignoreVary: true })
        .then(function (result) {
          assert_response_array_equals(
            result,
            [
              entries.vary_cookie_is_cookie.response,
              entries.vary_cookie_is_good.response,
              entries.vary_cookie_absent.response
            ],
            'Cache.matchAll should support multiple vary request/response ' +
            'pairs.');
        });
    }, 'Cache.matchAll with multiple vary pairs');

    var test_url = 'https://example.com/foo';
    var test_body = 'Hello world!';

    await cache_test(function (cache) {
      var request = new Request(test_url);
      var response = new Response(test_body);
      return cache.put(request, response)
        .then(function (result) {
          assert_equals(result, undefined,
            'Cache.put should resolve with undefined on success.');
        });
    }, 'Cache.put called with simple Request and Response');

    await cache_test(function (cache) {
      var test_url = new URL(winterTestsBaseUrl).href;
      var request = new Request(test_url);
      var response;
      return fetch(test_url)
        .then(function (fetch_result) {
          response = fetch_result.clone();
          return cache.put(request, fetch_result);
        })
        .then(function () {
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_response_equals(result, response,
            'Cache.put should update the cache with ' +
            'new request and response.');
          return result.text();
        })
        .then(function (body) {
          assert_equals(body, 'GET request successful',
            'Cache.put should store response body.');
        });
    }, 'Cache.put called with Request and Response from fetch()');

    await cache_test(function (cache) {
      var request = new Request(test_url);
      var response = new Response(test_body);
      assert_false(request.bodyUsed,
        '[https://fetch.spec.whatwg.org/#dom-body-bodyused] ' +
        'Request.bodyUsed should be initially false.');
      return cache.put(request, response)
        .then(function () {
          assert_false(request.bodyUsed,
            'Cache.put should not mark empty request\'s body used');
        });
    }, 'Cache.put with Request without a body');

    await cache_test(function (cache) {
      var request = new Request(test_url);
      var response = new Response();
      assert_false(response.bodyUsed,
        '[https://fetch.spec.whatwg.org/#dom-body-bodyused] ' +
        'Response.bodyUsed should be initially false.');
      return cache.put(request, response)
        .then(function () {
          assert_false(response.bodyUsed,
            'Cache.put should not mark empty response\'s body used');
        });
    }, 'Cache.put with Response without a body');

    await cache_test(function (cache) {
      var request = new Request(test_url);
      var response = new Response(test_body);
      return cache.put(request, response.clone())
        .then(function () {
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_response_equals(result, response,
            'Cache.put should update the cache with ' +
            'new Request and Response.');
        });
    }, 'Cache.put with a Response containing an empty URL');

    await cache_test(function (cache) {
      var request = new Request(test_url);
      var response = new Response('', {
        status: 200,
        headers: [['Content-Type', 'text/plain']]
      });
      return cache.put(request, response)
        .then(function () {
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_equals(result.status, 200, 'Cache.put should store status.');
          assert_equals(result.headers.get('Content-Type'), 'text/plain',
            'Cache.put should store headers.');
          return result.text();
        })
        .then(function (body) {
          assert_equals(body, '',
            'Cache.put should store response body.');
        });
    }, 'Cache.put with an empty response body');

    await cache_test(function (cache, test) {
      var request = new Request(test_url);
      var response = new Response('', {
        status: 206,
        headers: [['Content-Type', 'text/plain']]
      });

      return promise_rejects_js(
        cache.put(request, response),
        'Cache.put should reject 206 Responses with a TypeError.');
    }, 'Cache.put with synthetic 206 response');

    await cache_test(function (cache, test) {
      var test_url = new URL(winterTestsBaseUrl + '?status=206').href;
      var request = new Request(test_url);
      var response;
      return fetch(test_url)
        .then(function (fetch_result) {
          assert_equals(fetch_result.status, 206,
            'Test framework error: The status code should be 206.');
          response = fetch_result.clone();
          return promise_rejects_js(cache.put(request, fetch_result));
        });
    }, 'Cache.put with HTTP 206 response');

    // TODO: implement the pipe mechanism in the backend
    // await cache_test(function (cache, test) {
    //   // We need to jump through some hoops to allow the test to perform opaque
    //   // response filtering, but bypass the ORB safelist check. This is
    //   // done, by forcing the MIME type retrieval to fail and the
    //   // validation of partial first response to succeed.
    //   var pipe = "status(206)|header(Content-Type,)|header(Content-Range, bytes 0-1/41)|slice(null, 1)";
    //   var test_url = new URL(`./resources/blank.html?pipe=${pipe}`, location.href);
    //   test_url.hostname = REMOTE_HOST;
    //   var request = new Request(test_url.href, { mode: 'no-cors' });
    //   var response;
    //   return fetch(request)
    //     .then(function (fetch_result) {
    //       assert_equals(fetch_result.type, 'opaque',
    //         'Test framework error: The response type should be opaque.');
    //       assert_equals(fetch_result.status, 0,
    //         'Test framework error: The status code should be 0 for an ' +
    //         ' opaque-filtered response. This is actually HTTP 206.');
    //       response = fetch_result.clone();
    //       return cache.put(request, fetch_result);
    //     })
    //     .then(function () {
    //       return cache.match(test_url);
    //     })
    //     .then(function (result) {
    //       assert_not_equals(result, undefined,
    //         'Cache.put should store an entry for the opaque response');
    //     });
    // }, 'Cache.put with opaque-filtered HTTP 206 response');

    await cache_test(function (cache) {
      var test_url = new URL(winterTestsBaseUrl + '?status=500').href;
      var request = new Request(test_url);
      var response;
      return fetch(test_url)
        .then(function (fetch_result) {
          assert_equals(fetch_result.status, 500,
            'Test framework error: The status code should be 500.');
          response = fetch_result.clone();
          return cache.put(request, fetch_result);
        })
        .then(function () {
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_response_equals(result, response,
            'Cache.put should update the cache with ' +
            'new request and response.');
          return result.text();
        })
        .then(function (body) {
          assert_equals(body, 'GET request successful',
            'Cache.put should store response body.');
        });
    }, 'Cache.put with HTTP 500 response');

    await cache_test(function (cache) {
      var alternate_response_body = 'New body';
      var alternate_response = new Response(alternate_response_body,
        { statusText: 'New status' });
      return cache.put(new Request(test_url),
        new Response('Old body', { statusText: 'Old status' }))
        .then(function () {
          return cache.put(new Request(test_url), alternate_response.clone());
        })
        .then(function () {
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_response_equals(result, alternate_response,
            'Cache.put should replace existing ' +
            'response with new response.');
          return result.text();
        })
        .then(function (body) {
          assert_equals(body, alternate_response_body,
            'Cache put should store new response body.');
        });
    }, 'Cache.put called twice with matching Requests and different Responses');

    await cache_test(function (cache) {
      var first_url = test_url;
      var second_url = first_url + '#(O_o)';
      var third_url = first_url + '#fragment';
      var alternate_response_body = 'New body';
      var alternate_response = new Response(alternate_response_body,
        { statusText: 'New status' });
      return cache.put(new Request(first_url),
        new Response('Old body', { statusText: 'Old status' }))
        .then(function () {
          return cache.put(new Request(second_url), alternate_response.clone());
        })
        .then(function () {
          return cache.match(test_url);
        })
        .then(function (result) {
          assert_response_equals(result, alternate_response,
            'Cache.put should replace existing ' +
            'response with new response.');
          return result.text();
        })
        .then(function (body) {
          assert_equals(body, alternate_response_body,
            'Cache put should store new response body.');
        })
        .then(function () {
          return cache.put(new Request(third_url), alternate_response.clone());
        })
        .then(function () {
          return cache.keys();
        })
        .then(function (results) {
          // Should match urls (without fragments or with different ones) to the
          // same cache key. However, result.url should be the latest url used.
          assert_equals(results[0].url, third_url);
          return;
        });
    }, 'Cache.put called multiple times with request URLs that differ only by a fragment');

    await cache_test(function (cache) {
      var url = 'http://example.com/foo';
      return cache.put(url, new Response('some body'))
        .then(function () { return cache.match(url); })
        .then(function (response) { return response.text(); })
        .then(function (body) {
          assert_equals(body, 'some body',
            'Cache.put should accept a string as request.');
        });
    }, 'Cache.put with a string request');

    // TODO: we throw immediately instead of returning a rejected promise
    // await cache_test(function (cache, test) {
    //   return promise_rejects_js(
    //     cache.put(new Request(test_url), 'Hello world!'),
    //     'Cache.put should only accept a Response object as the response.');
    // }, 'Cache.put with an invalid response');

    await cache_test(function (cache, test) {
      return promise_rejects_js(
        cache.put(new Request('file:///etc/passwd'),
          new Response(test_body)),
        'Cache.put should reject non-HTTP/HTTPS requests with a TypeError.');
    }, 'Cache.put with a non-HTTP/HTTPS request');

    // Skipped: We don't support relative URLs without a base.
    // await cache_test(function (cache) {
    //   var response = new Response(test_body);
    //   return cache.put(new Request('relative-url'), response.clone())
    //     .then(function () {
    //       return cache.match(new URL('relative-url', location.href).href);
    //     })
    //     .then(function (result) {
    //       assert_response_equals(result, response,
    //         'Cache.put should accept a relative URL ' +
    //         'as the request.');
    //     });
    // }, 'Cache.put with a relative URL');

    await cache_test(function (cache, test) {
      var request = new Request('http://example.com/foo', { method: 'HEAD' });
      return promise_rejects_js(
        cache.put(request, new Response(test_body)),
        'Cache.put should throw a TypeError for non-GET requests.');
    }, 'Cache.put with a non-GET request');

    // TODO: we throw immediately instead of returning a rejected promise
    // await cache_test(function (cache, test) {
    //   return promise_rejects_js(
    //     cache.put(new Request(test_url), null),
    //     'Cache.put should throw a TypeError for a null response.');
    // }, 'Cache.put with a null response');

    await cache_test(function (cache, test) {
      var request = new Request(test_url, { method: 'POST', body: test_body });
      return promise_rejects_js(
        cache.put(request, new Response(test_body)),
        'Cache.put should throw a TypeError for a POST request.');
    }, 'Cache.put with a POST request');

    await cache_test(function (cache) {
      var response = new Response(test_body);
      assert_false(response.bodyUsed,
        '[https://fetch.spec.whatwg.org/#dom-body-bodyused] ' +
        'Response.bodyUsed should be initially false.');
      return response.text().then(function () {
        assert_true(
          response.bodyUsed,
          '[https://fetch.spec.whatwg.org/#concept-body-consume-body] ' +
          'The text() method should make the body disturbed.');
        var request = new Request(test_url);
        return cache.put(request, response).then(() => {
          assert_unreached('cache.put should be rejected');
        }, () => { });
      });
    }, 'Cache.put with a used response body');

    await cache_test(function (cache) {
      var response = new Response(test_body);
      return cache.put(new Request(test_url), response)
        .then(function () {
          assert_throws_js(() => response.body.getReader());
        });
    }, 'getReader() after Cache.put');

    await cache_test(function (cache, test) {
      return promise_rejects_js(
        cache.put(new Request(test_url),
          new Response(test_body, { headers: { VARY: '*' } })),
        'Cache.put should reject VARY:* Responses with a TypeError.');
    }, 'Cache.put with a VARY:* Response');

    await cache_test(function (cache, test) {
      return promise_rejects_js(
        cache.put(new Request(test_url),
          new Response(test_body,
            { headers: { VARY: 'Accept-Language,*' } })),
        'Cache.put should reject Responses with an embedded VARY:* with a ' +
        'TypeError.');
    }, 'Cache.put with an embedded VARY:* Response');

    // TODO: opaque response not implemented correctly in fetch
    // await cache_test(async function (cache, test) {
    //   const url = new URL(winterTestsBaseUrl + '?vary=*');
    //   const request = new Request(url, { mode: 'no-cors' });
    //   const response = await fetch(request);
    //   assert_equals(response.type, 'opaque');
    //   await cache.put(request, response);
    // }, 'Cache.put with a VARY:* opaque response should not reject');

    await cache_test(function (cache) {
      var url = 'http://example.com/foo.html';
      var redirectURL = 'http://example.com/foo-bar.html';
      var redirectResponse = Response.redirect(redirectURL);
      assert_equals(redirectResponse.headers.get('Location'), redirectURL,
        'Response.redirect() should set Location header.');
      return cache.put(url, redirectResponse.clone())
        .then(function () {
          return cache.match(url);
        })
        .then(function (response) {
          assert_response_equals(response, redirectResponse,
            'Redirect response is reproduced by the Cache API');
          assert_equals(response.headers.get('Location'), redirectURL,
            'Location header is preserved by Cache API.');
        });
    }, 'Cache.put should store Response.redirect() correctly');

    await cache_test(async (cache) => {
      var request = new Request(test_url);
      var response = new Response(new Blob([test_body]));
      await cache.put(request, response);
      var cachedResponse = await cache.match(request);
      assert_equals(await cachedResponse.text(), test_body);
    }, 'Cache.put called with simple Request and blob Response');

    await cache_test(async (cache) => {
      var formData = new FormData();
      formData.append("name", "value");

      var request = new Request(test_url);
      var response = new Response(formData);
      await cache.put(request, response);
      var cachedResponse = await cache.match(request);
      var cachedResponseText = await cachedResponse.text();
      assert_true(cachedResponseText.indexOf("name=\"name\"\r\n\r\nvalue") !== -1);
    }, 'Cache.put called with simple Request and form data Response');

    var test_cache_list =
      ['', 'example', 'Another cache name', 'A', 'a', 'ex ample'];

    await promise_test(function (test) {
      return caches.keys()
        .then(function (keys) {
          assert_true(Array.isArray(keys),
            'CacheStorage.keys should return an Array.');
          return Promise.all(
            keys
              // The default cache can't be deleted
              .filter(key => key !== winterJsBuiltInDefaultCacheName)
              .map(function (key) {
                return caches.delete(key);
              })
          );
        })
        .then(function () {
          return Promise.all(test_cache_list.map(function (key) {
            return caches.open(key);
          }));
        })

        .then(function () { return caches.keys(); })
        .then(function (keys) {
          assert_true(Array.isArray(keys),
            'CacheStorage.keys should return an Array.');
          // Remove the default cache from the list of keys
          keys.splice(keys.indexOf(winterJsBuiltInDefaultCacheName), 1);
          assert_array_equals(keys,
            test_cache_list,
            'CacheStorage.keys should only return ' +
            'existing caches.');
        });
    }, 'CacheStorage keys');

    (function () {
      var next_index = 1;

      // Returns a transaction (request, response, and url) for a unique URL.
      function create_unique_transaction(test) {
        var uniquifier = String(next_index++);
        var url = 'http://example.com/' + uniquifier;

        return {
          request: new Request(url),
          response: new Response('hello'),
          url: url
        };
      }

      globalThis.create_unique_transaction = create_unique_transaction;
    })();

    await cache_test(function (cache) {
      var transaction = create_unique_transaction();

      return cache.put(transaction.request.clone(), transaction.response.clone())
        .then(function () {
          return caches.match(transaction.request);
        })
        .then(function (response) {
          assert_response_equals(response, transaction.response,
            'The response should not have changed.');
        });
    }, 'CacheStorageMatch with no cache name provided');

    await cache_test(function (cache) {
      var transaction = create_unique_transaction();

      var test_cache_list = ['a', 'b', 'c'];
      return cache.put(transaction.request.clone(), transaction.response.clone())
        .then(function () {
          return Promise.all(test_cache_list.map(function (key) {
            return caches.open(key);
          }));
        })
        .then(function () {
          return caches.match(transaction.request);
        })
        .then(function (response) {
          assert_response_equals(response, transaction.response,
            'The response should not have changed.');
        });
    }, 'CacheStorageMatch from one of many caches');

    await promise_test(function (test) {
      var transaction = create_unique_transaction();

      var test_cache_list = ['x', 'y', 'z'];
      return Promise.all(test_cache_list.map(function (key) {
        return caches.open(key);
      }))
        .then(function () { return caches.open('x'); })
        .then(function (cache) {
          return cache.put(transaction.request.clone(),
            transaction.response.clone());
        })
        .then(function () {
          return caches.match(transaction.request, { cacheName: 'x' });
        })
        .then(function (response) {
          assert_response_equals(response, transaction.response,
            'The response should not have changed.');
        })
        .then(function () {
          return caches.match(transaction.request, { cacheName: 'y' });
        })
        .then(function (response) {
          assert_equals(response, undefined,
            'Cache y should not have a response for the request.');
        });
    }, 'CacheStorageMatch from one of many caches by name');

    await cache_test(function (cache) {
      var transaction = create_unique_transaction();
      return cache.put(transaction.url, transaction.response.clone())
        .then(function () {
          return caches.match(transaction.request);
        })
        .then(function (response) {
          assert_response_equals(response, transaction.response,
            'The response should not have changed.');
        });
    }, 'CacheStorageMatch a string request');

    await cache_test(function (cache) {
      var transaction = create_unique_transaction();
      return cache.put(transaction.request.clone(), transaction.response.clone())
        .then(function () {
          return caches.match(new Request(transaction.request.url,
            { method: 'HEAD' }));
        })
        .then(function (response) {
          assert_equals(response, undefined,
            'A HEAD request should not be matched');
        });
    }, 'CacheStorageMatch a HEAD request');

    await promise_test(function (test) {
      var transaction = create_unique_transaction();
      return caches.match(transaction.request)
        .then(function (response) {
          assert_equals(response, undefined,
            'The response should not be found.');
        });
    }, 'CacheStorageMatch with no cached entry');

    await promise_test(function (test) {
      var transaction = create_unique_transaction();
      return caches.delete('foo')
        .then(function () {
          return caches.has('foo');
        })
        .then(function (has_foo) {
          assert_false(has_foo, "The cache should not exist.");
          return caches.match(transaction.request, { cacheName: 'foo' });
        })
        .then(function (response) {
          assert_equals(response, undefined,
            'The match with bad cache name should resolve to ' +
            'undefined.');
          return caches.has('foo');
        })
        .then(function (has_foo) {
          assert_false(has_foo, "The cache should still not exist.");
        });
    }, 'CacheStorageMatch with no caches available but name provided');

    await cache_test(function (cache) {
      var transaction = create_unique_transaction();

      return caches.delete('')
        .then(function () {
          return caches.has('');
        })
        .then(function (has_cache) {
          assert_false(has_cache, "The cache should not exist.");
          return cache.put(transaction.request, transaction.response.clone());
        })
        .then(function () {
          return caches.match(transaction.request, { cacheName: '' });
        })
        .then(function (response) {
          assert_equals(response, undefined,
            'The response should not be found.');
          return caches.open('');
        })
        .then(function (cache) {
          return cache.put(transaction.request, transaction.response);
        })
        .then(function () {
          return caches.match(transaction.request, { cacheName: '' });
        })
        .then(function (response) {
          assert_response_equals(response, transaction.response,
            'The response should be matched.');
          return caches.delete('');
        });
    }, 'CacheStorageMatch with empty cache name provided');

    await cache_test(function (cache) {
      var request = new Request('http://example.com/?foo');
      var no_query_request = new Request('http://example.com/');
      var response = new Response('foo');
      return cache.put(request.clone(), response.clone())
        .then(function () {
          return caches.match(no_query_request.clone());
        })
        .then(function (result) {
          assert_equals(
            result, undefined,
            'CacheStorageMatch should resolve as undefined with a ' +
            'mismatched query.');
          return caches.match(no_query_request.clone(),
            { ignoreSearch: true });
        })
        .then(function (result) {
          assert_response_equals(
            result, response,
            'CacheStorageMatch with ignoreSearch should ignore the ' +
            'query of the request.');
        });
    }, 'CacheStorageMatch supports ignoreSearch');

    await cache_test(function (cache) {
      var request = new Request('http://example.com/');
      var head_request = new Request('http://example.com/', { method: 'HEAD' });
      var response = new Response('foo');
      return cache.put(request.clone(), response.clone())
        .then(function () {
          return caches.match(head_request.clone());
        })
        .then(function (result) {
          assert_equals(
            result, undefined,
            'CacheStorageMatch should resolve as undefined with a ' +
            'mismatched method.');
          return caches.match(head_request.clone(),
            { ignoreMethod: true });
        })
        .then(function (result) {
          assert_response_equals(
            result, response,
            'CacheStorageMatch with ignoreMethod should ignore the ' +
            'method of request.');
        });
    }, 'Cache.match supports ignoreMethod');

    await cache_test(function (cache) {
      var vary_request = new Request('http://example.com/c',
        { headers: { 'Cookies': 'is-for-cookie' } });
      var vary_response = new Response('', { headers: { 'Vary': 'Cookies' } });
      var mismatched_vary_request = new Request('http://example.com/c');

      return cache.put(vary_request.clone(), vary_response.clone())
        .then(function () {
          return caches.match(mismatched_vary_request.clone());
        })
        .then(function (result) {
          assert_equals(
            result, undefined,
            'CacheStorageMatch should resolve as undefined with a ' +
            ' mismatched vary.');
          return caches.match(mismatched_vary_request.clone(),
            { ignoreVary: true });
        })
        .then(function (result) {
          assert_response_equals(
            result, vary_response,
            'CacheStorageMatch with ignoreVary should ignore the ' +
            'vary of request.');
        });
    }, 'CacheStorageMatch supports ignoreVary');

    await promise_test(function (t) {
      var cache_name = 'cache-storage/foo';
      return caches.delete(cache_name)
        .then(function () {
          return caches.open(cache_name);
        })
        .then(function (cache) {
          assert_true(cache instanceof Cache,
            'CacheStorage.open should return a Cache.');
        });
    }, 'CacheStorage.open');

    await promise_test(function (t) {
      var cache_name = 'cache-storage/bar';
      var first_cache = null;
      var second_cache = null;
      return caches.open(cache_name)
        .then(function (cache) {
          first_cache = cache;
          return caches.delete(cache_name);
        })
        .then(function () {
          return first_cache.add(winterTestsBaseUrl);
        })
        .then(function () {
          return caches.keys();
        })
        .then(function (cache_names) {
          assert_equals(cache_names.indexOf(cache_name), -1);
          return caches.open(cache_name);
        })
        .then(function (cache) {
          second_cache = cache;
          return second_cache.keys();
        })
        .then(function (keys) {
          assert_equals(keys.length, 0);
          return first_cache.keys();
        })
        .then(function (keys) {
          assert_equals(keys.length, 1);
          // Clean up
          return caches.delete(cache_name);
        });
    }, 'CacheStorage.delete dooms, but does not delete immediately');

    await promise_test(function (t) {
      // Note that this test may collide with other tests running in the same
      // origin that also uses an empty cache name.
      var cache_name = '';
      return caches.delete(cache_name)
        .then(function () {
          return caches.open(cache_name);
        })
        .then(function (cache) {
          assert_true(cache instanceof Cache,
            'CacheStorage.open should accept an empty name.');
        });
    }, 'CacheStorage.open with an empty name');

    // TODO: We throw directly instead of returning a rejected promise.
    // await promise_test(function (t) {
    //   return promise_rejects_js(
    //     t,
    //     TypeError,
    //     caches.open(),
    //     'CacheStorage.open should throw TypeError if called with no arguments.');
    // }, 'CacheStorage.open with no arguments');

    await promise_test(function (t) {
      var test_cases = [
        {
          name: 'cache-storage/lowercase',
          should_not_match:
            [
              'cache-storage/Lowercase',
              ' cache-storage/lowercase',
              'cache-storage/lowercase '
            ]
        },
        {
          name: 'cache-storage/has a space',
          should_not_match:
            [
              'cache-storage/has'
            ]
        },
        {
          name: 'cache-storage/has\x00_in_the_name',
          should_not_match:
            [
              'cache-storage/has',
              'cache-storage/has_in_the_name'
            ]
        }
      ];
      return Promise.all(test_cases.map(function (testcase) {
        var cache_name = testcase.name;
        return caches.delete(cache_name)
          .then(function () {
            return caches.open(cache_name);
          })
          .then(function () {
            return caches.has(cache_name);
          })
          .then(function (result) {
            assert_true(result,
              'CacheStorage.has should return true for existing ' +
              'cache.');
          })
          .then(function () {
            return Promise.all(
              testcase.should_not_match.map(function (cache_name) {
                return caches.has(cache_name)
                  .then(function (result) {
                    assert_false(result,
                      'CacheStorage.has should only perform ' +
                      'exact matches on cache names.');
                  });
              }));
          })
          .then(function () {
            return caches.delete(cache_name);
          });
      }));
    }, 'CacheStorage.has with existing cache');

    await promise_test(function (t) {
      return caches.has('cheezburger')
        .then(function (result) {
          assert_false(result,
            'CacheStorage.has should return false for ' +
            'nonexistent cache.');
        });
    }, 'CacheStorage.has with nonexistent cache');

    await promise_test(function (t) {
      var cache_name = 'cache-storage/open';
      var cache;
      return caches.delete(cache_name)
        .then(function () {
          return caches.open(cache_name);
        })
        .then(function (result) {
          cache = result;
        })
        .then(function () {
          return cache.add(winterTestsBaseUrl);
        })
        .then(function () {
          return caches.open(cache_name);
        })
        .then(function (result) {
          assert_true(result instanceof Cache,
            'CacheStorage.open should return a Cache object');
          assert_not_equals(result, cache,
            'CacheStorage.open should return a new Cache ' +
            'object each time its called.');
          return Promise.all([cache.keys(), result.keys()]);
        })
        .then(function (results) {
          var expected_urls = results[0].map(function (r) { return r.url });
          var actual_urls = results[1].map(function (r) { return r.url });
          assert_array_equals(actual_urls, expected_urls,
            'CacheStorage.open should return a new Cache ' +
            'object for the same backing store.');
        });
    }, 'CacheStorage.open with existing cache');

    await promise_test(function (t) {
      var cache_name = 'cache-storage/delete';

      return caches.delete(cache_name)
        .then(function () {
          return caches.open(cache_name);
        })
        .then(function () { return caches.delete(cache_name); })
        .then(function (result) {
          assert_true(result,
            'CacheStorage.delete should return true after ' +
            'deleting an existing cache.');
        })

        .then(function () { return caches.has(cache_name); })
        .then(function (cache_exists) {
          assert_false(cache_exists,
            'CacheStorage.has should return false after ' +
            'fulfillment of CacheStorage.delete promise.');
        });
    }, 'CacheStorage.delete with existing cache');

    await promise_test(function (t) {
      return caches.delete('cheezburger')
        .then(function (result) {
          assert_false(result,
            'CacheStorage.delete should return false for a ' +
            'nonexistent cache.');
        });
    }, 'CacheStorage.delete with nonexistent cache');

    // TODO: the cache code handles keys with invalid characters correctly, but
    // the rest of the code does not, so this test can't run successfully
    // await promise_test(function (t) {
    //   var unpaired_name = 'unpaired\uD800';
    //   var converted_name = 'unpaired\uFFFD';

    //   // The test assumes that a cache with converted_name does not
    //   // exist, but if the implementation fails the test then such
    //   // a cache will be created. Start off in a fresh state by
    //   // deleting all caches.
    //   return delete_all_caches()
    //     .then(function () {
    //       return caches.has(converted_name);
    //     })
    //     .then(function (cache_exists) {
    //       assert_false(cache_exists,
    //         'Test setup failure: cache should not exist');
    //     })
    //     .then(function () { return caches.open(unpaired_name); })
    //     .then(function () { return caches.keys(); })
    //     .then(function (keys) {
    //       assert_true(keys.indexOf(unpaired_name) !== -1,
    //         'keys should include cache with bad name');
    //     })
    //     .then(function () { return caches.has(unpaired_name); })
    //     .then(function (cache_exists) {
    //       assert_true(cache_exists,
    //         'CacheStorage names should be not be converted.');
    //     })
    //     .then(function () { return caches.has(converted_name); })
    //     .then(function (cache_exists) {
    //       assert_false(cache_exists,
    //         'CacheStorage names should be not be converted.');
    //     });
    // }, 'CacheStorage names are DOMStrings not USVStrings');

    return new Response('All Tests Passed!');
  }
  catch (e) {
    return new Response(e.toString(), { status: 500 });
  }
}

export { handleRequest };