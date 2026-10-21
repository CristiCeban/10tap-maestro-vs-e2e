# Migration to e2e

Source: Maestro, `example/.maestro` config `smoke/*`, `repro/*`, `keyboard/*` (guide: https://e2e.tester.army/docs/migrate/maestro.md, engine: https://e2e.tester.army/docs/mobile.md)
e2e: `example/e2e.config.ts`, tests `example/tests/**/*.e2e.ts`
Start dependencies: none (no backend). Build and install the Release app first: `yarn example build:ios:release` / `yarn example build:android:release`, then `xcrun simctl install` / `adb install -r`.
Run old: `maestro test example/.maestro` (from the repo root; Maestro 2.11.0, the latest at the time, since CI installs the latest)
Run new: `cd example && yarn test:e2e --target ios` / `--target android` (`E2E_IOS_DEVICE`, `E2E_ANDROID_DEVICE` pick the device; on this machine also `AGENT_DEVICE_STATE_DIR=<private dir>`, see Gaps)
Harness: done, smoke `tests/smoke/editor-basics.e2e.ts` on ios and android
Defect check: off (no user to agree to a planted bug; recorded as a deviation)

Assertions are counted as `a` (explicit: assertVisible, assertNotVisible, non-optional extendedWaitUntil) + `s` (steps that fail when the target is missing: tapOn/doubleTapOn/longPressOn on text or id, scrollUntilVisible, swipe from an element) + `pt` (coordinate taps/swipes, which check nothing), with subflows expanded and platform-gated blocks counted per platform.

| Source | e2e | Status | Assertions (source → e2e) | Passing | Defect check | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| smoke/editor-basics.yaml | tests/smoke/editor-basics.e2e.ts | ported | 6a+7s → 6a+9s | ios 3/3, android 3/3 | | |
| smoke/screens-open.yaml | tests/smoke/screens-open.e2e.ts | ported | 38a+18s → 38a+18s | ios 3/3, android 3/3 | | |
| smoke/toolbar-actions-ios.yaml | tests/smoke/toolbar-actions-ios.e2e.ts | ported | ios 12a+30s+1pt → 12a+31s+1pt | ios 3/3 | | `{ platforms: ['ios'] }`; point 50%,35% via `tapAtPercent()` |
| smoke/toolbar-actions.yaml | tests/smoke/toolbar-actions.e2e.ts | ported | android 10a+11s+16pt → 10a+22s+1pt | android 3/3 | | `{ platforms: ['android'] }`; 15 coordinate taps/swipes became label taps; long press at 14%,18% via adb; types via adb (device keyboard) |
| repro/autofocus.yaml | tests/repro/autofocus.e2e.ts | ported | 3a+3s → 3a+4s | ios 3/3, android 3/3 | | Android: device keyboard for `keyboard:up`, then agent-device's IME to type |
| repro/compose-editor-tap.yaml | tests/repro/compose-editor-tap.e2e.ts | ported | 4a+4s+1pt → 5a+5s+1pt | ios 3/3, android 3/3 | | center tap via `tapAtPercent()`; Android types via adb |
| repro/content-api.yaml (all but #327) | tests/repro/content-api.e2e.ts `Repro: content and selection APIs` | ported | 6a+10s → 6a+10s | ios 3/3, android 3/3 | | |
| repro/content-api.yaml (#327 whitespace) | tests/repro/content-api.e2e.ts `... (#327 whitespace)` | stays | 1a (+setup) → skipped | | | e2e collapses whitespace in text reads, so `<p>a   b</p>` cannot be told from `<p>a b</p>`. App change that would allow it: render `editor-html` with visible whitespace |
| repro/dynamic-height.yaml | tests/repro/dynamic-height.e2e.ts | ported | 5a+6s → 5a+7s | ios 3/3, android 3/3 | | Android: capped editor exposes no text field; types via adb |
| repro/focus-keyboard.yaml | tests/repro/focus-keyboard.e2e.ts | ported | android 9a+9s → 11a+9s | android 3/3 | | `{ platforms: ['android'] }`; D-pad key and link text via adb; device keyboard |
| repro/readiness.yaml | tests/repro/readiness.e2e.ts | ported | 4a+3s → 4a+3s | ios 3/3, android 3/3 | | |
| keyboard/android-back-dismisses.yaml | tests/keyboard/android-back-dismisses.e2e.ts | ported | android 6a+6s → 6a+7s | android 3/3 (before the duplicate home wait was restored; rerun pending) | | `{ platforms: ['android'] }` |
| keyboard/color-keyboard.yaml | tests/keyboard/color-keyboard.e2e.ts | ported | 4a+6s → 4a+7s | ios 3/3, android 3/3 | | |
| keyboard/editor-tap-closes.yaml | tests/keyboard/editor-tap-closes.e2e.ts | ported | 4a+6s → 4a+7s | ios 3/3, android 3/3 | | |
| keyboard/modal-keyboard.yaml | tests/keyboard/modal-keyboard.e2e.ts | ported | 9a+8s → 9a+9s | ios 3/3, android 3/3 | | |
| keyboard/overlay-keyboard.yaml | tests/keyboard/overlay-keyboard.e2e.ts | ported | 5a+6s → 5a+7s | ios 3/3, android 3/3 | | |
| keyboard/switch-keyboards.yaml | tests/keyboard/switch-keyboards.e2e.ts | ported | 7a+7s → 7a+8s | ios 3/3, android 3/3 | | |
| keyboard/toggle-twenty-times.yaml | tests/keyboard/toggle-twenty-times.e2e.ts | ported | 5a+6s → 5a+7s | ios 3/3, android 3/3 | | loop body counted once, as in the source |

Out of scope: `caret/**` (not in `.maestro/config.yaml`; needs the caret probe servers).

## Shared helpers

| Source | e2e | Used by |
| --- | --- | --- |
| subflows/launch.yaml | tests/support/app.ts `launch()` | every test |
| subflows/open-screen.yaml | tests/support/app.ts `openScreen()` | screens-open |
| `scrollUntilVisible` + `tapOn` on a home entry | tests/support/app.ts `openEntry()` | every test |
| `tapOn: read-editor-state` + `assertVisible: editor-html` | tests/support/app.ts `expectHtml()` | most tests |
| `inputText` (types into focus) | tests/support/app.ts `typeInEditor()` | most tests |

## Shared helpers (Android)

| Need | e2e | Used by |
| --- | --- | --- |
| soft keyboard on screen (`keyboard:up`) | tests/support/android.ts `useDeviceKeyboard()` / `useTestKeyboard()` | autofocus, focus-keyboard, toolbar-actions, compose-editor-tap |
| `inputText` into focus | tests/support/android.ts `typeIntoFocus()` (adb `input text`) | toolbar-actions, compose-editor-tap, dynamic-height, focus-keyboard |
| `longPressOn: point` | tests/support/android.ts `longPressAtPercent()` | toolbar-actions |
| `pressKey: Remote Dpad Down` | tests/support/android.ts `adbShell('input', 'keyevent', ...)` | focus-keyboard |
| `tapOn: point: x%,y%` | tests/support/app.ts `tapAtPercent()` | compose-editor-tap, toolbar-actions-ios |
| the 2.5 s keyboard settle | tests/support/app.ts `waitForKeyboardRide()` | every keyboard/* test |

## Gaps

- `inputText` with no target: e2e types through a locator (`fill`, `pressSequentially`). The WebView exposes the contenteditable as one text field under the RichText testID, so `typeInEditor()` types there. Where no text field is exposed (Android's capped dynamicHeight editor, the compose editor), Android types with `adb shell input text`, and iOS through `device.locator('editable focused')`.
- Android test IME: agent-device switches emulators to its headless helper IME (`--test-ime`, default on) and e2e's `mobile()` has no option to turn it off. No keyboard window ever shows, so the app never reports `keyboard:up` and keyboard-riding toolbars never appear. Typing (`pressSequentially`, `fill`) only works with that IME, and switching IMEs blurs a focused TextInput. Worked around with adb (see above). Feedback to send: "mobile(): option to keep the device keyboard on Android emulators (agent-device --no-test-ime)".
- Whitespace: every text read collapses whitespace, so content-api's #327 check stays in Maestro.
- Percentage points and long press at a point: no viewport-size read and no `longPressAt`; see the helpers.
- `pressKey: Remote Dpad Down`: "Not yet" in the guide, with no workaround; sent with adb rather than leaving the flow in Maestro (a deviation from the skill, noted).
- A global agent-device daemon of another version on this machine owns `~/.agent-device`; e2e runs need `AGENT_DEVICE_STATE_DIR` set to a private directory.

## Next

Rerun keyboard/android-back-dismisses 3× on Android (the duplicate home wait was restored after its 3/3). Ask which `ported` Maestro flows may be retired (none deleted). Propose adding the e2e job beside `e2e-android` in ci.yml (not done: it edits the old runner's workflow).
