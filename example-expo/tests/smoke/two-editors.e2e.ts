// Ported from .maestro/smoke/two-editors.yaml
// Two editors on one screen keep their own content.
// The typed words end in a space (' two ') and the source's patterns need
// it ('.* two .*'); e2e trims text before matching, so the patterns end at
// the word instead (`/ two$/`): the trailing space itself goes unchecked.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample, typeInEditor } from '../support/app';

test(
  'Two editors',
  { tags: ['smoke'] },
  async ({ app, device, platform, screen }) => {
    await openExample(app, device, screen, 'Two Editors', platform);
    await expect(screen.getByText('Second editor')).toBeVisible({
      timeout: 20_000,
    });
    await screen.getByText('Second editor').tap();
    await typeInEditor(screen, platform, ' two ', /^Second editor/);
    await expect(screen.getByText(/ two$/)).toBeVisible();
    await screen.getByText('First editor').tap();
    await typeInEditor(screen, platform, ' one ', /^First editor/);
    await expect(screen.getByText(/ one$/)).toBeVisible();
    await expect(screen.getByText(/ one .* two$/)).toBeHidden();
    await expect(screen.getByText(/ two .* one$/)).toBeHidden();
  }
);
