import { assert_array_equals, assert_equals, assert_false, assert_throws_js, assert_true, test } from "../test-utils";

async function handleRequest(request) {
  try {
    test(function () {
      var params = new URLSearchParams();
      params.append('a', 'b');
      assert_equals(params + '', 'a=b');
      params.append('a', 'b');
      assert_equals(params + '', 'a=b&a=b');
      params.append('a', 'c');
      assert_equals(params + '', 'a=b&a=b&a=c');
    }, 'Append same name');

    test(function () {
      var params = new URLSearchParams();
      params.append('', '');
      assert_equals(params + '', '=');
      params.append('', '');
      assert_equals(params + '', '=&=');
    }, 'Append empty strings');

    test(function () {
      var params = new URLSearchParams();
      params.append(null, null);
      assert_equals(params + '', 'null=null');
      params.append(null, null);
      assert_equals(params + '', 'null=null&null=null');
    }, 'Append null');

    test(function () {
      var params = new URLSearchParams();
      params.append('first', 1);
      params.append('second', 2);
      params.append('third', '');
      params.append('first', 10);
      assert_true(params.has('first'), 'Search params object has name "first"');
      assert_equals(params.get('first'), '1', 'Search params object has name "first" with value "1"');
      assert_equals(params.get('second'), '2', 'Search params object has name "second" with value "2"');
      assert_equals(params.get('third'), '', 'Search params object has name "third" with value ""');
      params.append('first', 10);
      assert_equals(params.get('first'), '1', 'Search params object has name "first" with value "1"');
    }, 'Append multiple');

    test(function () {
      var params = new URLSearchParams();
      assert_equals(params + '', '');
      params = new URLSearchParams('');
      assert_equals(params + '', '');
      params = new URLSearchParams('a=b');
      assert_equals(params + '', 'a=b');
      params = new URLSearchParams(params);
      assert_equals(params + '', 'a=b');
    }, 'Basic URLSearchParams construction');

    test(function () {
      var params = new URLSearchParams()
      assert_equals(params.toString(), "")
    }, "URLSearchParams constructor, no arguments")

    test(function () {
      var params = new URLSearchParams("?a=b")
      assert_equals(params.toString(), "a=b")
    }, 'URLSearchParams constructor, remove leading "?"')

    test(() => {
      var params = new URLSearchParams('');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_equals(Object.getPrototypeOf(params), URLSearchParams.prototype, 'expected URLSearchParams.prototype as prototype.');
    }, "URLSearchParams constructor, empty string as argument")

    test(() => {
      var params = new URLSearchParams({});
      assert_equals(params + '', "");
    }, 'URLSearchParams constructor, {} as argument');

    test(function () {
      var params = new URLSearchParams('a=b');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_false(params.has('b'), 'Search params object has not got name "b"');

      params = new URLSearchParams('a=b&c');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_true(params.has('c'), 'Search params object has name "c"');

      params = new URLSearchParams('&a&&& &&&&&a+b=& c&m%c3%b8%c3%b8');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_true(params.has('a b'), 'Search params object has name "a b"');
      assert_true(params.has(' '), 'Search params object has name " "');
      assert_false(params.has('c'), 'Search params object did not have the name "c"');
      assert_true(params.has(' c'), 'Search params object has name " c"');
      assert_true(params.has('møø'), 'Search params object has name "møø"');

      params = new URLSearchParams('id=0&value=%');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('id'), 'Search params object has name "id"');
      assert_true(params.has('value'), 'Search params object has name "value"');
      assert_equals(params.get('id'), '0');
      assert_equals(params.get('value'), '%');

      params = new URLSearchParams('b=%2sf%2a');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('b'), 'Search params object has name "b"');
      assert_equals(params.get('b'), '%2sf*');

      params = new URLSearchParams('b=%2%2af%2a');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('b'), 'Search params object has name "b"');
      assert_equals(params.get('b'), '%2*f*');

      params = new URLSearchParams('b=%%2a');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('b'), 'Search params object has name "b"');
      assert_equals(params.get('b'), '%*');
    }, 'URLSearchParams constructor, string.');

    test(function () {
      var seed = new URLSearchParams('a=b&c=d');
      var params = new URLSearchParams(seed);
      assert_true(params != null, 'constructor returned non-null value.');
      assert_equals(params.get('a'), 'b');
      assert_equals(params.get('c'), 'd');
      assert_false(params.has('d'));
      // The name-value pairs are copied when created; later updates
      // should not be observable.
      seed.append('e', 'f');
      assert_false(params.has('e'));
      params.append('g', 'h');
      assert_false(seed.has('g'));
    }, 'URLSearchParams constructor, object.');

    test(function () {
      var formData = new FormData()
      formData.append('a', 'b')
      formData.append('c', 'd')
      var params = new URLSearchParams(formData);
      assert_true(params != null, 'constructor returned non-null value.');
      assert_equals(params.get('a'), 'b');
      assert_equals(params.get('c'), 'd');
      assert_false(params.has('d'));
      // The name-value pairs are copied when created; later updates
      // should not be observable.
      formData.append('e', 'f');
      assert_false(params.has('e'));
      params.append('g', 'h');
      assert_false(formData.has('g'));
    }, 'URLSearchParams constructor, FormData.');

    test(function () {
      var params = new URLSearchParams('a=b+c');
      assert_equals(params.get('a'), 'b c');
      params = new URLSearchParams('a+b=c');
      assert_equals(params.get('a b'), 'c');
    }, 'Parse +');

    test(function () {
      const testValue = '+15555555555';
      const params = new URLSearchParams();
      params.set('query', testValue);
      var newParams = new URLSearchParams(params.toString());

      assert_equals(params.toString(), 'query=%2B15555555555');
      assert_equals(params.get('query'), testValue);
      assert_equals(newParams.get('query'), testValue);
    }, 'Parse encoded +');

    test(function () {
      var params = new URLSearchParams('a=b c');
      assert_equals(params.get('a'), 'b c');
      params = new URLSearchParams('a b=c');
      assert_equals(params.get('a b'), 'c');
    }, 'Parse space');

    test(function () {
      var params = new URLSearchParams('a=b%20c');
      assert_equals(params.get('a'), 'b c');
      params = new URLSearchParams('a%20b=c');
      assert_equals(params.get('a b'), 'c');
    }, 'Parse %20');

    test(function () {
      var params = new URLSearchParams('a=b\0c');
      assert_equals(params.get('a'), 'b\0c');
      params = new URLSearchParams('a\0b=c');
      assert_equals(params.get('a\0b'), 'c');
    }, 'Parse \\0');

    test(function () {
      var params = new URLSearchParams('a=b%00c');
      assert_equals(params.get('a'), 'b\0c');
      params = new URLSearchParams('a%00b=c');
      assert_equals(params.get('a\0b'), 'c');
    }, 'Parse %00');

    test(function () {
      var params = new URLSearchParams('a=b\u2384');
      assert_equals(params.get('a'), 'b\u2384');
      params = new URLSearchParams('a\u2384b=c');
      assert_equals(params.get('a\u2384b'), 'c');
    }, 'Parse \u2384');  // Unicode Character 'COMPOSITION SYMBOL' (U+2384)

    test(function () {
      var params = new URLSearchParams('a=b%e2%8e%84');
      assert_equals(params.get('a'), 'b\u2384');
      params = new URLSearchParams('a%e2%8e%84b=c');
      assert_equals(params.get('a\u2384b'), 'c');
    }, 'Parse %e2%8e%84');  // Unicode Character 'COMPOSITION SYMBOL' (U+2384)

    test(function () {
      var params = new URLSearchParams('a=b\uD83D\uDCA9c');
      assert_equals(params.get('a'), 'b\uD83D\uDCA9c');
      params = new URLSearchParams('a\uD83D\uDCA9b=c');
      assert_equals(params.get('a\uD83D\uDCA9b'), 'c');
    }, 'Parse \uD83D\uDCA9');  // Unicode Character 'PILE OF POO' (U+1F4A9)

    test(function () {
      var params = new URLSearchParams('a=b%f0%9f%92%a9c');
      assert_equals(params.get('a'), 'b\uD83D\uDCA9c');
      params = new URLSearchParams('a%f0%9f%92%a9b=c');
      assert_equals(params.get('a\uD83D\uDCA9b'), 'c');
    }, 'Parse %f0%9f%92%a9');  // Unicode Character 'PILE OF POO' (U+1F4A9)

    test(function () {
      var params = new URLSearchParams([]);
      assert_true(params != null, 'constructor returned non-null value.');
      params = new URLSearchParams([['a', 'b'], ['c', 'd']]);
      assert_equals(params.get("a"), "b");
      assert_equals(params.get("c"), "d");
      assert_throws_js(function () { new URLSearchParams([[1]]); });
      assert_throws_js(function () { new URLSearchParams([[1, 2, 3]]); });
    }, "Constructor with sequence of sequences of strings");

    [
      { "input": { "+": "%C2" }, "output": [["+", "%C2"]], "name": "object with +" },
      { "input": { c: "x", a: "?" }, "output": [["c", "x"], ["a", "?"]], "name": "object with two keys" },
      { "input": [["c", "x"], ["a", "?"]], "output": [["c", "x"], ["a", "?"]], "name": "array with two keys" },
    ].forEach((val) => {
      test(() => {
        let params = new URLSearchParams(val.input),
          i = 0
        for (let param of params) {
          assert_array_equals(param, val.output[i])
          i++
        }
      }, "Construct with " + val.name)
    })

    test(function () {
      var params = new URLSearchParams('a=b&c=d');
      params.delete('a');
      assert_equals(params + '', 'c=d');
      params = new URLSearchParams('a=a&b=b&a=a&c=c');
      params.delete('a');
      assert_equals(params + '', 'b=b&c=c');
      params = new URLSearchParams('a=a&=&b=b&c=c');
      params.delete('');
      assert_equals(params + '', 'a=a&b=b&c=c');
      params = new URLSearchParams('a=a&null=null&b=b');
      params.delete(null);
      assert_equals(params + '', 'a=a&b=b');
      params = new URLSearchParams('a=a&undefined=undefined&b=b');
      params.delete(undefined);
      assert_equals(params + '', 'a=a&b=b');
    }, 'Delete basics');

    test(function () {
      var params = new URLSearchParams();
      params.append('first', 1);
      assert_true(params.has('first'), 'Search params object has name "first"');
      assert_equals(params.get('first'), '1', 'Search params object has name "first" with value "1"');
      params.delete('first');
      assert_false(params.has('first'), 'Search params object has no "first" name');
      params.append('first', 1);
      params.append('first', 10);
      params.delete('first');
      assert_false(params.has('first'), 'Search params object has no "first" name');
    }, 'Deleting appended multiple');

    test(function () {
      var url = new URL('http://example.com/?param1&param2');
      url.searchParams.delete('param1');
      url.searchParams.delete('param2');
      assert_equals(url.href, 'http://example.com/', 'url.href does not have ?');
      assert_equals(url.search, '', 'url.search does not have ?');
    }, 'Deleting all params removes ? from URL');

    test(function () {
      var url = new URL('http://example.com/?');
      url.searchParams.delete('param1');
      assert_equals(url.href, 'http://example.com/', 'url.href does not have ?');
      assert_equals(url.search, '', 'url.search does not have ?');
    }, 'Removing non-existent param removes ? from URL');

    test(() => {
      const url = new URL('data:space    ?test');
      assert_true(url.searchParams.has('test'));
      url.searchParams.delete('test');
      assert_false(url.searchParams.has('test'));
      assert_equals(url.search, '');
      assert_equals(url.pathname, 'space');
      assert_equals(url.href, 'data:space');
    }, 'Changing the query of a URL with an opaque path can impact the path');

    test(() => {
      const url = new URL('data:space    ?test#test');
      url.searchParams.delete('test');
      assert_equals(url.search, '');
      assert_equals(url.pathname, 'space    ');
      assert_equals(url.href, 'data:space    #test');
    }, 'Changing the query of a URL with an opaque path can impact the path if the URL has no fragment');

    test(() => {
      const params = new URLSearchParams();
      params.append('a', 'b');
      params.append('a', 'c');
      params.append('a', 'd');
      params.delete('a', 'c');
      assert_equals(params.toString(), 'a=b&a=d');
    }, "Two-argument delete()");

    test(() => {
      const params = new URLSearchParams();
      params.append('a', 'b');
      params.append('a', 'c');
      params.append('b', 'c');
      params.append('b', 'd');
      params.delete('b', 'c');
      params.delete('a', undefined);
      assert_equals(params.toString(), 'b=d');
    }, "Two-argument delete() respects undefined as second arg");

    test(function () {
      var params = new URLSearchParams('a=1&b=2&c=3');
      var keys = [];
      var values = [];
      params.forEach(function (value, key) {
        keys.push(key);
        values.push(value);
      });
      assert_array_equals(keys, ['a', 'b', 'c']);
      assert_array_equals(values, ['1', '2', '3']);
    }, "ForEach Check");

    test(function () {
      let a = new URL("http://a.b/c?a=1&b=2&c=3&d=4");
      let b = a.searchParams;
      var c = [];
      for (const i of b) {
        a.search = "x=1&y=2&z=3";
        c.push(i);
      }
      assert_array_equals(c[0], ["a", "1"]);
      assert_array_equals(c[1], ["y", "2"]);
      assert_array_equals(c[2], ["z", "3"]);
    }, "For-of Check");

    test(function () {
      let a = new URL("http://a.b/c");
      let b = a.searchParams;
      for (const i of b) {
        assert_unreached(i);
      }
    }, "empty");

    test(function () {
      const url = new URL("http://localhost/query?param0=0&param1=1&param2=2");
      const searchParams = url.searchParams;
      const seen = [];
      for (const param of searchParams) {
        if (param[0] === 'param0') {
          searchParams.delete('param1');
        }
        seen.push(param);
      }

      assert_array_equals(seen[0], ["param0", "0"]);
      assert_array_equals(seen[1], ["param2", "2"]);
    }, "delete next param during iteration");

    test(function () {
      const url = new URL("http://localhost/query?param0=0&param1=1&param2=2");
      const searchParams = url.searchParams;
      const seen = [];
      for (const param of searchParams) {
        if (param[0] === 'param0') {
          searchParams.delete('param0');
          // 'param1=1' is now in the first slot, so the next iteration will see 'param2=2'.
        } else {
          seen.push(param);
        }
      }

      assert_array_equals(seen[0], ["param2", "2"]);
    }, "delete current param during iteration");

    test(function () {
      const url = new URL("http://localhost/query?param0=0&param1=1&param2=2");
      const searchParams = url.searchParams;
      const seen = [];
      for (const param of searchParams) {
        seen.push(param[0]);
        searchParams.delete(param[0]);
      }

      assert_array_equals(seen, ["param0", "param2"], "param1 should not have been seen by the loop");
      assert_equals(String(searchParams), "param1=1", "param1 should remain");
    }, "delete every param seen during iteration");

    test(function () {
      var params = new URLSearchParams('a=b&c=d');
      assert_equals(params.get('a'), 'b');
      assert_equals(params.get('c'), 'd');
      assert_equals(params.get('e'), null);
      params = new URLSearchParams('a=b&c=d&a=e');
      assert_equals(params.get('a'), 'b');
      params = new URLSearchParams('=b&c=d');
      assert_equals(params.get(''), 'b');
      params = new URLSearchParams('a=&c=d&a=e');
      assert_equals(params.get('a'), '');
    }, 'Get basics');

    test(function () {
      var params = new URLSearchParams('first=second&third&&');
      assert_true(params != null, 'constructor returned non-null value.');
      assert_true(params.has('first'), 'Search params object has name "first"');
      assert_equals(params.get('first'), 'second', 'Search params object has name "first" with value "second"');
      assert_equals(params.get('third'), '', 'Search params object has name "third" with the empty value.');
      assert_equals(params.get('fourth'), null, 'Search params object has no "fourth" name and value.');
    }, 'More get() basics');

    test(function () {
      var params = new URLSearchParams('a=b&c=d');
      assert_array_equals(params.getAll('a'), ['b']);
      assert_array_equals(params.getAll('c'), ['d']);
      assert_array_equals(params.getAll('e'), []);
      params = new URLSearchParams('a=b&c=d&a=e');
      assert_array_equals(params.getAll('a'), ['b', 'e']);
      params = new URLSearchParams('=b&c=d');
      assert_array_equals(params.getAll(''), ['b']);
      params = new URLSearchParams('a=&c=d&a=e');
      assert_array_equals(params.getAll('a'), ['', 'e']);
    }, 'getAll() basics');

    test(function () {
      var params = new URLSearchParams('a=1&a=2&a=3&a');
      assert_true(params.has('a'), 'Search params object has name "a"');
      var matches = params.getAll('a');
      assert_true(matches && matches.length == 4, 'Search params object has values for name "a"');
      assert_array_equals(matches, ['1', '2', '3', ''], 'Search params object has expected name "a" values');
      params.set('a', 'one');
      assert_equals(params.get('a'), 'one', 'Search params object has name "a" with value "one"');
      var matches = params.getAll('a');
      assert_true(matches && matches.length == 1, 'Search params object has values for name "a"');
      assert_array_equals(matches, ['one'], 'Search params object has expected name "a" values');
    }, 'getAll() multiples');

    test(function () {
      var params = new URLSearchParams('a=b&c=d');
      assert_true(params.has('a'));
      assert_true(params.has('c'));
      assert_false(params.has('e'));
      params = new URLSearchParams('a=b&c=d&a=e');
      assert_true(params.has('a'));
      params = new URLSearchParams('=b&c=d');
      assert_true(params.has(''));
      params = new URLSearchParams('null=a');
      assert_true(params.has(null));
    }, 'Has basics');

    test(function () {
      var params = new URLSearchParams('a=b&c=d&&');
      params.append('first', 1);
      params.append('first', 2);
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_true(params.has('c'), 'Search params object has name "c"');
      assert_true(params.has('first'), 'Search params object has name "first"');
      assert_false(params.has('d'), 'Search params object has no name "d"');
      params.delete('first');
      assert_false(params.has('first'), 'Search params object has no name "first"');
    }, 'has() following delete()');

    test(() => {
      const params = new URLSearchParams("a=b&a=d&c&e&");
      assert_true(params.has('a', 'b'));
      assert_false(params.has('a', 'c'));
      assert_true(params.has('a', 'd'));
      assert_true(params.has('e', ''));
      params.append('first', null);
      assert_false(params.has('first', ''));
      assert_true(params.has('first', 'null'));
      params.delete('a', 'b');
      assert_true(params.has('a', 'd'));
    }, "Two-argument has()");

    test(() => {
      const params = new URLSearchParams("a=b&a=d&c&e&");
      assert_true(params.has('a', 'b'));
      assert_false(params.has('a', 'c'));
      assert_true(params.has('a', 'd'));
      assert_true(params.has('a', undefined));
    }, "Two-argument has() respects undefined as second arg");

    test(function () {
      var params = new URLSearchParams('a=b&c=d');
      params.set('a', 'B');
      assert_equals(params + '', 'a=B&c=d');
      params = new URLSearchParams('a=b&c=d&a=e');
      params.set('a', 'B');
      assert_equals(params + '', 'a=B&c=d')
      params.set('e', 'f');
      assert_equals(params + '', 'a=B&c=d&e=f')
    }, 'Set basics');

    test(function () {
      var params = new URLSearchParams('a=1&a=2&a=3');
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_equals(params.get('a'), '1', 'Search params object has name "a" with value "1"');
      params.set('first', 4);
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_equals(params.get('a'), '1', 'Search params object has name "a" with value "1"');
      params.set('a', 4);
      assert_true(params.has('a'), 'Search params object has name "a"');
      assert_equals(params.get('a'), '4', 'Search params object has name "a" with value "4"');
    }, 'URLSearchParams.set');

    test(() => {
      const params = new URLSearchParams("a=1&b=2&a=3");
      assert_equals(params.size, 3);

      params.delete("a");
      assert_equals(params.size, 1);
    }, "URLSearchParams's size and deletion");

    test(() => {
      const params = new URLSearchParams("a=1&b=2&a=3");
      assert_equals(params.size, 3);

      params.append("b", "4");
      assert_equals(params.size, 4);
    }, "URLSearchParams's size and addition");

    test(() => {
      const url = new URL("http://localhost/query?a=1&b=2&a=3");
      assert_equals(url.searchParams.size, 3);

      url.searchParams.delete("a");
      assert_equals(url.searchParams.size, 1);

      url.searchParams.append("b", 4);
      assert_equals(url.searchParams.size, 2);
    }, "URLSearchParams's size when obtained from a URL");

    test(() => {
      const url = new URL("http://localhost/query?a=1&b=2&a=3");
      assert_equals(url.searchParams.size, 3);

      url.search = "?";
      assert_equals(url.searchParams.size, 0);
    }, "URLSearchParams's size when obtained from a URL and using .search");

    [
      {
        "input": "z=b&a=b&z=a&a=a",
        "output": [["a", "b"], ["a", "a"], ["z", "b"], ["z", "a"]]
      },
      {
        "input": "\uFFFD=x&\uFFFC&\uFFFD=a",
        "output": [["\uFFFC", ""], ["\uFFFD", "x"], ["\uFFFD", "a"]]
      },
      {
        "input": "ﬃ&🌈", // 🌈 > code point, but < code unit because two code units
        "output": [["🌈", ""], ["ﬃ", ""]]
      },
      {
        "input": "é&e\uFFFD&e\u0301",
        "output": [["e\u0301", ""], ["e\uFFFD", ""], ["é", ""]]
      },
      {
        "input": "z=z&a=a&z=y&a=b&z=x&a=c&z=w&a=d&z=v&a=e&z=u&a=f&z=t&a=g",
        "output": [["a", "a"], ["a", "b"], ["a", "c"], ["a", "d"], ["a", "e"], ["a", "f"], ["a", "g"], ["z", "z"], ["z", "y"], ["z", "x"], ["z", "w"], ["z", "v"], ["z", "u"], ["z", "t"]]
      },
      {
        "input": "bbb&bb&aaa&aa=x&aa=y",
        "output": [["aa", "x"], ["aa", "y"], ["aaa", ""], ["bb", ""], ["bbb", ""]]
      },
      {
        "input": "z=z&=f&=t&=x",
        "output": [["", "f"], ["", "t"], ["", "x"], ["z", "z"]]
      },
      {
        "input": "a🌈&a💩",
        "output": [["a🌈", ""], ["a💩", ""]]
      }
    ].forEach((val) => {
      test(() => {
        let params = new URLSearchParams(val.input),
          i = 0
        params.sort()
        for (let param of params) {
          assert_array_equals(param, val.output[i])
          i++
        }
      }, "Parse and sort: " + val.input)

      test(() => {
        let url = new URL("?" + val.input, "https://example/")
        url.searchParams.sort()
        let params = new URLSearchParams(url.search),
          i = 0
        for (let param of params) {
          assert_array_equals(param, val.output[i])
          i++
        }
      }, "URL parse and sort: " + val.input)
    })

    test(function () {
      const url = new URL("http://example.com/?")
      url.searchParams.sort()
      assert_equals(url.href, "http://example.com/")
      assert_equals(url.search, "")
    }, "Sorting non-existent params removes ? from URL")

    test(function () {
      var params = new URLSearchParams();
      params.append('a', 'b c');
      assert_equals(params + '', 'a=b+c');
      params.delete('a');
      params.append('a b', 'c');
      assert_equals(params + '', 'a+b=c');
    }, 'Serialize space');

    test(function () {
      var params = new URLSearchParams();
      params.append('a', '');
      assert_equals(params + '', 'a=');
      params.append('a', '');
      assert_equals(params + '', 'a=&a=');
      params.append('', 'b');
      assert_equals(params + '', 'a=&a=&=b');
      params.append('', '');
      assert_equals(params + '', 'a=&a=&=b&=');
      params.append('', '');
      assert_equals(params + '', 'a=&a=&=b&=&=');
    }, 'Serialize empty value');

    test(function () {
      var params = new URLSearchParams();
      params.append('', 'b');
      assert_equals(params + '', '=b');
      params.append('', 'b');
      assert_equals(params + '', '=b&=b');
    }, 'Serialize empty name');

    test(function () {
      var params = new URLSearchParams();
      params.append('', '');
      assert_equals(params + '', '=');
      params.append('', '');
      assert_equals(params + '', '=&=');
    }, 'Serialize empty name and value');

    test(function () {
      var params = new URLSearchParams();
      params.append('a', 'b+c');
      assert_equals(params + '', 'a=b%2Bc');
      params.delete('a');
      params.append('a+b', 'c');
      assert_equals(params + '', 'a%2Bb=c');
    }, 'Serialize +');

    test(function () {
      var params = new URLSearchParams();
      params.append('=', 'a');
      assert_equals(params + '', '%3D=a');
      params.append('b', '=');
      assert_equals(params + '', '%3D=a&b=%3D');
    }, 'Serialize =');

    test(function () {
      var params = new URLSearchParams();
      params.append('&', 'a');
      assert_equals(params + '', '%26=a');
      params.append('b', '&');
      assert_equals(params + '', '%26=a&b=%26');
    }, 'Serialize &');

    test(function () {
      var params = new URLSearchParams();
      params.append('a', '*-._');
      assert_equals(params + '', 'a=*-._');
      params.delete('a');
      params.append('*-._', 'c');
      assert_equals(params + '', '*-._=c');
    }, 'Serialize *-._');

    test(function () {
      var params = new URLSearchParams();
      params.append('a', 'b%c');
      assert_equals(params + '', 'a=b%25c');
      params.delete('a');
      params.append('a%b', 'c');
      assert_equals(params + '', 'a%25b=c');

      params = new URLSearchParams('id=0&value=%')
      assert_equals(params + '', 'id=0&value=%25')
    }, 'Serialize %');

    test(function () {
      var params = new URLSearchParams();
      params.append('a', 'b\0c');
      assert_equals(params + '', 'a=b%00c');
      params.delete('a');
      params.append('a\0b', 'c');
      assert_equals(params + '', 'a%00b=c');
    }, 'Serialize \\0');

    test(function () {
      var params = new URLSearchParams();
      params.append('a', 'b\uD83D\uDCA9c');
      assert_equals(params + '', 'a=b%F0%9F%92%A9c');
      params.delete('a');
      params.append('a\uD83D\uDCA9b', 'c');
      assert_equals(params + '', 'a%F0%9F%92%A9b=c');
    }, 'Serialize \uD83D\uDCA9');  // Unicode Character 'PILE OF POO' (U+1F4A9)

    test(function () {
      var params;
      params = new URLSearchParams('a=b&c=d&&e&&');
      assert_equals(params.toString(), 'a=b&c=d&e=');
      params = new URLSearchParams('a = b &a=b&c=d%20');
      assert_equals(params.toString(), 'a+=+b+&a=b&c=d+');
      // The lone '=' _does_ survive the roundtrip.
      params = new URLSearchParams('a=&a=b');
      assert_equals(params.toString(), 'a=&a=b');

      params = new URLSearchParams('b=%2sf%2a');
      assert_equals(params.toString(), 'b=%252sf*');

      params = new URLSearchParams('b=%2%2af%2a');
      assert_equals(params.toString(), 'b=%252*f*');

      params = new URLSearchParams('b=%%2a');
      assert_equals(params.toString(), 'b=%25*');
    }, 'URLSearchParams.toString');

    test(() => {
      const url = new URL('http://www.example.com/?a=b,c');
      const params = url.searchParams;

      assert_equals(url.toString(), 'http://www.example.com/?a=b,c');
      assert_equals(params.toString(), 'a=b%2Cc');

      params.append('x', 'y');

      assert_equals(url.toString(), 'http://www.example.com/?a=b%2Cc&x=y');
      assert_equals(params.toString(), 'a=b%2Cc&x=y');
    }, 'URLSearchParams connected to URL');

    test(() => {
      const url = new URL('http://www.example.com/');
      const params = url.searchParams;

      params.append('a\nb', 'c\rd');
      params.append('e\n\rf', 'g\r\nh');

      assert_equals(params.toString(), "a%0Ab=c%0Dd&e%0A%0Df=g%0D%0Ah");
    }, 'URLSearchParams must not do newline normalization');

    return new Response("All tests passed!", {
      headers: { "content-type": "text/plain" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export { handleRequest };
