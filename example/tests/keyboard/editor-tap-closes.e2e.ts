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
  //
  // `.first()`: the WebView projects this paragraph as two sibling text nodes
  // with the same value, so a bare `getByText` matched 2 and died with
  // LOCATOR_AMBIGUOUS before the tap (iOS 26 CI, run 39808553422). Duplicates
  // under one textbox are that projection, not two paragraphs on screen. Maestro
  // takes the first match unless a flow asks otherwise — hence
  // `tapOn: { text: 'Bold', index: 1 }` in the toolbar flow — so this matches
  // the source instead of being stricter than it.
  await screen.getByText('Pick a sticker or a color.').first().tap();
  await expect(screen.getByTestId('sticker-0')).toBeHidden();
  await typeInEditor(screen, EDITOR, 'x');
  await expectHtml(screen, /x/);
});
