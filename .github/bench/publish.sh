#!/usr/bin/env bash
# Uploads files to the `bench-apk` release, creating it on first use.
# Usage: publish.sh <file...>
set -euo pipefail

if ! gh release view bench-apk >/dev/null 2>&1; then
  # The Android and iOS builds may race to create it; one of them wins.
  gh release create bench-apk --title "Benchmark apps" --prerelease \
    --notes "Prebuilt apps for the benchmark workflow." || true
fi
gh release upload bench-apk "$@" --clobber
