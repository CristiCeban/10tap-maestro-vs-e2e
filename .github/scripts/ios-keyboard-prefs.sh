#!/usr/bin/env bash
# Makes the iOS soft keyboard behave deterministically on a booted simulator.
#
# Usage: ios-keyboard-prefs.sh [udid]      (default: the one booted device)
#
# Why: the Android bench job already runs its emulator with
# `disable-spellchecker: true` and `disable-animations: true`
# (.github/workflows/bench.yml); iOS had no equivalent, so the simulator kept
# Apple's defaults — autocorrection, predictions and autocapitalisation all ON.
# Those are not cosmetic. iOS 26 puts a "Typing Predictions" strip
# (SystemInputAssistantView) above the keyboard and rewrites what a test types:
# a flow that types `after` observed `<p>The after</p>` in the document, and the
# strip's candidates ("I" / "The" / "This", "Smoked" / "Smokes" / "Smoker") show
# up in the accessibility tree of every failing iOS 26 run in this study. Any
# per-keystroke typing channel can commit one of those.
#
# Same reasoning as the Android flags: this is device configuration, applied to
# BOTH arms, so it removes a source of cross-host flakiness without making one
# arm's typing channel easier than the other's. It weakens no assertion.
#
# The keys are read back and checked: a `defaults write` that silently failed to
# stick (cfprefsd cache, renamed key on a new OS) must not be reported as "prefs
# applied", so this script exits non-zero when a value did not land.
set -euo pipefail

udid=${1:-$(xcrun simctl list devices booted --json | python3 -c '
import json, sys
booted = [d for pool in json.load(sys.stdin)["devices"].values() for d in pool
          if d["state"] == "Booted"]
if len(booted) != 1:
    sys.stderr.write("expected exactly one booted simulator, found %d\n" % len(booted))
    sys.exit(1)
print(booted[0]["udid"])')}

domain=com.apple.keyboard.preferences
# key: value iOS stores when the feature is OFF. The names are per-feature
# dictionaries rather than one struct so the read-back below can name the one
# that failed. `KeyboardPrediction` and `KeyboardPredictionEnabled` have both
# shipped as the predictive-typing key across iOS versions; write both.
set_pref() { xcrun simctl spawn "$udid" defaults write "$domain" "$1" -bool "$2"; }

set_pref KeyboardAutocorrection false
set_pref KeyboardPrediction false
set_pref KeyboardPredictionEnabled false
set_pref KeyboardAutocapitalization false
set_pref CheckSpelling false

# The booted simulator already has these domains cached; without this the write
# can land on disk while the running processes keep the old values.
xcrun simctl spawn "$udid" killall cfprefsd >/dev/null 2>&1 || true

failed=
for key in KeyboardAutocorrection KeyboardPrediction KeyboardPredictionEnabled \
           KeyboardAutocapitalization CheckSpelling; do
  got=$(xcrun simctl spawn "$udid" defaults read "$domain" "$key" 2>/dev/null || echo missing)
  case "$got" in
    0|0.0) echo "  $key=off" ;;
    *) failed="$failed $key(got=$got)" ;;
  esac
done

if [ -n "$failed" ]; then
  # Loud, not fatal by design for the benchmark: a run on a runtime that renamed
  # these keys still produces numbers, they just carry this caveat in steps.txt.
  echo "ios-keyboard-prefs: NOT applied:$failed" | tee -a "${STEP_LOG:-/dev/stderr}"
  exit 1
fi
echo "ios-keyboard-prefs: autocorrect/predictions/autocaps off on $udid"
