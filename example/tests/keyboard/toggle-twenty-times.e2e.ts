// Ported from .maestro/keyboard/toggle-twenty-times.yaml
// 20 custom/system swaps: every open mounts the keyboard and every close
// unmounts it (#51), and typing afterwards still reaches the editor.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  editorHtml,
  openKeyboardScreen,
  typeInEditor,
} from '../support/app.ts';

test(
  'Toggle the custom keyboard 20 times',
  { timeout: 300_000 },
  async ({ app, screen }) => {
    await openKeyboardScreen(app, screen, 'Keyboard: Custom');
    const toggle = screen.getByTestId('toggle-sticker-keyboard');
    const sticker = screen.getByTestId('sticker-0');
    for (let i = 0; i < 20; i++) {
      await toggle.tap();
      await expect(sticker).toBeVisible();
      await toggle.tap();
      await expect(sticker).toBeHidden();
    }
    await typeInEditor(screen, EDITOR, 'after swaps');
    await screen.getByTestId('read-editor-state').tap();
    await expect(screen.getByText('mounts:20 unmounts:20')).toBeVisible();
    await expect(editorHtml(screen)).toHaveText(/after swaps/);
  }
);
