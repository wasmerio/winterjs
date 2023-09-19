This repository contains Rust bindings for [SpiderMonkey][sm] for use with
[Servo][s].

[sm]: https://spidermonkey.dev/
[s]: https://servo.org/

The bindings are to the raw SpiderMonkey API, higher-level bindings
are in the [rust-mozjs directory][r-m].

[r-m]: https://github.com/servo/mozjs/tree/master/rust-mozjs

# Building

## Linux

Install Python, Clang and `build-essential`, for example on a Debian-based Linux:

```sh
sudo apt-get install build-essential python3 python3-distutils llvm libclang-dev clang
```

If you have more than one version of Clang installed, you can set the `LIBCLANG_PATH`
environment variable, for example:

```sh
export LIBCLANG_PATH=/usr/lib/clang/4.0/lib
```

## Windows

1. Download and unzip [MozTools 4.0](https://github.com/servo/servo-build-deps/releases/download/msvc-deps/moztools-4.0.zip).

2. Download and install Clang for Windows (64 bit) from <https://releases.llvm.org/download.html>.

3. Open up a shell configured to use Visual Studio. This could be the
   one included with Visual Studio (e.g. Visual Studio 2017 / X64 Native
   Tools Command Prompt for VS 2017) or a shell in which you have run:

   ```shell
   "c:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
   ```

4. Set the following environment variables according to where you installed
   the dependencies above:

   ```shell
    set LIBCLANG_PATH=C:\Program Files\LLVM\lib
    set MOZTOOLS_PATH=C:\path\to\moztools-4.0
   ```

## Run Cargo

You can now build and test the crate using cargo:

```shell
cargo build
cargo test
cargo build --features debugmozjs
cargo test --features debugmozjs
```

# Building servo against your local mozjs

Assuming your local `servo` and `mozjs` directories are siblings, you can build `servo` against `mozjs` by adding the following to `servo/Cargo.toml`:

```toml
[patch."https://github.com/servo/mozjs"]
mozjs = { path = "../mozjs/rust-mozjs" }
mozjs_sys = { path = "../mozjs/mozjs" }
```

# Upgrading

In order to upgrade to a new version of SpiderMonkey:

1. Find the mozilla-release commit for the desired version of SpiderMonkey, at
   <https://treeherder.mozilla.org/#/jobs?repo=mozilla-release&filter-searchStr=spidermonkey%20pkg>.
   You are looking for an SM(pkg) tagged with FIREFOX_RELEASE.
   Take a note of the commit number to the left (a hex number such as ac4fbb7aaca0).

2. Click on the SM(pkg) link, which will open a panel with details of the
   commit, including an artefact uploaded link, with a name of the form
   mozjs-*version*.tar.bz2. Download it and save it locally.

3. Look at the patches in `etc/patches/*.patch`, and remove any that no longer apply
   (with a bit of luck this will be all of them).

4. Run `python3 ./etc/update.py path/to/tarball`.

5. Update `etc/COMMIT` with the commit number.

6. Run `./rust-mozjs/src/generate_wrappers.sh` to regenerate wrappers.

7. Build and test the bindings as above, then submit a PR!

# NixOS users

To get a dev environment with shell.nix:

```sh
nix-shell
```

To configure rust-analyzer in Visual Studio Code:

```json
{
    "rust-analyzer.check.overrideCommand": ["nix-shell", "--run", "cargo check --message-format=json"],
    "rust-analyzer.cargo.buildScripts.overrideCommand": ["nix-shell", "--run", "cargo check --message-format=json"],
    "rust-analyzer.rustfmt.overrideCommand": ["nix-shell", "--run", "cargo fmt"],
}
```

# Editor support

If you are working on the Rust code only, rust-analyzer should work perfectly out of the box, though NixOS users will need to configure rust-analyzer to wrap cargo invocations (see above).

But if you are working on the C++ code, editor support is only really possible in upstream SpiderMonkey (aka “mozilla-central”), but once you’ve set up your editor in your upstream checkout, you can work on your changes there, then import them here as needed for local testing.

This guide assumes that your code is checked out at:

* **~/code/mozjs** for this repo
* **~/code/mozilla-unified** for upstream SpiderMonkey
* (NixOS users only) **~/code/nixpkgs-mozilla** for [mozilla/nixpkgs-mozilla](https://github.com/mozilla/nixpkgs-mozilla)

**NixOS users:** some steps have a note in \[brackets] saying they need to be wrapped in nix-shell. Those commands should be wrapped as follows:

```
nix-shell ~/code/nixpkgs-mozilla/release.nix -A gecko.x86_64-linux.clang --run '...'
```

## C++ editor setup

Start by checking out mozilla-unified ([Building Firefox on Linux](https://firefox-source-docs.mozilla.org/setup/linux_build.html) §§ 1 and 2).

**NixOS users:** it’s ok if the bootstrap command fails with a NotImplementedError due to NixOS not being a supported distro.

Now create your MOZCONFIG file ([Building and testing SpiderMonkey](https://firefox-source-docs.mozilla.org/js/build.html)). I recommend (and this guide assumes) that the file is named `debug.mozconfig`, because simple names like `debug` can cause MozconfigFindException problems. The file should look like this:

```
# Build only the JS shell
ac_add_options --enable-project=js

# Enable the debugging tools: Assertions, debug only code etc.
ac_add_options --enable-debug

# Enable optimizations as well so that the test suite runs much faster. If
# you are having trouble using a debugger, you should disable optimization.
ac_add_options --enable-optimize

# Use a dedicated objdir for SpiderMonkey debug builds to avoid
# conflicting with Firefox build with default configuration.
mk_add_options MOZ_OBJDIR=@TOPSRCDIR@/obj-debug-@CONFIG_GUESS@
```

If you are a NixOS user, clone [mozilla/nixpkgs-mozilla](https://github.com/mozilla/nixpkgs-mozilla) next to your `mozilla-unified` checkout, and add the following line to the start of your `debug.mozconfig`:

```
. ./.mozconfig.nix-shell
```

You will need to generate your Visual Studio Code config and compilation database against central at least once, before you can do so against the commit we forked from (`mozjs/etc/COMMIT`).

```
~/code/mozilla-unified $ MOZCONFIG=debug.mozconfig ./mach ide vscode
```

> [NixOS users: wrap the command above in nix-shell]

Otherwise you might get an error with lots of exclamation marks:

```
~/code/mozilla-unified $ MOZCONFIG=debug.mozconfig ./mach ide vscode
[snip]
 0:05.80 Unable to locate clangd in /home/delan/code/mozilla-unified/.mozbuild/clang-tools/clang-tidy/bin.
[snip]
 0:07.78 ERROR!!!!!! Could not find artifacts for a toolchain build named `linux64-clang-tidy`. Local commits, dirty/stale files, and other changes in your checkout may cause this error. Make sure you are on a fresh, current checkout of mozilla-central. Beware that commands like `mach bootstrap` and `mach artifact` are unlikely to work on any versions of the code besides recent revisions of mozilla-central.
```

> [NixOS users: wrap the command above in nix-shell]

Now switch to the commit we forked from, and generate them again.

```
~/code/mozilla-unified $ hg update -r $(cat ../mozjs/mozjs/etc/COMMIT)
~/code/mozilla-unified $ MOZCONFIG=debug.mozconfig ./mach ide vscode
```

> [NixOS users: wrap the ***mach*** command above in nix-shell]

At this point, you should be able to open Visual Studio Code, install the clangd extension, and open a file like `js/src/vm/ArrayBufferObject.cpp` without seeing any problems in the margin.

If there are no problems in the margin, and you can Go To Definition, you’re done!

### Troubleshooting

If you are a NixOS user and see this in the clangd output panel:

```
[Error - 7:38:13 pm] Clang Language Server client: couldn't create connection to server.
Launching server using command /home/delan/code/mozilla-unified/.mozbuild/clang-tools/clang-tidy/bin/clangd failed. Error: spawn /home/delan/code/mozilla-unified/.mozbuild/clang-tools/clang-tidy/bin/clangd ENOENT
```

Then you need to replace the mozbuild toolchain’s clangd with one that has been patchelf’d:

```
~/code/mozilla-unified $ ln -sf ~/.nix-profile/bin/clangd .mozbuild/clang-tools/clang-tidy/bin/clangd
```

If you see this in the clangd output panel:

```
I[19:20:28.001] Indexed /home/delan/code/mozilla-unified/js/src/jit/LIR.cpp (61040 symbols, 244267 refs, 738 files)
I[19:20:28.001] Failed to compile /home/delan/code/mozilla-unified/js/src/jit/LIR.cpp, index may be incomplete
I[19:20:28.087] --> $/progress
```

Then the commands in your compilation database might be incorrect. You can try running one of the commands in a terminal to see what happens:

```
~/code/mozilla-unified $ ( f=$PWD/obj-debug-x86_64-pc-linux-gnu/clangd/compile_commands.json; set -x; cd $(< $f jq -r '.[0].directory'); $(< $f jq -r '.[0].command') )
+/run/current-system/sw/bin/zsh:252> jq -r '.[0].directory'
+/run/current-system/sw/bin/zsh:252> cd /home/delan/code/mozilla-unified/obj-debug-x86_64-pc-linux-gnu/js/src
+/run/current-system/sw/bin/zsh:252> jq -r '.[0].command'
+/run/current-system/sw/bin/zsh:252> /nix/store/dkw46jgi8i0bq64cag95v4ywz6g9bnga-gcc-wrapper-11.3.0/bin/cc '-std=gnu99' -o /dev/null -c -I/home/delan/code/mozilla-unified/obj-debug-x86_64-pc-linux-gnu/dist/system_wrappers -include /home/delan/code/mozilla-unified/config/gcc_hidden.h -U_FORTIFY_SOURCE '-D_FORTIFY_SOURCE=2' -fstack-protector-strong '-DDEBUG=1' -DWASM_SUPPORTS_HUGE_MEMORY -DJS_CACHEIR_SPEW -DJS_STRUCTURED_SPEW -DEXPORT_JS_API -DMOZ_HAS_MOZGLUE -I/home/delan/code/mozilla-unified/js/src -I/home/delan/code/mozilla-unified/obj-debug-x86_64-pc-linux-gnu/js/src -I/home/delan/code/mozilla-unified/obj-debug-x86_64-pc-linux-gnu/dist/include -I/nix/store/bsslcbcnrfcv6nl0jfha444nxjky7zxa-zlib-1.2.13-dev/include -include /home/delan/code/mozilla-unified/obj-debug-x86_64-pc-linux-gnu/js/src/js-confdefs.h -DMOZILLA_CLIENT -fPIC -fno-math-errno -pthread -pipe -gdwarf-4 -freorder-blocks -O3 -fno-omit-frame-pointer -funwind-tables -Wall -Wempty-body -Wignored-qualifiers -Wpointer-arith -Wsign-compare -Wtype-limits -Wunreachable-code -Wduplicated-cond -Wlogical-op '-Wno-error=maybe-uninitialized' '-Wno-error=deprecated-declarations' '-Wno-error=array-bounds' '-Wno-error=free-nonheap-object' -Wno-multistatement-macros '-Wno-error=class-memaccess' -Wformat '-Wformat-overflow=2' '-Werror=implicit-function-declaration' -Wno-psabi -fno-strict-aliasing '-ffp-contract=off' '-ferror-limit=0' /home/delan/code/mozilla-unified/js/src/vtune/ittnotify_static.c -Wno-varargs -Wno-sign-compare -Wno-unknown-pragmas -Wno-stringop-overflow -Wno-stringop-truncation
gcc: error: unrecognized command-line option ‘-ferror-limit=0’
```

In this case, it was because your compiler was gcc (which supports `-fmax-errors` but not `-ferror-limit`), but it should always be clang (which supports both) when working with clangd. If you are a NixOS user, make sure you use the `clang` derivation, not the `gcc` derivation, when generating your compilation database:

```
~/code/mozilla-unified $ nix-shell ~/code/nixpkgs-mozilla/release.nix -A gecko.x86_64-linux.clang --run 'MOZCONFIG=debug.mozconfig ./mach ide vscode'
                                                                                            ^^^^^
```

## Importing changes for local testing

Start by making a source tarball from your local upstream SpiderMonkey checkout. [TODO(@delan) the default xz compression is very slow here, we should add an option upstream to make it faster]

```
~/code/mozilla-unified $ AUTOMATION=1 DIST=$PWD/../mozjs/mozjs/etc js/src/make-source-package.py
```

> [NixOS users: wrap the command above in nix-shell]

Now update your vendored copy of SpiderMonkey from that tarball. This creates a commit replacing `mozjs/mozjs` with the *unpatched* contents of the tarball, leaving the changes made by reapplying our patches in your working directory diff (`git diff`).

```
~/code/mozjs $ python3 mozjs/etc/update.py mozjs/etc/mozjs-107.0.0.tar.xz
```

Then do a (mixed) reset to remove the commit and unstage its changes.

```
~/code/mozjs $ git reset @~
```

Your working directory diff (`git diff`) should now contain (and only contain) the changes you’ve made to your upstream SpiderMonkey checkout. If you see changes to `mozjs/mozjs/js/src/old-configure` [TODO(@delan) why does this happen?], you may need to undo them:

```
~/code/mozjs $ git restore -W mozjs/mozjs/js/src/old-configure
```

Otherwise you might get the build failure below:

```
~/code/mozjs $ cargo build
[snip]
  configure: error: can not find sources in /home/delan/code/mozjs/mozjs/mozjs/js/src or ..

  --- stderr
  WARNING: The value of LD is not used by this build system.
  ERROR: old-configure failed
  make: *** [/home/delan/code/mozjs/mozjs/makefile.cargo:195: maybe-configure] Error 1
  thread 'main' panicked at 'assertion failed: result.success()', mozjs/build.rs:178:5
  note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

Now you can build the Rust crates against your modified version of SpiderMonkey!

```
~/code/mozjs $ cargo build
```
