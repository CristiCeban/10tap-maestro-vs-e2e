// Ported from .maestro/keyboard/editor-tap-closes.yaml
// Tapping the editor while a custom keyboard is open brings the system
// keyboard back (closeOnEditorPress).
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  expectHtml,
  openKeyboardScreen,
  typeInEditor,
} from '../support/app.ts';

test('Editor tap closes the custom keyboard', async ({ app, screen }) => {
  await openKeyboardScreen(app, screen, 'Keyboard: Custom');
  await screen.getByTestId('toggle-sticker-keyboard').tap();
  await expect(screen.getByTestId('sticker-0')).toBeVisible();
  // The editor view reaches under the custom keyboard, so its center can land
  // on the keyboard switcher; tap the text instead.
  await screen.getByText('Pick a sticker or a color.').tap();
  await expect(screen.getByTestId('sticker-0')).toBeHidden();
  await typeInEditor(screen, EDITOR, 'x');
  await expectHtml(screen, /x/);
});
