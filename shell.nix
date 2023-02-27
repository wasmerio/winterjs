{ pkgs ? import <nixpkgs> {} }:
pkgs.clangStdenv.mkDerivation {
  name = "mozjs-shell";

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
      pkgs.zlib
      pkgs.libclang
    ]}

    # standalone as(1) doesn’t treat -DNDEBUG as -D NDEBUG (define), but rather -D (produce
    # assembler debugging messages) + -N (invalid option); see also <https://bugs.gentoo.org/732190>
    # /nix/store/a64w6zy8w9hcj6b4g5nz0dl6zyd24c1x-gcc-wrapper-11.3.0/bin/as: invalid option -- 'N'
    # make[4]: *** [/path/to/mozjs/mozjs/mozjs/config/rules.mk:664: icu_data.o] Error 1
    # make[3]: *** [/path/to/mozjs/mozjs/mozjs/config/recurse.mk:72: config/external/icu/data/target-objects] Error 2
    export AS="$CC -c"
  '';

  buildInputs = [
      pkgs.rustup
      pkgs.python3
      pkgs.perl

      pkgs.llvmPackages.bintools-unwrapped
      pkgs.pkg-config
      pkgs.gnum4

      pkgs.zlib
      pkgs.libclang
  ];
}
