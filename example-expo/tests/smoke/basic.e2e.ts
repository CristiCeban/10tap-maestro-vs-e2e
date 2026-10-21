// Ported from .maestro/smoke/basic.yaml
// The editor loads its initial content, takes focus on its own (autofocus,
// Android #321) and receives typing.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample, typeInEditor } from '../support/app';

test(
  'Basic editor',
  { tags: ['smoke'] },
  async ({ app, device, platform, screen }) => {
    await openExample(app, device, screen, 'Basic', platform);
    await expect(screen.getByText('This is a basic example')).toBeVisible({
      timeout: 20_000,
    });
    await typeInEditor(screen, platform, ' typed');
    await expect(
      screen.getByText('This is a basic example typed')
    ).toBeVisible();
    await app.screenshot('basic');
  }
);
