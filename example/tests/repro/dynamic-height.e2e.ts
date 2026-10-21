// Ported from .maestro/repro/dynamic-height.yaml
// #342, #336: a dynamicHeight editor grows and shrinks with its content.
// #323: typing at the end of a height-capped dynamicHeight editor keeps the
// caret in view; the screenshot is for the manual check (gate G-ALL-3).
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  editorStatus,
  launch,
  openEntry,
  typeInEditor,
} from '../support/app.ts';
import { typeIntoFocus } from '../support/android.ts';

test(
  'Repro: dynamic height follows the content',
  { tags: ['repro'] },
  async ({ app, platform, screen }) => {
    await launch(app, screen);
    await openEntry(screen, 'Repro: Dynamic height');
    await expect(editorStatus(screen)).toHaveText(/^ready:true/, {
      timeout: 15_000,
    });
    const status = screen.getByTestId('dynamic-height-status');
    await expect(status).toHaveText(/^height:[1-9][0-9]*$/);
    await screen.getByTestId('grow-content').tap();
    await expect(status).toHaveText(/^height:[0-9]+.* grow:ok$/);
    await screen.getByTestId('shrink-content').tap();
    await expect(status).toHaveText(/^height:[0-9]+.* shrink:ok$/);
    const capped = screen.getByTestId('capped-dynamic-editor');
    await screen.scrollUntilVisible(capped);
    await capped.tap();
    // Android's WebView exposes no text field in the capped editor, so the
    // text goes to the focused view as key events, as Maestro's `inputText`.
    if (platform === 'android') await typeIntoFocus(' typed at the end');
    else
      await typeInEditor(screen, 'capped-dynamic-editor', ' typed at the end');
    await app.screenshot('capped-dynamic-height');
  }
);
