// Ported from .maestro/keyboard/android-back-dismisses.yaml
// Android back closes an open custom keyboard without showing the system
// keyboard and is consumed, so the screen stays. Tapping the editor then
// types normally again. (Android only: `runFlow: when: platform: Android`.)
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  HOME_TITLE,
  expectHtml,
  launch,
  openEntry,
  tapEditorAndWaitForKeyboard,
  typeInEditor,
} from '../support/app.ts';

test(
  'Android back dismisses the custom keyboard',
  { platforms: ['android'] },
  async ({ app, device, screen }) => {
    await launch(app, screen);
    // The source waits for the home screen once more here.
    await expect(screen.getByText(HOME_TITLE)).toBeVisible({ timeout: 60_000 });
    await openEntry(screen, 'Keyboard: Custom');
    await tapEditorAndWaitForKeyboard(screen);
    await screen.getByTestId('toggle-sticker-keyboard').tap();
    await expect(screen.getByTestId('sticker-0')).toBeVisible();
    await device.back();
    await expect(screen.getByTestId('sticker-0')).toBeHidden();
    await expect(screen.getByTestId(EDITOR)).toBeVisible();
    await screen.getByTestId(EDITOR).tap();
    await typeInEditor(screen, EDITOR, 'after back');
    await expectHtml(screen, /after back/);
  }
);
