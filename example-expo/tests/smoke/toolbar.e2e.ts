// Ported from .maestro/smoke/toolbar.yaml
// The default toolbar buttons, found by their accessibility labels, toggle
// marks and blocks at the caret and report it through their selected state.
// Typed words avoid the button labels, which Maestro matches case-insensitively.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample, swipeToolbar, typeInEditor } from '../support/app';

test(
  'Toolbar actions',
  { tags: ['smoke'], timeout: 300_000 },
  async ({ app, device, platform, screen }) => {
    const button = (label: string) => screen.getByRole('button', label);
    await openExample(app, device, screen, 'Basic', platform);
    await expect(screen.getByText('This is a basic example')).toBeVisible({
      timeout: 20_000,
    });
    await button('Bold').tap();
    await expect(button('Bold')).toBeSelected();
    await typeInEditor(screen, platform, ' Qb');
    await button('Bold').tap();
    await expect(button('Bold')).not.toBeSelected();
    await button('Italic').tap();
    await expect(button('Italic')).toBeSelected();
    await typeInEditor(screen, platform, ' Qi');
    await button('Italic').tap();
    await button('Heading').tap();
    await button('Heading 1').tap();
    await expect(button('Heading 1')).toBeSelected();
    await button('Close headings').tap();
    await swipeToolbar(screen, 'left');
    await button('Undo').tap();
    await swipeToolbar(screen, 'right');
    await button('Heading').tap();
    await expect(button('Heading 1')).not.toBeSelected();
    await button('Close headings').tap();
    await swipeToolbar(screen, 'left');
    await button('Redo').tap();
    await swipeToolbar(screen, 'right');
    await button('Heading').tap();
    await expect(button('Heading 1')).toBeSelected();
    await button('Close headings').tap();
    await expect(screen.getByText(/basic example Qb Qi$/)).toBeVisible();
    await app.screenshot('toolbar');
  }
);
