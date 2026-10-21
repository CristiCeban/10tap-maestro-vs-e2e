#!/usr/bin/env bash
# One benchmark run inside the booted emulator: the same device prep as 10tap's
# e2e-android job, then the timed suite for $ARM (maestro or e2e).
# Writes out/result.env, out/steps.txt, out/stdout.log and the tool's JUnit.
set -uo pipefail

APP=dev.tenplay.tentapexample
OUT="$PWD/out"
mkdir -p "$OUT"
now() { date +%s.%N; }
since() { awk -v a="$1" -v b="$(now)" 'BEGIN { printf "%.1f", b - a }'; }

# Prep (not timed as suite): detach the emulator's hardware keyboard, hide
# error dialogs, install, wait out the Play services restart, warm launch.
t=$(now)
.github/scripts/android-detach-hard-keyboard.sh
adb shell settings put global hide_error_dialogs 1
echo "prep_s=$(since "$t")" >> "$OUT/steps.txt"

t=$(now)
adb install -r apk/app-release.apk
echo "install_s=$(since "$t")" >> "$OUT/steps.txt"

sleep 120
t=$(now)
adb shell am start -W -n "$APP/.MainActivity"
sleep 15
adb shell am force-stop "$APP"
echo "warm_launch_s=$(since "$t")" >> "$OUT/steps.txt"

TIME=()
if [ -x /usr/bin/time ]; then TIME=(/usr/bin/time -v -o "$OUT/time.txt"); fi

# The timed suite: the tool's own command, driver/engine start included.
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
    (cd example && "${TIME[@]}" yarn test:e2e --target android --retries 0 \
      --reporter list,junit --output "$OUT/e2e") > "$OUT/stdout.log" 2>&1
    code=$?
    versions="e2e=$(node -p "require('./example/node_modules/e2e/package.json').version" 2>/dev/null || node -p "require('e2e/package.json').version");@e2e-dev/mobile=$(node -p "require('@e2e-dev/mobile/package.json').version" 2>/dev/null);agent-device=$(node -p "require('agent-device/package.json').version" 2>/dev/null)"
    ;;
  *)
    echo "unknown arm: $ARM" >&2
    exit 2
    ;;
esac
suite_s=$(since "$t")

{
  echo "arm=$ARM"
  echo "run=$RUN"
  echo "started_at=$started_at"
  echo "suite_s=$suite_s"
  echo "exit=$code"
  echo "versions=$versions"
  echo "runner=${ImageOS:-}/${ImageVersion:-};cpus=$(nproc);mem_gb=$(free -g | awk '/Mem:/ { print $2 }')"
  echo "apk_sha256=$(cut -d' ' -f1 apk/app-release.apk.sha256)"
  echo "commit=${GITHUB_SHA:-}"
} > "$OUT/result.env"
cat "$OUT/steps.txt" "$OUT/result.env"
tail -n 60 "$OUT/stdout.log"
exit "$code"
