// Ported from .maestro/keyboard/overlay-keyboard.yaml
// layout="overlay" with EditorKeyboardAvoidingView (and 'stable' mode on
// Android): the keyboard opens over the window, the switcher above it stays
// reachable, and typing works after it closes back to the system keyboard.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  expectHtml,
  openKeyboardScreen,
  typeInEditor,
} from '../support/app.ts';

test('Overlay custom keyboard', async ({ app, screen }) => {
  await openKeyboardScreen(app, screen, 'Keyboard: Overlay');
  await screen.getByTestId('toggle-color-keyboard').tap();
  await expect(screen.getByText('Highlight')).toBeVisible();
  await expect(screen.getByTestId('toggle-color-keyboard')).toBeVisible();
  await screen.getByText('Blue').first().tap();
  await expect(screen.getByText('Highlight')).toBeHidden();
  await typeInEditor(screen, EDITOR, ' overlay');
  await expectHtml(screen, /color.*overlay/);
});
