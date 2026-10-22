// Ported from .maestro/smoke/editor-basics.yaml
// Editor basics: the editor becomes ready, takes typing and formatting, and
// undo reverts the formatted text.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  editorHtml,
  editorStatus,
  expectHtml,
  launch,
  openEntry,
  settleAfterKeyboardRise,
  typeInEditor,
} from '../support/app.ts';

test('Editor basics', { tags: ['smoke'] }, async ({ app, screen }) => {
  await launch(app, screen);
  await openEntry(screen, 'E2E: Smoke');
  await expect(editorStatus(screen)).toHaveText(/^ready:true editable:true/, {
    timeout: 15_000,
  });
  await expect(screen.getByText('Smoke test')).toBeVisible();
  await screen.getByTestId('smoke-editor').tap();
  await typeInEditor(screen, 'smoke-editor', ' typed');
  // The source's `waitForAnimationToEnd` before the formatting tap, in state
  // terms. In CI's iOS 26 trace the keyboard rises during the typing above (its
  // window and keys are in that step's screen diff), and the `toggle-bold` tap is
  // delivered ~1.3 s later, mid-ride; what comes back is
  // `<h4>Smoke test typed bold</h4>` — no `<strong>`, with the toolbar's heading
  // expansion open and `Heading 4 [selected]`. So wait for the app's own
  // `keyboard:up` and for it to hold before aiming at the probe row.
  await settleAfterKeyboardRise(screen);
  await screen.getByTestId('toggle-bold').tap();
  await typeInEditor(screen, 'smoke-editor', ' bold');
  await expectHtml(screen, /typed.*<strong>.*bold<\/strong>/);
  await screen.getByTestId('undo').tap();
  await expectHtml(screen, /Smoke test/);
  await expect(editorHtml(screen)).not.toHaveText(/bold<\/strong>/);
});
