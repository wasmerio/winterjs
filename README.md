This repository contains Rust bindings for [SpiderMonkey][sm] for use with
[Servo][s].

[sm]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey
[s]: https://servo.org/

The bindings are to the raw SpiderMonkey API, higher-level bindings
are in the [rust-mozjs repository][r-m].

[r-m]: https://github.com/servo/rust-mozjs/

Building
========

Under Linux:

Install Clang (at least version 3.9) and autoconf v 2.13, for example in a Debian-based Linux:
```
sudo apt-get install clang-6.0 autoconf2.13

```

If you have more than one version of Clang installed, you can set the `LIBCLANG_PATH`
environment variable, for example:
```
export LIBCLANG_PATH=/usr/lib/clang/4.0/lib
```

Under Windows:

1. Follow the directions at
   https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Windows_Prerequisites

2. Open up a shell configured to use Visual Studio. This could be the
   one included with Visual Studio (e.g. Visual Studio 2017 / X64 Native
   Tools Command Prompt for VS 2017) or a shell in which you have run
```
"c:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
```

3. Set the `MOZTOOLS_PATH` environment variable to point to the tools from the Mozilla Build Package:
```
set MOZTOOLS_PATH=C:\mozilla-build\msys\bin;C:\mozilla-build\bin
```

4. Download and install Clang for Windows (64 bit) from https://releases.llvm.org/download.html
   and set the `LIBCLANG_PATH` environment variable to its `lib` directory:
```
set LIBCLANG_PATH=C:\Program Files\LLVM\lib
```

5. Set environment variables so the build script can find Python 2.7 and Autoconf 2.13:
```
set AUTOCONF=C:\mozilla-build\msys\local\bin\autoconf-2.13
set NATIVE_WIN32_PYTHON=C:\mozilla-build\python\python2.7.exe
```

You can now build and test the crate using cargo:
```
cargo build
cargo test
cargo build --features debugmozjs
cargo test --features debugmozjs
```

Upgrading
=========

In order to upgrade to a new version of SpiderMonkey:

1. Find the mozilla-release commit for the desired version of SpiderMonkey, at
   https://treeherder.mozilla.org/#/jobs?repo=mozilla-release&filter-searchStr=spidermonkey%20pkg.
   You are looking for an SM(pkg) tagged with FIREFOX_RELEASE.
   Take a note of the commit number to the left (a hex number such as ac4fbb7aaca0).

2. Click on the SM(pkg) link, which will open a panel with details of the
   commit, including an artefact uploaded link, with a name of the form
   mozjs-*version*.tar.bz2. Download it and save it locally.

3. Look at the patches in `etc/patches/*.patch`, and remove any that no longer apply
   (with a bit of luck this will be all of them).

4. Run `python3 ./etc/update.py path/to/tarball`.

5. Update `etc/COMMIT` with the commit number.

6. Build and test the bindings as above, then submit a PR!

[bindgen]: https://github.com/servo/rust-bindgen
