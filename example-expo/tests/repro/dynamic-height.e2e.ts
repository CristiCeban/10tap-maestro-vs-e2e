// Ported from .maestro/repro/dynamic-height.yaml
// #342, #336, #323: dynamicHeight editors show their whole content, and the
// one capped at 150pt by its parent shows its first lines.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample } from '../support/app';
import { rawSnapshotTexts } from '../support/android';

test(
  'Repro: dynamic height',
  { tags: ['repro'] },
  async ({ app, device, platform, screen }) => {
    await openExample(app, device, screen, 'Dynamic Height', platform);
    const grows = 'Type here: the editor grows with its content.';
    const capped = /^Line 1(\s[\s\S]*)?$/;
    if (platform === 'android') {
      // agent-device's default tree can miss a WebView's content, so Android
      // reads both editors from its raw snapshot (see `rawSnapshotTexts`).
      // Same two assertions, same timeouts.
      await expect
        .poll(async () => (await rawSnapshotTexts()).includes(grows), {
          timeout: 20_000,
        })
        .toBe(true);
      expect((await rawSnapshotTexts()).some((t) => capped.test(t))).toBe(true);
    } else {
      await expect(screen.getByText(grows)).toBeVisible({ timeout: 20_000 });
      // Android WebView exposes the capped editor's paragraphs as one node.
      await expect(screen.getByText(capped)).toBeVisible();
    }
    await app.screenshot('dynamic-height');
  }
);
