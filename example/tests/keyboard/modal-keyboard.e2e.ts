// Ported from .maestro/keyboard/modal-keyboard.yaml
// An editor inside a Modal. On Android the Modal is its own window, so the
// keyboard runs on the fallback driver there; the flow is the same.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  EDITOR,
  expectHtml,
  launch,
  openEntry,
  tapEditorAndWaitForKeyboard,
  typeInEditor,
} from '../support/app.ts';

test('Custom keyboard inside a Modal', async ({ app, screen }) => {
  await launch(app, screen);
  await openEntry(screen, 'Keyboard: Modal');
  const open = screen.getByTestId('open-editor-modal');
  await expect(open).toBeVisible({ timeout: 15_000 });
  await open.tap();
  const editor = screen.getByTestId(EDITOR);
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await tapEditorAndWaitForKeyboard(screen);
  const toggle = screen.getByTestId('toggle-color-keyboard');
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  await toggle.tap();
  // The color keyboard replaces the system one; wait until it is fully up.
  await expect(screen.getByText('Highlight')).toBeVisible({ timeout: 15_000 });
  await expect(screen.getByText('Red').first()).toBeVisible({
    timeout: 15_000,
  });
  await screen.getByText('Red').first().tap();
  await expect(screen.getByText('Highlight')).toBeHidden();
  await typeInEditor(screen, EDITOR, ' modal');
  await expectHtml(screen, /color.*modal/, 10_000);
  await expect(screen.getByText(/driver failed/i)).toBeHidden();
  await screen.getByTestId('close-editor-modal').tap();
});
