// Ported from .maestro/repro/content-api.yaml
// Content and selection APIs:
// #338 getSelectedText, #255 links without a protocol, #62 insertContent,
// #273 typing after an inserted image, #327 whitespace-preserving parse options.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  editorStatus,
  expectHtml,
  launch,
  openEntry,
  typeInEditor,
} from '../support/app.ts';

test(
  'Repro: content and selection APIs',
  { tags: ['repro'] },
  async ({ app, screen }) => {
    await launch(app, screen);
    await openEntry(screen, 'Repro: Content API');
    await expect(editorStatus(screen)).toHaveText(/^ready:true/, {
      timeout: 15_000,
    });

    await screen.getByTestId('get-selected-text').tap();
    await expect(screen.getByTestId('selected-text')).toHaveText(
      'selected:Hello'
    );

    await screen.getByTestId('set-link').tap();
    await expectHtml(
      screen,
      /href="https:\/\/www\.example\.com".*Hello<\/a> world/
    );

    await screen.getByTestId('insert-content').tap();
    await expectHtml(screen, /<strong>inserted<\/strong>/);

    await screen.getByTestId('set-image').tap();
    await typeInEditor(screen, 'content-api-editor', 'after');
    await expectHtml(screen, /<img[^>]*>.*<p>after<\/p>/);
  }
);

// The flow's last step, #327: `setContent` with whitespace-preserving parse
// options keeps "a   b". e2e collapses whitespace in every text read
// (`toHaveText`, `textContent`), so "<p>a   b</p>" and "<p>a b</p>" read the
// same and the check cannot be made. It stays in Maestro; the app change that
// would allow it is to render `editor-html` with visible whitespace.
test(
  'Repro: content and selection APIs (#327 whitespace)',
  {
    tags: ['repro'],
    skip: 'e2e collapses whitespace in text reads; stays in Maestro',
  },
  async ({ app, screen }) => {
    await launch(app, screen);
    await openEntry(screen, 'Repro: Content API');
    await expect(editorStatus(screen)).toHaveText(/^ready:true/, {
      timeout: 15_000,
    });
    await screen.getByTestId('set-whitespace-content').tap();
    await expectHtml(screen, /^<p>a {3}b<\/p>$/);
  }
);
