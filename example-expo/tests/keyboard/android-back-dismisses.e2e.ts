// Ported from .maestro/keyboard/android-back-dismisses.yaml
// Android back closes ColorKeyboard instead of leaving the screen.
// (Android only: `runFlow: when: platform: Android`.)
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { openExample } from '../support/app';

test(
  'Android back closes the custom keyboard',
  { tags: ['keyboard'], platforms: ['android'] },
  async ({ app, device, platform, screen }) => {
    await openExample(app, device, screen, 'Custom Keyboard', platform);
    await expect(screen.getByText(/open ColorKeyboard\.$/)).toBeVisible({
      timeout: 20_000,
    });
    await screen.getByRole('button', 'Color keyboard').tap();
    await expect(screen.getByText('Highlight')).toBeVisible();
    await device.back();
    await expect(screen.getByText('Highlight')).toBeHidden();
    await expect(screen.getByText('Custom Keyboard')).toBeVisible();
  }
);
