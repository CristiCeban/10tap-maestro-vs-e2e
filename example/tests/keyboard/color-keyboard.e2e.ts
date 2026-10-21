// Ported from .maestro/keyboard/color-keyboard.yaml
// ColorKeyboard applies a color, closes back to the system keyboard and the
// caret stays where it was (G-ALL-1).
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  expectHtml,
  openKeyboardScreen,
  typeInEditor,
} from '../support/app.ts';

test('Color keyboard', async ({ app, screen }) => {
  await openKeyboardScreen(app, screen, 'Keyboard: Custom');
  await screen.getByTestId('toggle-color-keyboard').tap();
  await expect(screen.getByText('Highlight')).toBeVisible();
  await screen.getByText('Red').first().tap();
  await expect(screen.getByText('Highlight')).toBeHidden();
  await typeInEditor(screen, EDITOR, ' typed');
  await expectHtml(screen, /color.*typed/);
});
