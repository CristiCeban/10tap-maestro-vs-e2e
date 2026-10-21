// Shared steps ported from .maestro/subflows/launch.yaml and open-screen.yaml,
// plus the selectors most flows share.
import type { App, Locator, Screen } from 'e2e';
import type { Device } from '@e2e-dev/mobile';
import { androidScreenSize } from './android.ts';
import { expect } from 'e2e';

export const HOME_TITLE = '10Tap Rich Text Editor!';

/**
 * Ported from subflows/launch.yaml: launches the app, clearing its state unless
 * `clearState` is false, and waits for the home screen. The source retries the
 * launch twice (a slow Android emulator can kill the new process while it
 * removes the previous task, which leaves a blank window); so does this.
 */
export async function launch(
  app: App,
  screen: Screen,
  { clearState = true } = {}
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (clearState) await app.clearState();
      else await app.open();
      await expect(screen.getByText(HOME_TITLE)).toBeVisible({
        timeout: 60_000,
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** `scrollUntilVisible` + `tapOn` on a home-screen entry, as every flow opens its screen. */
export async function openEntry(screen: Screen, name: string) {
  const entry = screen.getByRole('button', name);
  await screen.scrollUntilVisible(entry, { timeout: 60_000 });
  await entry.tap();
}

/**
 * Ported from subflows/open-screen.yaml: opens the example screen `name` from
 * a fresh launch and checks that it rendered without a render error.
 */
export async function openScreen(app: App, screen: Screen, name: string) {
  await launch(app, screen, { clearState: false });
  await openEntry(screen, name);
  // The tap is lost if it lands during a transition; wait for the push.
  await expect(screen.getByText(HOME_TITLE)).toBeHidden({ timeout: 15_000 });
  await expect(screen.getByText('Render Error')).toBeHidden();
  await expect(screen.getByText(/isn.t ready yet/i)).toBeHidden();
  await app.screenshot(name);
}

/** The `editor-status` probe line (EditorProbe.tsx). */
export const editorStatus = (screen: Screen) =>
  screen.getByTestId('editor-status');
/** The `editor-html` probe text, filled by `read-editor-state`. */
export const editorHtml = (screen: Screen) => screen.getByTestId('editor-html');

/** Taps `read-editor-state` and waits until `editor-html` matches `pattern`. */
export async function expectHtml(
  screen: Screen,
  pattern: RegExp,
  timeout?: number
) {
  await screen.getByTestId('read-editor-state').tap();
  await expect(editorHtml(screen)).toHaveText(
    pattern,
    timeout ? { timeout } : undefined
  );
}

/**
 * Maestro `inputText` types into whatever has focus. e2e types through a
 * locator, so this types into the editor's contenteditable, which the
 * WebView exposes as the one text field under the RichText's testID.
 */
export async function typeInEditor(
  screen: Screen,
  editorTestId: string,
  text: string
) {
  await screen
    .getByTestId(editorTestId)
    .getByRole('textbox')
    .pressSequentially(text);
}

/**
 * The opening every keyboard flow shares: open a keyboard example screen and
 * tap its editor (`keyboard-example-editor`). On a cold start the keyboard can
 * begin rising after that tap returns, and the switcher rides up with it; the
 * source waits 2.5 s on an element that never shows
 * ("keyboard-settle-never-shown") so the switcher tap is not aimed at where it
 * was. e2e needs this too (a plain port tapped the switcher mid-rise), so
 * `waitForKeyboardRide` waits for the state instead: the switcher has moved up
 * and stopped, or 2.5 s passed as in the source.
 */
export async function openKeyboardScreen(
  app: App,
  screen: Screen,
  entry: string
) {
  await launch(app, screen);
  await openEntry(screen, entry);
  await tapEditorAndWaitForKeyboard(screen);
}

export async function tapEditorAndWaitForKeyboard(screen: Screen) {
  const switcher = screen.getByTestId('toggle-color-keyboard');
  const before = (await switcher.boundingBox())?.y;
  await screen.getByTestId('keyboard-example-editor').tap();
  await waitForKeyboardRide(switcher, before);
}

export async function waitForKeyboardRide(
  switcher: Locator,
  before: number | undefined,
  budgetMs = 2_500
) {
  const deadline = Date.now() + budgetMs;
  let last = before;
  while (Date.now() < deadline) {
    const y = (await switcher.boundingBox())?.y;
    if (before !== undefined && y !== undefined && y < before && y === last)
      return;
    last = y;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

export const EDITOR = 'keyboard-example-editor';

/**
 * The toolbar's link bar: `tapOn: Link`, `inputText: <url>` (the bar's input
 * autofocuses), `tapOn: Insert`.
 */
export async function insertLink(screen: Screen, url: string) {
  await (await toolbarButton(screen, 'Link')).tap();
  await screen.getByPlaceholder('Type your URL here...').pressSequentially(url);
  await screen.getByText('Insert').tap();
}

/**
 * A default-Toolbar button by its accessibility label. The E2E probe row has
 * its own "Bold" and "Undo" buttons above the toolbar (Maestro: `index: 1`),
 * so the toolbar's is the last match. The toolbar scrolls sideways: like the
 * iOS flow's `repeat: while: notVisible` + `swipe: from: <a toolbar item>`,
 * this swipes the toolbar row until the button shows.
 */
export async function toolbarButton(screen: Screen, label: string) {
  const button = screen.getByRole('button', label).last();
  for (const direction of ['left', 'right'] as const) {
    for (let i = 0; i < 4 && !(await button.isVisible()); i++) {
      await swipeToolbar(screen, direction);
    }
  }
  return button;
}

/** Swipes the toolbar row (finger direction, as Maestro names it). */
export async function swipeToolbar(screen: Screen, finger: 'left' | 'right') {
  const row = await screen
    .getByRole(
      'button',
      /^(Italic|Heading|Quote|Ordered list|Bullet list|Indent|Outdent|Redo|Code|Underline|Strikethrough|Task list|Link)$/
    )
    .first()
    .boundingBox();
  const editor = await screen
    .getByTestId(/-editor$/)
    .first()
    .boundingBox();
  if (!row || !editor) throw new Error('toolbar or editor not on screen');
  const y = row.y + row.height / 2;
  const left = editor.x + editor.width * 0.1;
  const right = editor.x + editor.width * 0.9;
  await screen.swipe(
    finger === 'left'
      ? { from: { x: right, y }, to: { x: left, y }, duration: 600 }
      : { from: { x: left, y }, to: { x: right, y }, duration: 600 }
  );
}

/**
 * The source's "wait 2 s (an element that never shows), then wait up to 5 s
 * for `keyboard:up`": the keyboard may hide for a moment first, so this waits
 * until the status reads `keyboard:up` and keeps reading it for `holdMs`.
 */
export async function expectKeyboardBackUp(
  screen: Screen,
  holdMs = 1_000,
  timeout = 7_000
) {
  let upSince: number | undefined;
  await expect
    .poll(
      async () => {
        const up = /keyboard:up$/.test(
          (await editorStatus(screen).textContent()) ?? ''
        );
        if (!up) upSince = undefined;
        else upSince ??= Date.now();
        return upSince !== undefined && Date.now() - upSince >= holdMs;
      },
      { timeout, interval: 200 }
    )
    .toBe(true);
}

/**
 * Maestro's `tapOn: { point: 'x%,y%' }`. `screen.tapAt` takes viewport
 * points and e2e has no viewport-size read: on Android the size is the
 * screen's (`adb shell wm size`; agent-device points are physical pixels
 * there), on iOS the application node's box.
 */
export async function tapAtPercent(
  screen: Screen,
  device: Device,
  platform: string,
  xPct: number,
  yPct: number
) {
  const box =
    platform === 'android'
      ? await androidScreenSize()
      : await device.locator('role=application').boundingBox();
  if (!box) throw new Error('no screen size');
  await screen.tapAt({
    x: box.x + (box.width * xPct) / 100,
    y: box.y + (box.height * yPct) / 100,
  });
}
