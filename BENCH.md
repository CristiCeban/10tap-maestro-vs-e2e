# Android benchmark: Maestro vs e2e (10tap-editor example)

This is a fork of [10play/10tap-editor](https://github.com/10play/10tap-editor) at
`60d2c5f8`. It adds the `e2e` port of `example/.maestro` (`example/tests`, see
`example/MIGRATION.md`) and two workflows. The upstream workflows were removed.

1. **Build APK** (`build-apk.yml`) builds the release APK once (x86_64, new
   architecture, as 10tap's `e2e-android` job) and publishes it as the
   `bench-apk` release.
2. **Bench Android** (`bench-android.yml`) runs each arm N times on GitHub-hosted
   `ubuntu-latest` runners, one fresh runner per run.
   - The arms are interleaved, and every run uses the same prebuilt APK
     (SHA-256 checked) and the same emulator (API 34, x86_64, google_apis,
     pixel_5, 4 cores, 4 GB).
   - Device prep is the same as 10tap CI: detach the hardware keyboard, wait
     out the Play services restart, then a warm launch.
   - Retries are off.

Arms:
- `maestro`: `maestro test example/.maestro` (Maestro 2.11.0 by default).
- `e2e`: `yarn test:e2e --target android --retries 0` in `example/`.

The summarize job puts a table in the run summary and uploads `bench.csv`. The
columns are:
- `suite_s`: wall time of the tool's command, driver start included.
- `shared_test_sum_s`: the per-test JUnit times of the tests both arms run.
  Maestro also runs its iOS-only flow on Android, as a no-op launch.
- `job_s`: the whole job, including setup and emulator boot.
