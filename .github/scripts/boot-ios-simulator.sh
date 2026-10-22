#!/usr/bin/env bash
# Boots a simulator on ONE pinned iOS runtime and installs an app on it.
#
# Usage: boot-ios-simulator.sh <path to .app>
#
#   IOS_RUNTIME  runtime identifier to boot, default
#                com.apple.CoreSimulator.SimRuntime.iOS-26-2
#   IOS_DEVICE   device name within that runtime, default 'iPhone 17 Pro'
#
# The runtime is pinned, not "the newest one available". The study's iOS numbers
# are only comparable across hosts and across runner-image refreshes if every run
# drives the same iOS; the previous version of this script sorted the installed
# runtimes newest-first and took the first iPhone, so a runner image that added
# iOS 27 would have moved the arm onto a different iOS without a word, and the
# published local rows happen to be exactly that drift (iOS 27 green, iOS 26 red).
#
# So: absent runtime => fail, listing what the runner does have. It does NOT fall
# back to a nearby runtime: silently changing the OS under a benchmark is the
# failure this script exists to prevent. A missing *device* on a runtime that IS
# installed is created instead — same OS, so no variable moves.
set -euo pipefail

app=${1:?usage: boot-ios-simulator.sh <path to .app>}
runtime=${IOS_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-26-2}
want=${IOS_DEVICE:-iPhone 17 Pro}

# simctl prints `-- <name> (Booted)` headings; keep the udid and the runtime it
# belongs to together so a device can only ever be chosen from the pinned one.
udid=$(xcrun simctl list devices available --json | RUNTIME="$runtime" WANT="$want" python3 -c '
import json, os, sys

runtime, want = os.environ["RUNTIME"], os.environ["WANT"]
devices = json.load(sys.stdin)["devices"]

if runtime not in devices:
    sys.stderr.write(
        "no simulator runtime %s on this runner; installed:\n  %s\n"
        % (runtime, "\n  ".join(sorted(devices)) or "(none)")
    )
    sys.exit(3)

pool = devices[runtime]
# Strict on the device name as well as the runtime. The failure this whole file
# is about is coordinate-sensitive (a tap landing on Heading 4 in the toolbar),
# and a different iPhone model is a different viewport, so quietly substituting
# "some iPhone on the right OS" would move a variable while looking like it held
# one. Anything else is handled by creating the pinned device below.
hit = next((d for d in pool if d["name"] == want and d.get("isAvailable", True)), None)
if hit:
    print(hit["udid"])
    sys.exit(0)
print("")
')

# Empty means "runtime is installed, that device does not exist yet": create it on
# the pinned runtime. Creation failure is fatal — see the comment above.
if [ -z "$udid" ]; then
  devtype=$(xcrun simctl list devicetypes -j | WANT="$want" python3 -c '
import json, os, sys
want = os.environ["WANT"]
hit = next((t for t in json.load(sys.stdin)["devicetypes"] if t["name"] == want), None)
if not hit:
    sys.stderr.write("no device %r on runtime %s and no such devicetype to create it\n"
                     % (want, os.environ["RUNTIME"]))
    sys.exit(6)
print(hit["identifier"])') || exit 6
  echo "creating '$want' on $runtime"
  udid=$(xcrun simctl create "$want" "$devtype" "$runtime") || exit 6
fi

# One booted device is a harness assumption: run-arm.sh reads the UDID back out
# of `simctl list devices booted`, so a second booted simulator would hand the
# suite someone else's device.
xcrun simctl shutdown all >/dev/null 2>&1 || true

echo "Booting simulator $udid on $runtime"
xcrun simctl boot "$udid"
xcrun simctl bootstatus "$udid" -b
xcrun simctl install "$udid" "$app"
