# Benchmarking

This benchmarks are done in a MacBook Pro M3 Max laptop with 64 GB of RAM, on Feb 20th, 2024.

This benchmark compares:
* [`workerd`](#workerd): Cloudflare's Service Worker server powered by V8 (repo: https://github.com/cloudflare/workerd)
* [WinterJS Native](#winterjs-native): WinterJS running natively
* [Bun](#bun): Bun (basic http server replicating similar behavior)
* [Node](#node): Node (basic http server replicating similar behavior)
* [WinterJS WASIX](#winterjs-wasix): WinterJS running in Wasmer via WASIX
* [`wrangler`](#wrangler): Cloudflare's Service Worker powered by Node (repo: https://github.com/cloudflare/workers-sdk)


> Note: this benchmarks focuses on running a simple workload [`simple.js`](./simple.js). There's also the [`complex.js`](./complex.js) file, which does Server Side Rendering using React.


## Workerd

Using latest release binary: https://github.com/cloudflare/workerd/releases/tag/v1.20231030.0

Running the server:

```
$ ./workerd-darwin-arm64 serve ./worker.capnp
```

And then:

```bash
$ wrk -t12 -c400 -d10s http://127.0.0.1:8080
Running 10s test @ http://127.0.0.1:8080
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    14.55ms   22.15ms 116.50ms   81.86%
    Req/Sec     3.32k     1.52k    9.65k    69.58%
  396904 requests in 10.04s, 31.42MB read
  Socket errors: connect 155, read 110, write 0, timeout 0
Requests/sec:  39522.93
Transfer/sec:      3.13MB
```

## WinterJS (Native)

Running the server:

```
$ cargo run --release -- ./simple.js
```

Benchmarking:
```
$ wrk -t12 -c400 -d10s http://127.0.0.1:8080
Running 10s test @ http://127.0.0.1:8080
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.45ms  753.51us  27.43ms   90.65%
    Req/Sec    12.40k     3.09k   24.55k    82.42%
  1480619 requests in 10.01s, 169.44MB read
  Socket errors: connect 155, read 68, write 0, timeout 0
Requests/sec: 147947.00
Transfer/sec:     16.93MB
```


## Bun

> Note: Bun does run another equivalent script to `simple.js` (`bun-simple.js`), since Bun does not support WinterCG natively.

Running the server:

```
$ bun ./bun-simple.js
```

Benchmarking:

```
$ wrk -t12 -c400 -d10s http://127.0.0.1:8080
Running 10s test @ http://127.0.0.1:8080
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.05ms  401.85us   8.29ms   78.81%
    Req/Sec     9.83k     5.40k   17.65k    45.96%
  1186158 requests in 10.10s, 135.75MB read
  Socket errors: connect 155, read 57, write 0, timeout 0
Requests/sec: 117418.44
Transfer/sec:     13.44MB
```


## Node

> Note: Node does run another equivalent script to `simple.js` (`node-simple.js`), since Node does not support WinterCG natively.

Running the server:

```
$ node ./node-simple.js
```

Benchmarking:

```
$ wrk -t12 -c400 -d10s http://127.0.0.1:8080
Running 10s test @ http://127.0.0.1:8080
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.91ms   10.03ms 294.68ms   99.16%
    Req/Sec     6.25k     2.00k   11.33k    73.92%
  747990 requests in 10.02s, 122.69MB read
  Socket errors: connect 155, read 306, write 0, timeout 0
Requests/sec:  74615.22
Transfer/sec:     12.24MB
```

## WinterJS (WASIX)

Running the server:

```
$ wasmer run wasmer/winterjs --mapdir=/app:. --net -- /app/simple.js
```

Benchmarking:

```
$ wrk -t12 -c400 -d10s http://127.0.0.1:8080
Running 10s test @ http://127.0.0.1:8080
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    11.22ms    8.97ms 168.70ms   87.08%
    Req/Sec     1.05k   526.90     2.99k    73.00%
  125542 requests in 10.03s, 14.37MB read
  Socket errors: connect 155, read 271, write 0, timeout 0
Requests/sec:  12519.78
Transfer/sec:      1.43MB
```

## Wrangler

Running the server:

```bash
$ npx wrangler@3.15.0 dev ./simple.js
```

Benchmarking (please note that the port is in `8787`):

```bash
$ wrk -t12 -c400 -d10s http://127.0.0.1:8787
Running 10s test @ http://127.0.0.1:8787
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    94.97ms  118.83ms 401.80ms   83.00%
    Req/Sec   166.86    189.25   810.00     77.68%
  19461 requests in 10.08s, 1.56MB read
  Socket errors: connect 155, read 259, write 1, timeout 0
Requests/sec:   1930.96
Transfer/sec:    158.63KB
```
