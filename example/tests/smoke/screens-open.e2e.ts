// Ported from .maestro/smoke/screens-open.yaml
// Every example screen without its own flow opens and renders.
import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';
import { launch, openScreen } from '../support/app.ts';

test(
  'Example screens open',
  { tags: ['smoke'], timeout: 600_000 },
  async ({ app, screen }) => {
    await launch(app, screen);
    for (const name of [
      'Basic',
      'Custom CSS',
      'Configure Extensions',
      'Dark Editor',
      'EditorStickToKeyboardExample',
      'NavigationHeader',
      'CustomAndStaticToolbar',
      'Advanced',
    ]) {
      await openScreen(app, screen, name);
    }
    // The custom web bundle booted: CounterBridge state reached native.
    await expect(
      screen.getByText(/^[1-9][0-9]* \|\| [1-9][0-9]*$/)
    ).toBeVisible({ timeout: 15_000 });
    await openScreen(app, screen, 'Keyboard: Color');
  }
);
