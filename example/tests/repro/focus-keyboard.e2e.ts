// Ported from .maestro/repro/focus-keyboard.yaml
// Android: focusing the editor brings the soft keyboard back
// - after a search input that had it unmounts in the same tick
//   (`setSearchOpen(false); editor.focus()`),
// - after inserting a link from the toolbar's link bar,
// - when autofocus runs while the device is not in touch mode.
// The status line reads the keyboard events, so `keyboard:up` means the IME
// is on screen. (Android only: `runFlow: when: platform: Android`.)
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  editorStatus,
  expectHtml,
  expectKeyboardBackUp,
  launch,
  openEntry,
  toolbarButton,
} from '../support/app.ts';
import { adbShell, useDeviceKeyboard } from '../support/android.ts';

test(
  'Repro: the keyboard comes back when the editor is focused',
  { tags: ['repro'], platforms: ['android'] },
  async ({ app, device, platform, screen }) => {
    await launch(app, screen);
    await useDeviceKeyboard(platform);
    await openEntry(screen, 'Repro: Focus keyboard');
    await expect(editorStatus(screen)).toHaveText(
      /^ready:true .*keyboard:up$/,
      { timeout: 15_000 }
    );

    // A search input takes the keyboard, then unmounts as the editor is focused.
    await screen.getByTestId('open-search').tap();
    await expect(screen.getByTestId('search-input')).toBeVisible();
    await screen.getByTestId('close-search').tap();
    await expect(screen.getByTestId('search-input')).toBeHidden();
    // The source waits 2 s here ("long enough for a hide to be reported and the
    // keyboard to come back"), then waits for `keyboard:up`.
    await expectKeyboardBackUp(screen);

    // A link inserted from the link bar keeps the keyboard up.
    await screen.getByTestId('select-word').tap();
    await (await toolbarButton(screen, 'Link')).tap();
    // agent-device types (and fills) through its helper IME, and switching to
    // it blurs the link bar, which closes it. `adb shell input text` sends
    // key events through the device keyboard, as Maestro's `inputText` does.
    await expect(
      screen.getByPlaceholder('Type your URL here...')
    ).toBeFocused();
    await adbShell('input', 'text', 'example.com');
    await expect(screen.getByPlaceholder('Type your URL here...')).toHaveValue(
      'example.com'
    );
    await screen.getByText('Insert').tap();
    await expectKeyboardBackUp(screen);
    await expectHtml(
      screen,
      /<a [^>]*href="https:\/\/example.com"[^>]*>Focus<\/a>/,
      10_000
    );

    // Autofocus after a D-pad key press took the device out of touch mode.
    await device.dismissKeyboard();
    await expect(editorStatus(screen)).toHaveText(/keyboard:down$/);
    await screen.getByTestId('remount-editor').tap();
    // `pressKey: Remote Dpad Down` has no e2e equivalent (guide: TV remote keys,
    // "Not yet"); send the key event with adb.
    await adbShell('input', 'keyevent', 'KEYCODE_DPAD_DOWN');
    await expect(editorStatus(screen)).toHaveText(
      /^ready:true .*keyboard:up$/,
      { timeout: 15_000 }
    );
  }
);
