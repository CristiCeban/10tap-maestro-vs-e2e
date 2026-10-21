# Migration to e2e

Source: Maestro, `example-expo/.maestro` config `smoke/*`, `keyboard/*`, `repro/*` (guide: https://e2e.tester.army/docs/migrate/maestro.md, engine: https://e2e.tester.army/docs/mobile.md)
e2e: `example-expo/e2e.config.ts`, tests `example-expo/tests/**/*.e2e.ts`
Start dependencies: Metro, `npx expo start --dev-client --port <port>` (8081 by default; 8095 on this machine) (the config's `app.command`, reused when already running); Android also `adb reverse tcp:8081 tcp:8081`. Build: `yarn example:expo prebuild`, then the development build per platform (CI's `expo-prebuild` job commands), installed on the device.
Run old: `maestro test example-expo/.maestro` (Maestro 2.11.0; not run in 10tap CI)
Run new: `cd example-expo && METRO_URL=http://localhost:8095 yarn test:e2e --target ios` / `--target android` (`E2E_IOS_DEVICE`, `E2E_ANDROID_DEVICE`; this machine also needs `AGENT_DEVICE_STATE_DIR`)
Device note: the Expo SDK 57 dev build crashes at launch on the iOS 27.0 runtime (no UIScene lifecycle: `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`), in both runners; iOS runs use an iOS 26.2 simulator.
Harness: done, smoke `tests/smoke/basic.e2e.ts` on ios (iOS 26.2 simulator) and android
Defect check: off (no user to agree to a planted bug)

Counts as in `example/MIGRATION.md`; each flow includes `common/open-example.yaml` (3a+4s, of which 2a+3s are conditional dialog handling).

| Source | e2e | Status | Assertions (source → e2e) | Passing | Defect check | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| smoke/basic.yaml | tests/smoke/basic.e2e.ts | ported | 5a+4s → 5a+5s | ios 3/3, android 3/3 | | |
| smoke/toolbar.yaml | tests/smoke/toolbar.e2e.ts | ported | 11a+17s+4pt → 11a+19s+4pt | ios 3/3, android 3/3 | | 4 coordinate swipes are toolbar-row swipes from button boxes |
| smoke/two-editors.yaml | tests/smoke/two-editors.e2e.ts | ported | 8a+6s → 8a+8s | ios 3/3, android 3/3 | | e2e trims text, so the trailing typed space in `.* two .*` goes unchecked (`/ two$/`) |
| keyboard/android-back-dismisses.yaml | tests/keyboard/android-back-dismisses.e2e.ts | ported | android 7a+5s → 7a+5s | android 3/3 | | `{ platforms: ['android'] }` |
| keyboard/color-keyboard.yaml | tests/keyboard/color-keyboard.e2e.ts | ported | 7a+6s → 7a+7s | ios 3/3, android 3/3 | | |
| keyboard/toggle-twenty-times.yaml | tests/keyboard/toggle-twenty-times.e2e.ts | ported | 7a+6s → 7a+7s | ios 3/3, android 3/3 | | |
| repro/dynamic-height.yaml | tests/repro/dynamic-height.e2e.ts | ported | 5a+4s → 5a+4s | ios 3/3, android 3/3 | | Android reads both editors from `agent-device snapshot --raw` (`rawSnapshotTexts()`), same two assertions and timeouts; iOS unchanged. The default tree stops at the WebView's `RichTextEditor` node |

Out of scope: `caret/**` (not in `.maestro/config.yaml`).

## Shared helpers

| Source | e2e | Used by |
| --- | --- | --- |
| common/open-example.yaml | tests/support/app.ts `openExample()` | every test |
| `inputText` | tests/support/app.ts `typeInEditor()` | basic, toolbar, two-editors, color-keyboard, toggle-twenty-times |
| `swipe: start 90%,62% end 10%,62%` | tests/support/app.ts `swipeToolbar()` | toolbar |

## Gaps

- Android test IME (as in `example/MIGRATION.md`): with agent-device's helper IME the default Toolbar never shows, and screens with two WebViews expose no editor content. `openExample()` selects the device keyboard after the launch (`app.open()` re-selects the helper IME); Android types with `adb shell input text`.
- `app.open()` returns before the relaunched dev client is idle (Maestro's `launchApp` waits); a dev-client link sent then reloads the bundle mid-init (red box). `openExample()` waits for a known screen first.
- Two WebViews on one Android screen (dynamic-height): the default snapshot ends at each WebView's `RichTextEditor` node, because a hidden zero-height `View` sits between it and the editable text; `snapshot --raw` keeps the text. `uiautomator dump` also sees it but can't run while agent-device's snapshot helper holds the accessibility connection (killed, exit 137, 0/6). The Android test calls the raw snapshot on the e2e session (`e2e-android-0`, one worker) through the pinned CLI. It's a read-channel change only, with no change to the flow.

- `openLink` + "Open in ...?" prompt: ported as `device.openLink` plus a tap on Open when the prompt shows.
- Percentage points (`swipe: start: 90%,62%`): e2e takes viewport points only and has no viewport-size read; derived from a toolbar button's and the editor's boxes.

## Next

Report the default-snapshot gap to e2e (draft in `phase3/STATUS-3-10tap.md`). Ask which `ported` flows may be retired (none deleted).
