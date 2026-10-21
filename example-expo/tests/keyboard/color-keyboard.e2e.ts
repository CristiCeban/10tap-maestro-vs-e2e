// Ported from .maestro/keyboard/color-keyboard.yaml
// The palette item swaps the system keyboard for ColorKeyboard, a color pick
// closes it and typing goes on at the caret in that color.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample, typeInEditor } from '../support/app';

test(
  'Color keyboard',
  { tags: ['keyboard'] },
  async ({ app, device, platform, screen }) => {
    await openExample(app, device, screen, 'Custom Keyboard', platform);
    await expect(screen.getByText(/open ColorKeyboard\.$/)).toBeVisible({
      timeout: 20_000,
    });
    await screen.getByRole('button', 'Color keyboard').tap();
    await expect(screen.getByText('Highlight')).toBeVisible();
    await app.screenshot('color-keyboard-open');
    await screen.getByText('Red').first().tap();
    await expect(screen.getByText('Highlight')).toBeHidden();
    await typeInEditor(screen, platform, ' typed');
    await expect(screen.getByText(/ColorKeyboard\. typed$/)).toBeVisible();
  }
);
