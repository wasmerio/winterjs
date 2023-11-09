{
  description = "winterjs - A Javascript runtime following the WinterCG spec.";

  inputs = {
    flakeutils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flakeutils }:
    flakeutils.lib.eachDefaultSystem (system:
      let
        NAME = "winterjs";
        VERSION = "0.1.0";

        pkgs = import nixpkgs {
          inherit system;
        };

        llvm = pkgs.llvmPackages_latest;
      in
      rec {

        # packages.${NAME} = pkgs.stdenv.mkDerivation {
        #   pname = NAME;
        #   version = VERSION;

        #   buildPhase = "echo 'no-build'";
        # };

        # defaultPackage = packages.${NAME};

        # For `nix run`.
        # apps.${NAME} = flakeutils.lib.mkApp {
        #   drv = packages.${NAME};
        # };
        # defaultApp = apps.${NAME};

        devShell = pkgs.mkShell.override { stdenv = pkgs.llvmPackages_latest.stdenv; } rec {
          packages = with pkgs; [
            # llvmPackages_16.bintools-unwrapped
            pkg-config
            gnum4

            # builder
            gnumake
            cmake
            bear

            # debugger
            llvmPackages_latest.lldb
            gdb

            # fix headers not found
            clang-tools

            # LSP and compiler
            llvmPackages_latest.libstdcxxClang

            # other tools
            cppcheck
            llvmPackages_latest.libllvm
            valgrind

            # stdlib for cpp
            llvmPackages_latest.libcxx
              
            # libs
            llvmPackages_latest.libclang
            zlib
          ];

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath packages;


          shellHook = ''
            export AS="$CC -c"
          '';
        };

        # devShell = pkgs.stdenv.mkDerivation {
        #   name = NAME;
        #   src = self;
        #   buildInputs = with pkgs; [
        #   ];
        #   runtimeDependencies = with pkgs; [ ];

        #   LD_LIBRARY_PATH= pkgs.lib.makeLibraryPath (with pkgs; [
        #     zlib
        #     llvmPackages_16.libclang
        #   ]);

        #   # standalone as(1) doesn’t treat -DNDEBUG as -D NDEBUG (define), but rather -D (produce
        #   # assembler debugging messages) + -N (invalid option); see also <https://bugs.gentoo.org/732190>
        #   # /nix/store/a64w6zy8w9hcj6b4g5nz0dl6zyd24c1x-gcc-wrapper-11.3.0/bin/as: invalid option -- 'N'
        #   # make[4]: *** [/path/to/mozjs/mozjs/mozjs/config/rules.mk:664: icu_data.o] Error 1
        #   # make[3]: *** [/path/to/mozjs/mozjs/mozjs/config/recurse.mk:72: config/external/icu/data/target-objects] Error 2
        #   AS="$CC -c";
        # };
      }
    );
}
