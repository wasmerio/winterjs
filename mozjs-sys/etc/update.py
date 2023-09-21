# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import shutil
import subprocess
import tempfile

TARGET = "mozjs-sys/mozjs"

def extract_tarball(tarball, commit):
    print("Extracting tarball.")

    if not os.path.exists(tarball):
        raise Exception("Tarball not found at %s" % tarball)

    with tempfile.TemporaryDirectory() as directory:
        subprocess.check_call(["tar", "-xf", tarball, "-C", directory])

        contents = os.listdir(directory)
        if len(contents) != 1:
            raise Exception("Found more than one directory in the tarball: %s" %
                            ", ".join(contents))
        subdirectory = contents[0]

        subprocess.check_call([
            "rsync",
            "--delete-excluded",
            "--filter=merge mozjs-sys/etc/filters.txt",
            "--prune-empty-dirs",
            "--quiet",
            "--recursive",
            os.path.join(directory, subdirectory, ""),
            os.path.join(TARGET, ""),
        ])

    if commit:
        subprocess.check_call(["git", "add", "--all", TARGET], stdout=subprocess.DEVNULL)
        subprocess.check_call(["git", "commit", "-m", "Update SpiderMonkey"], stdout=subprocess.DEVNULL)

def apply_patches():
    print("Applying patches.")
    patch_dir = os.path.abspath(os.path.join("mozjs-sys", "etc", "patches"))
    patches = sorted(
        os.path.join(patch_dir, p)
        for p in os.listdir(patch_dir)
        if p.endswith(".patch")
    )
    for p in patches:
        print("  Applying patch: %s." % p)
        subprocess.check_call(["git", "apply", "--reject", "--directory=" + TARGET, p], stdout=subprocess.DEVNULL)

def main(args):
    extract = None
    patch = True
    commit = True
    for arg in args:
        if arg == "--no-patch":
            patch = False
        elif arg == "--no-commit":
            commit = False
        else:
            extract = arg
    if extract:
        extract_tarball(os.path.abspath(extract), commit)
    if patch:
        apply_patches()

if __name__ == "__main__":
    import sys
    main(sys.argv[1:])
