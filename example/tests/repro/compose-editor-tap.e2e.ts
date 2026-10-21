// Ported from .maestro/repro/compose-editor-tap.yaml
// CustomAndStaticToolbar: while the autofocused "To" field has the keyboard,
// a tap on the editor focuses it (the toolbar's keyboard padding used to
// swallow it on Android's old architecture).
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { launch, openEntry, tapAtPercent } from '../support/app.ts';
import { typeIntoFocus, useDeviceKeyboard } from '../support/android.ts';

test(
  'Repro: editor tap takes focus from another input',
  { tags: ['repro'] },
  async ({ app, device, platform, screen }) => {
    await launch(app, screen, { clearState: false });
    // The compose toolbar rides on the keyboard (see support/android.ts).
    await useDeviceKeyboard(platform);
    await openEntry(screen, 'CustomAndStaticToolbar');
    const formatting = screen.getByRole('button', 'Formatting');
    await expect(formatting).toBeHidden({ timeout: 3_000 });
    // `waitForAnimationToEnd` in the source: the pushed screen's editor has
    // rendered its content.
    await expect(screen.getByText('Sent With Tentap!')).toBeVisible({
      timeout: 10_000,
    });
    // The source taps the screen center, where the editor is.
    await tapAtPercent(screen, device, platform, 50, 50);
    await expect(formatting).toBeVisible({ timeout: 10_000 });
    // The editor (no testID) now has focus; Maestro types into the focus.
    if (platform === 'android') await typeIntoFocus('TappedIn');
    else await device.locator('editable focused').pressSequentially('TappedIn');
    await screen.getByRole('button', 'Send').tap();
    // The alert's mail content and the editor both show it (Maestro takes the
    // first match; e2e fails on two): `.first()`, per the guide.
    await expect(screen.getByText(/TappedIn/).first()).toBeVisible({
      timeout: 10_000,
    });
    await screen.getByText('OK').tap();
  }
);
