#!/usr/bin/env bash
# One benchmark run on the booted device: the device prep of 10tap's CI
# (e2e-android job, nightly iOS job), then the timed suite for $ARM (maestro
# or e2e) on $PLATFORM (android or ios).
# Writes out/result.env, out/steps.txt, out/stdout.log and the tool's JUnit.
set -uo pipefail

APP=dev.tenplay.tentapexample
OUT="$PWD/out"
mkdir -p "$OUT"
now() { python3 -c 'import time; print(time.time())'; }
since() { awk -v a="$1" -v b="$(now)" 'BEGIN { printf "%.1f", b - a }'; }

if [ "$PLATFORM" = android ]; then
  # Detach the emulator's hardware keyboard, hide error dialogs, install, wait
  # out the Play services restart, warm launch.
  t=$(now)
  .github/scripts/android-detach-hard-keyboard.sh
  adb shell settings put global hide_error_dialogs 1
  echo "prep_s=$(since "$t")" >> "$OUT/steps.txt"

  t=$(now)
  adb install -r app/app-release.apk
  echo "install_s=$(since "$t")" >> "$OUT/steps.txt"

  sleep 120
  t=$(now)
  adb shell am start -W -n "$APP/.MainActivity"
  sleep 15
  adb shell am force-stop "$APP"
  echo "warm_launch_s=$(since "$t")" >> "$OUT/steps.txt"
  device="emulator api34 x86_64 pixel_5"
else
  # The simulator was booted with the app installed; warm launch it once.
  udid=$(xcrun simctl list devices booted --json | python3 -c '
import json, sys
for devs in json.load(sys.stdin)["devices"].values():
    for d in devs:
        print(d["udid"]); sys.exit()')
  export E2E_IOS_DEVICE="$udid"
  t=$(now)
  xcrun simctl launch "$udid" "$APP"
  sleep 15
  xcrun simctl terminate "$udid" "$APP" || true
  echo "warm_launch_s=$(since "$t")" >> "$OUT/steps.txt"
  device=$(xcrun simctl list devices booted | grep -m1 Booted | sed -E 's/ \(.*//; s/^ +//')
  runtime=$(xcrun simctl list devices booted --json | python3 -c '
import json, sys
for rt, devs in json.load(sys.stdin)["devices"].items():
    if devs: print(rt.rsplit(".", 1)[-1]); break')
  device="$device $runtime; $(xcodebuild -version | head -n 1)"
fi

TIME=()
if [ -x /usr/bin/time ]; then
  if [ "$(uname)" = Darwin ]; then TIME=(/usr/bin/time -l -o "$OUT/time.txt"); else TIME=(/usr/bin/time -v -o "$OUT/time.txt"); fi
fi

# The timed suite: the tool's own command, driver/engine start included
# (Maestro's driver install, agent-device's runner build and install).
t=$(now)
started_at=$(date -u +%FT%TZ)
case "$ARM" in
  maestro)
    "${TIME[@]}" maestro test --format junit --output "$OUT/junit.xml" \
      --test-output-dir "$OUT/maestro-output" --debug-output "$OUT/maestro-debug" \
      example/.maestro > "$OUT/stdout.log" 2>&1
    code=$?
    versions="maestro=$(maestro --version 2>/dev/null | tail -n 1)"
    ;;
  e2e)
    # e2e only writes its output inside the project root (example/).
    (cd example && "${TIME[@]}" yarn test:e2e --target "$PLATFORM" --retries 0 \
      --reporter list,junit --output .bench-e2e) > "$OUT/stdout.log" 2>&1
    code=$?
    cp -R example/.bench-e2e "$OUT/e2e" 2>/dev/null || true
    ver() { (cd example && node -p "require('$1/package.json').version" 2>/dev/null); }
    versions="e2e=$(ver e2e);@e2e-dev/mobile=$(ver @e2e-dev/mobile);agent-device=$(ver agent-device)"
    ;;
  *)
    echo "unknown arm: $ARM" >&2
    exit 2
    ;;
esac
suite_s=$(since "$t")

{
  echo "platform=$PLATFORM"
  echo "arm=$ARM"
  echo "run=$RUN"
  echo "started_at=$started_at"
  echo "suite_s=$suite_s"
  echo "exit=$code"
  echo "versions=$versions"
  echo "device=$device"
  echo "runner=${ImageOS:-}/${ImageVersion:-}"
  echo "app_sha256=$(cut -d' ' -f1 app/*.sha256)"
  echo "commit=${GITHUB_SHA:-}"
} > "$OUT/result.env"
cat "$OUT/steps.txt" "$OUT/result.env"
tail -n 60 "$OUT/stdout.log"
exit "$code"
