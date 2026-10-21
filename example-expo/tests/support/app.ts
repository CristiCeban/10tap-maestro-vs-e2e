// Ported from .maestro/common/open-example.yaml.
import type { App, Screen } from 'e2e';
import type { Device } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { METRO_URL } from '../../e2e.config';
import { typeIntoFocus, useDeviceKeyboard } from './android';

export const HOME_TITLE = '10Tap Rich Text Editor';

/**
 * Launches the development build on the Metro bundle and opens the example
 * named `example`.
 */
export async function openExample(
  app: App,
  device: Device,
  screen: Screen,
  example: string,
  platform: string
) {
  await app.open();
  // Maestro's `launchApp` returns once the app is idle; `app.open()` returns
  // sooner, and a link sent while the relaunched dev client still boots its
  // last bundle reloads it mid-init (red box "runtime not ready"). Wait for a
  // screen first: the example list, the dev menu, or the dev launcher.
  await expect
    .poll(
      async () =>
        (await screen.getByText(HOME_TITLE).isVisible()) ||
        (await screen.getByText('Continue').isVisible()) ||
        (await screen.getByText(/^development servers$/i).isVisible()),
      { timeout: 60_000 }
    )
    .toBe(true);
  await device.openLink(
    `exp+tentap-example-expo://expo-development-client/?url=${encodeURIComponent(METRO_URL)}`
  );
  // iOS asks before a link opens the app, sometimes twice.
  const title = screen.getByText(HOME_TITLE);
  const openIn = screen.getByText(/^Open in /);
  const cont = screen.getByText('Continue');
  const close = screen.getByText('Close');
  await expect
    .poll(
      async () =>
        (await title.isVisible()) ||
        (await openIn.isVisible()) ||
        (await cont.isVisible()) ||
        (await close.isVisible()),
      { timeout: 120_000 }
    )
    .toBe(true);
  for (let i = 0; i < 3 && (await openIn.isVisible()); i++) {
    await screen.getByText('Open').tap();
  }
  // A fresh install greets with the dev menu sheet, which hides the list.
  await expect
    .poll(
      async () =>
        (await title.isVisible()) ||
        (await cont.isVisible()) ||
        (await close.isVisible()),
      { timeout: 120_000 }
    )
    .toBe(true);
  if (await cont.isVisible()) await cont.tap();
  if (await close.isVisible()) await close.tap();
  await expect(title).toBeVisible();
  await screen.getByText(example).tap();
  // Android: the device keyboard, as Maestro has it (see android.ts); with
  // agent-device's test IME, which `app.open()` selects, the toolbar never
  // shows and screens with two WebViews expose no editor content.
  await useDeviceKeyboard(platform);
}

/**
 * Maestro `inputText` types into whatever has focus; e2e types through a
 * locator. The focused WebView contenteditable is the editor's text field;
 * `text` names it by its current content when a screen has several editors.
 */
export async function typeInEditor(
  screen: Screen,
  platform: string,
  text: string,
  field?: string | RegExp
) {
  // Android types key events into the focus through the device keyboard
  // (agent-device's typing needs its own IME, see android.ts).
  if (platform === 'android') return typeIntoFocus(text);
  const box = field
    ? screen.getByRole('textbox', field)
    : screen.getByRole('textbox');
  await box.pressSequentially(text);
}

/**
 * The source swipes the toolbar between the screen points 90%,62% and
 * 10%,62% (the toolbar row on its reference devices). e2e takes no
 * percentages, so this swipes along the toolbar row, found by a toolbar
 * button, across the editor's width. `finger` is Maestro's direction.
 */
export async function swipeToolbar(screen: Screen, finger: 'left' | 'right') {
  const row = await screen
    .getByRole(
      'button',
      /^(Bold|Italic|Link|Task list|Heading|Code|Underline|Strikethrough|Quote|Ordered list|Bullet list|Indent|Outdent|Undo|Redo)$/
    )
    .first()
    .boundingBox();
  const editor = await screen.getByRole('textbox').first().boundingBox();
  if (!row || !editor) throw new Error('toolbar or editor not on screen');
  const y = row.y + row.height / 2;
  const a = { x: editor.x + editor.width * 0.9, y };
  const b = { x: editor.x + editor.width * 0.1, y };
  await screen.swipe(
    finger === 'left' ? { from: a, to: b } : { from: b, to: a }
  );
}
