// Ported from .maestro/keyboard/toggle-twenty-times.yaml
// 20 custom/system keyboard swaps leave the editor typing at the caret.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample, typeInEditor } from '../support/app';

test(
  'Toggle the custom keyboard 20 times',
  { tags: ['keyboard'], timeout: 300_000 },
  async ({ app, device, platform, screen }) => {
    await openExample(app, device, screen, 'Custom Keyboard', platform);
    await expect(screen.getByText(/open ColorKeyboard\.$/)).toBeVisible({
      timeout: 20_000,
    });
    const toggle = screen.getByRole('button', 'Color keyboard');
    const highlight = screen.getByText('Highlight');
    for (let i = 0; i < 20; i++) {
      await toggle.tap();
      await expect(highlight).toBeVisible();
      await toggle.tap();
      await expect(highlight).toBeHidden();
    }
    await typeInEditor(screen, platform, ' after');
    await expect(screen.getByText(/ColorKeyboard\. after$/)).toBeVisible();
  }
);
