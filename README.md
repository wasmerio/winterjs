This repository contains the sources of [SpiderMonkey][sm] for use with
[Servo][s].

[sm]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey
[s]: https://servo.org/

The bindings are in the [rust-mozjs repository][r-m].

[r-m]: https://github.com/servo/rust-mozjs/

Upgrading
=========

In order to upgrade to a new version of SpiderMonkey:

1. Download the tarball corresponding to the desired mozilla-central commit
   from [treeherder's SM-tc(pkg) job][tc].
2. Update `etc/COMMIT`.
3. Run `python3 ./etc/update.py path/to/tarball`.
4. Clone the [`servo/rust-mozjs`][r-m] repositoy.
5. For each supported platform, run `rust-mozjs/etc/bindings.sh`, with the
   `LIBCLANG_PATH` and `LD_LIBRARY_PATH` environment variables set. Move the
   `out.rs` file it generates to the correct `rust-mozjs/src/jsapi_*.rs` path.

[tc]: https://treeherder.mozilla.org/#/jobs?repo=mozilla-central&filter-searchStr=Linux%20x64%20opt%20Spider%20Monkey,%20submitted%20by%20taskcluster%20%5BTC%5D%20Spidermonkey%20Package%20SM-tc(pkg)
