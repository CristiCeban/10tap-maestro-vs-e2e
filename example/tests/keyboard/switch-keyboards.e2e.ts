// Ported from .maestro/keyboard/switch-keyboards.yaml
// Switching from one custom keyboard to another swaps the body only, and
// closing afterwards still brings the system keyboard back to the editor.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  editorHtml,
  openKeyboardScreen,
  typeInEditor,
} from '../support/app.ts';

test('Switch between custom keyboards', async ({ app, screen }) => {
  await openKeyboardScreen(app, screen, 'Keyboard: Custom');
  await screen.getByTestId('toggle-sticker-keyboard').tap();
  await expect(screen.getByTestId('sticker-0')).toBeVisible();
  await screen.getByTestId('toggle-color-keyboard').tap();
  await expect(screen.getByText('Highlight')).toBeVisible();
  await expect(screen.getByTestId('sticker-0')).toBeHidden();
  await screen.getByTestId('toggle-color-keyboard').tap();
  await expect(screen.getByText('Highlight')).toBeHidden();
  await typeInEditor(screen, EDITOR, 'switched');
  await screen.getByTestId('read-editor-state').tap();
  await expect(screen.getByText('mounts:1 unmounts:1')).toBeVisible();
  await expect(editorHtml(screen)).toHaveText(/switched/);
});
