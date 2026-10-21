// Ported from .maestro/smoke/toolbar-actions.yaml
// The default Toolbar: italic, heading (#298), lists, undo/redo and a link
// without a protocol (#255). The source taps toolbar items by screen position
// (calibrated for a Pixel 5 with Gboard: row at 62%, items 11.2% apart),
// because "toolbar items have no test ids"; they do have accessibility labels,
// so the port taps them by label (Bold 5%, Italic 16%, Link 28%, Heading 50%;
// after scrolling to the end: Ordered list 38%, Bullet list 50%, Undo 83%,
// Redo 94%; in the heading bar: Close headings 5%, Heading 1 16%).
// (Android only: `runFlow: when: platform: Android`.)
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  editorStatus,
  expectHtml,
  launch,
  openEntry,
  toolbarButton,
} from '../support/app.ts';
import {
  longPressAtPercent,
  typeIntoFocus,
  useDeviceKeyboard,
} from '../support/android.ts';

const EDITOR = 'smoke-editor';

test(
  'Toolbar actions',
  { tags: ['smoke'], platforms: ['android'], timeout: 300_000 },
  async ({ app, platform, screen }) => {
    await launch(app, screen);
    // The source runs with Gboard on screen (`keyboard:up`, positions
    // calibrated for it); type as key events through it (see android.ts).
    await useDeviceKeyboard(platform);
    await openEntry(screen, 'E2E: Smoke');
    await expect(editorStatus(screen)).toHaveText(/^ready:true editable:true/, {
      timeout: 15_000,
    });
    await screen.getByTestId(EDITOR).tap();
    await expect(editorStatus(screen)).toHaveText(/keyboard:up$/, {
      timeout: 15_000,
    });

    // Italic
    await (await toolbarButton(screen, 'Italic')).tap();
    await typeIntoFocus(' it');
    await expectHtml(screen, /^<p>Smoke test<em> it<\/em><\/p>$/, 10_000);

    // Heading sub-toolbar: Aa, H1, close
    await (await toolbarButton(screen, 'Heading')).tap();
    await screen.getByRole('button', 'Heading 1').tap();
    await screen.getByRole('button', 'Close headings').tap();
    await expectHtml(screen, /^<h1>Smoke test<em> it<\/em><\/h1>$/, 10_000);

    // The end of the toolbar: undo, redo, lists
    await (await toolbarButton(screen, 'Undo')).tap();
    await expectHtml(screen, /^<p>Smoke test<em> it<\/em><\/p>$/, 10_000);
    await (await toolbarButton(screen, 'Redo')).tap();
    await expectHtml(screen, /^<h1>Smoke test<em> it<\/em><\/h1>$/, 10_000);
    await (await toolbarButton(screen, 'Undo')).tap();
    await (await toolbarButton(screen, 'Bullet list')).tap();
    await expectHtml(
      screen,
      /^<ul><li><p>Smoke test<em> it<\/em><\/p><\/li><\/ul>$/,
      10_000
    );
    await (await toolbarButton(screen, 'Bullet list')).tap();
    await (await toolbarButton(screen, 'Ordered list')).tap();
    await expectHtml(
      screen,
      /^<ol><li><p>Smoke test<em> it<\/em><\/p><\/li><\/ol>$/,
      10_000
    );

    // Link on a selected word; the https:// protocol is added (#255). The source
    // long-presses the screen point 14%,18% ("Smoke"); e2e has no long press at
    // a point, so the press goes through adb (support/android.ts).
    // The source swipes back to the start of the toolbar first, then selects.
    const link = await toolbarButton(screen, 'Link');
    // Selects the word "Smoke" in the ordered list item, as the source does.
    await longPressAtPercent(14, 18);
    await link.tap();
    await typeIntoFocus('example.com');
    await screen.getByText('Insert').tap();
    await expectHtml(
      screen,
      /<a [^>]*href="https:\/\/example.com"[^>]*>(Smoke|test)<\/a>/,
      10_000
    );
  }
);
