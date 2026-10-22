// Ported from .maestro/smoke/toolbar-actions-ios.yaml
// The default Toolbar on iOS, driven by the buttons' accessibility labels:
// link without a protocol (#255), italic, heading on and off (#298), bullet
// list and toolbar undo/redo. The probe row comes first and has its own
// "Undo" button, so the toolbar's is the second match.
// (iOS only: `runFlow: when: platform: iOS`.)
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  HOME_TITLE,
  doubleTapToSelect,
  editorStatus,
  expectHtml,
  expectKeyboardBackUp,
  insertLink,
  launch,
  openEntry,
  tapAtPercent,
  toolbarButton,
  typeInEditor,
} from '../support/app.ts';

const EDITOR = 'smoke-editor';

test(
  'Toolbar actions (iOS)',
  { tags: ['smoke'], platforms: ['ios'], timeout: 300_000 },
  async ({ app, device, platform, screen }) => {
    await launch(app, screen);
    await openEntry(screen, 'E2E: Smoke');
    // A tap during the push transition is lost on a cold old-arch start.
    await expect(screen.getByText(HOME_TITLE)).toBeHidden({ timeout: 10_000 });
    await expect(editorStatus(screen)).toHaveText(/^ready:true editable:true/, {
      timeout: 15_000,
    });
    // The source taps `id: smoke-editor`, the RN *container*. On iOS 26 in CI the
    // WebView had promoted that container's accessibility label to
    // "Vertical scroll bar, 1 page", so the locator resolved to the WebView's
    // scroll bar: the trace's next line is `screen: unchanged since step 7`, and
    // the 15 s `Italic` wait below then runs 23 s and dies with the probe still
    // reading `keyboard:down`. That button cannot exist in that state — the
    // Toolbar hides itself while `!isKeyboardUp` (src/RichText/Toolbar/
    // Toolbar.tsx:110) — so the flow was waiting for a node the app is not
    // allowed to show. Tap the contenteditable the typing steps already use and
    // require the state the tap exists to produce, loudly, here rather than 23 s
    // later on an unrelated button.
    await screen.getByTestId(EDITOR).getByRole('textbox').tap();
    await expectKeyboardBackUp(screen, 300, 10_000);
    await expect(screen.getByRole('button', 'Italic')).toBeVisible({
      timeout: 15_000,
    });

    // Link on the selected word "Smoke"; the https:// protocol is added (#255).
    // The toolbar's `Link` is disabled until the WebView reports a selection, so
    // the double-tap has to land before it can be tapped (doubleTapToSelect).
    await doubleTapToSelect(
      screen,
      screen.getByTestId(EDITOR).getByText('Smoke test'),
      await toolbarButton(screen, 'Link')
    );
    await insertLink(screen, 'example.com');
    await expectHtml(
      screen,
      /<a [^>]*href="https:\/\/example\.com"[^>]*>(Smoke|test)<\/a>/
    );

    // Italic at the end of the document (the empty editor area). The editor
    // view reaches under the keyboard, so on short screens its center can be
    // the toolbar; tap just below the text instead (the source's 50%,35%).
    await tapAtPercent(screen, device, platform, 50, 35);
    await (await toolbarButton(screen, 'Italic')).tap();
    await typeInEditor(screen, EDITOR, ' ital');
    await (await toolbarButton(screen, 'Italic')).tap();
    await expectHtml(screen, /<em>.*ital<\/em>/);

    // Bold; the probe row has its own "Bold" button, so the toolbar's is last.
    await (await toolbarButton(screen, 'Bold')).tap();
    await typeInEditor(screen, EDITOR, ' bld');
    await (await toolbarButton(screen, 'Bold')).tap();
    await expectHtml(screen, /<strong>.*bld<\/strong>/);

    // Heading sub-toolbar: Heading, Heading 1, close; then toggle it off
    await (await toolbarButton(screen, 'Heading')).tap();
    await screen.getByRole('button', 'Heading 1').tap();
    await screen.getByRole('button', 'Close headings').tap();
    await expectHtml(screen, /^<h1>.*ital<\/em>.*bld<\/strong><\/h1>$/);
    await (await toolbarButton(screen, 'Heading')).tap();
    await screen.getByRole('button', 'Heading 1').tap();
    await screen.getByRole('button', 'Close headings').tap();
    await expectHtml(screen, /^<p>.*ital<\/em>.*bld<\/strong><\/p>$/);

    // Bullet list, then toolbar undo and redo
    await (await toolbarButton(screen, 'Bullet list')).tap();
    await expectHtml(screen, /^<ul><li>.*<\/li><\/ul>$/);
    await (await toolbarButton(screen, 'Undo')).tap();
    await expectHtml(screen, /^<p>.*ital<\/em>.*bld<\/strong><\/p>$/);
    await (await toolbarButton(screen, 'Redo')).tap();
    await expectHtml(screen, /^<ul><li>.*<\/li><\/ul>$/);
  }
);
