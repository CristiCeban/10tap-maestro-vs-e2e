# Benchmark: Maestro vs e2e (10tap-editor example, Android and iOS)

This is a fork of [10play/10tap-editor](https://github.com/10play/10tap-editor) at
`60d2c5f8`. It adds the `e2e` port of `example/.maestro` (`example/tests`, see
`example/MIGRATION.md`) and two workflows. The upstream workflows were removed.

1. **Build apps** (`build-apk.yml`) builds the release apps once and publishes
   them as assets of the `bench-apk` release:
   - Android: `app-release.apk` (x86_64, new architecture), as 10tap's
     `e2e-android` job builds it.
   - iOS: `TenTapExample.app.zip`, a Release simulator build on `macos-15`
     with the latest stable Xcode, as 10tap's nightly iOS job builds it.
2. **Bench** (`bench.yml`) runs each arm N times on GitHub-hosted runners, one
   fresh runner per run.
   - The arms are interleaved, and every run uses the same prebuilt app
     (SHA-256 checked). Retries are off.
   - Android runs on `ubuntu-latest` with an API 34 emulator (x86_64,
     google_apis, pixel_5, 4 cores, 4 GB). Device prep is the same as 10tap
     CI: detach the hardware keyboard, wait out the Play services restart,
     then a warm launch.
   - iOS runs on `macos-15` with the latest stable Xcode, on the first iPhone
     of the newest runtime (10tap's `boot-ios-simulator.sh`), after a warm
     launch.

Arms:
- `maestro`: `maestro test example/.maestro` (Maestro 2.11.0 by default).
- `e2e`: `yarn test:e2e --target <platform> --retries 0` in `example/`.

Each run is a cold start of the tool on a fresh runner: `suite_s` includes the
Maestro driver install, and the agent-device runner build and install on iOS.

The summarize job puts a table per platform in the run summary and uploads
`bench.csv`. The columns are:
- `suite_s`: wall time of the tool's command.
- `shared_test_sum_s`: the per-test JUnit times of the tests both arms run.
  Maestro also runs the other platform's flows, as no-op launches.
- `job_s`: the whole job, including setup and device boot.
