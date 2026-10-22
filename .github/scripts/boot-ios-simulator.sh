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
# Prefer the pinned name, then any available iPhone of that runtime: the name is
# what the coordinates were tuned for, the runtime is what must not drift.
for pick in (lambda d: d["name"] == want, lambda d: d["name"].startswith("iPhone")):
    hit = next((d for d in pool if pick(d) and d.get("isAvailable", True)), None)
    if hit:
        print(hit["udid"])
        sys.exit(0)

sys.stderr.write("no iPhone device available on runtime %s; devices:\n  %s\n"
                 % (runtime, "\n  ".join(d["name"] for d in pool)))
sys.exit(4)
')

if [ -z "$udid" ]; then
  echo "boot-ios-simulator: could not resolve a device for $runtime" >&2
  exit 5
fi

# The pinned name is not on the runner image: create it on the SAME runtime
# rather than quietly accepting a different iPhone.
if ! xcrun simctl list devices --json | UDID="$udid" python3 -c '
import json, os, sys
sys.exit(0 if any(d["udid"] == os.environ["UDID"]
                   for pool in json.load(sys.stdin)["devices"].values()
                   for d in pool) else 1)
'; then
  devtype=$(xcrun simctl list devicetypes -j | WANT="$want" python3 -c '
import json, os, sys
want = os.environ["WANT"]
hit = next((t for t in json.load(sys.stdin)["devicetypes"] if t["name"] == want), None)
if not hit:
    sys.stderr.write("devicetype %r not known to simctl\n" % want)
    sys.exit(6)
print(hit["identifier"])')
  echo "creating '$want' on $runtime"
  udid=$(xcrun simctl create "$want" "$devtype" "$runtime")
fi

# One booted device is a harness assumption: run-arm.sh reads the UDID back out
# of `simctl list devices booted`, so a second booted simulator would hand the
# suite someone else's device.
xcrun simctl shutdown all >/dev/null 2>&1 || true

echo "Booting simulator $udid on $runtime"
xcrun simctl boot "$udid"
xcrun simctl bootstatus "$udid" -b
xcrun simctl install "$udid" "$app"
