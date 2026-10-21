// Ported from .maestro/repro/autofocus.yaml
// #321: `autofocus: true` focuses the editor and brings up the soft keyboard
// (Android used to show a caret with no keyboard).
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import {
  editorStatus,
  expectHtml,
  launch,
  openEntry,
  typeInEditor,
} from '../support/app.ts';
import { useDeviceKeyboard, useTestKeyboard } from '../support/android.ts';

test(
  'Repro: autofocus shows the keyboard',
  { tags: ['repro'] },
  async ({ app, platform, screen }) => {
    await launch(app, screen);
    await useDeviceKeyboard(platform);
    await openEntry(screen, 'Repro: Autofocus');
    await expect(editorStatus(screen)).toHaveText(
      /^ready:true .*keyboard:up$/,
      { timeout: 15_000 }
    );
    await useTestKeyboard(platform);
    await typeInEditor(screen, 'autofocus-editor', ' typed');
    await expectHtml(screen, /Autofocus typed/);
  }
);
