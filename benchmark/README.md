# Benchmarking

This benchmarks are done in a MacBook Pro M1 Max laptop with 64 GB of RAM, on Oct 31st, 2023.

This benchmark compares:
* [`workerd`](#workerd): Cloudflare's Service Worker server powered by V8 (repo: https://github.com/cloudflare/workerd)
* [WinterJS Native](#winterjs-native): WinterJS running natively
* [WinterJS WASIX](#winterjs-wasix): WinterJS running in Wasmer via WASIX
* [`wrangler`](#wrangler): Cloudflare's Service Worker powered by Node (repo: https://github.com/cloudflare/workers-sdk)


> Note: this benchmarks focuses on running a simple workload [`simple.js`](./simple.js).


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
    Latency     5.63ms    5.82ms  64.49ms   84.22%
    Req/Sec     3.11k     1.51k   33.08k    77.43%
  363095 requests in 10.10s, 29.09MB read
  Socket errors: connect 155, read 108, write 0, timeout 147
Requests/sec:  35934.03
Transfer/sec:      2.88MB
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
    Latency     6.51ms   15.73ms 203.56ms   90.09%
    Req/Sec     8.55k     3.29k   19.72k    66.25%
  1020674 requests in 10.01s, 78.84MB read
  Socket errors: connect 155, read 121, write 0, timeout 0
Requests/sec: 101936.53
Transfer/sec:      7.87MB
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
    Latency    13.62ms    2.09ms  28.38ms   70.34%
    Req/Sec     1.48k   452.38     2.46k    65.50%
  176766 requests in 10.02s, 13.66MB read
  Socket errors: connect 155, read 106, write 0, timeout 0
Requests/sec:  17642.88
Transfer/sec:      1.36MB
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
