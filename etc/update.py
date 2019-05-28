# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import shutil
import subprocess
import tempfile

TARGET = "mozjs"

def extract_tarball(tarball):
    print("Extracting tarball.")

    if not os.path.exists(tarball):
        raise Exception("Tarball not found at %s" % tarball)

    if os.path.exists(TARGET):
        shutil.rmtree(TARGET)

    with tempfile.TemporaryDirectory() as directory:
        subprocess.check_call(["tar", "-xjf", tarball, "-C", directory])

        contents = os.listdir(directory)
        if len(contents) != 1:
            raise Exception("Found more than one directory in the tarball: %s" %
                            ", ".join(contents))
        subdirectory = contents[0]

        shutil.copytree(os.path.join(directory, subdirectory), TARGET)

    subprocess.check_call(["git", "add", "--all", TARGET], stdout=subprocess.DEVNULL)
    subprocess.check_call(["git", "commit", "-m", "Update SpiderMonkey"], stdout=subprocess.DEVNULL)

def remove_cargo_tomls():
    print("Removing all Cargo.toml files.")

    problem_dirs = [
        os.path.join("mozjs", "build"),
        os.path.join("mozjs", "js"),
        os.path.join("mozjs", "python"),
        os.path.join("mozjs", "testing"),
    ]
    exclude = [
        os.path.join("mozjs", "js", "src", "frontend", "binast"),
    ]
    for dir in problem_dirs:
        for root, dirs, files in os.walk(dir):
            if root in exclude:
                continue
            for file in files:
                if file == "Cargo.toml":
                    subprocess.check_call(["git", "rm", os.path.join(root, file)])

def remove_third_party_rust():
    print("Removing all third-party vendored Rust code.")
    for root, dirs, _ in os.walk(os.path.join("mozjs", "third_party", "rust")):
        for dir in dirs:
            subprocess.check_call(["git", "rm", "-rf", os.path.join(root, dir)])

def apply_patches():
    print("Applying patches.")

    patch_dir = os.path.abspath(os.path.join("etc", "patches"))
    patches = sorted(
        os.path.join(patch_dir, p)
        for p in os.listdir(patch_dir)
        if p.endswith(".patch")
    )

    for p in patches:
        print("  Applying patch: %s." % p)
        subprocess.check_call(["git", "apply", p], stdout=subprocess.DEVNULL)

def generate_configure():
    print("Generating configure.")

    cwd = os.path.join(TARGET, "js", "src")

    autoconf = "autoconf2.13"
    try:
        subprocess.check_call([autoconf, "--version"])
    except FileNotFoundError:
        autoconf = "autoconf213"

    subprocess.check_call([autoconf], cwd=cwd)
    subprocess.check_call(["git", "add", "-f", os.path.join(cwd, "configure")], stdout=subprocess.DEVNULL)

    with open(os.path.join(cwd, "old-configure"), "w") as old_configure:
        subprocess.check_call([autoconf, "old-configure.in"], cwd=cwd, stdout=old_configure)
        subprocess.check_call(["git", "add", "-f", os.path.join(cwd, "old-configure")], stdout=subprocess.DEVNULL)

    subprocess.check_call(["git", "commit", "-m", "Generate configure."], stdout=subprocess.DEVNULL)

def main(args):
    extract = None
    patch = True
    configure = True
    for arg in args:
        if arg == "--no-patch":
            patch = False
        elif arg == "--no-configure":
            configure = False
        else:
            extract = arg
    if extract:
        extract_tarball(os.path.abspath(extract))
    if patch:
        remove_cargo_tomls()
        remove_third_party_rust()
        apply_patches()
    if configure:
        generate_configure()

if __name__ == "__main__":
    import sys
    main(sys.argv[1:])
