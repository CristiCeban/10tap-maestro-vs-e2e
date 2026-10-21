// Ported from .maestro/repro/readiness.yaml
// #343, #322, #227: a read-only editor without autofocus still becomes ready
// and shows its initial content, with no user interaction.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { editorStatus, expectHtml, launch, openEntry } from '../support/app.ts';

test(
  'Repro: read-only editor becomes ready',
  { tags: ['repro'] },
  async ({ app, screen }) => {
    await launch(app, screen);
    await openEntry(screen, 'Repro: Readiness');
    await expect(editorStatus(screen)).toHaveText(
      /^ready:true editable:false/,
      { timeout: 15_000 }
    );
    await expect(screen.getByText('Read-only content loaded')).toBeVisible();
    await expectHtml(screen, /^<p>Read-only content loaded<\/p>$/);
  }
);
