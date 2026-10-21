import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

// Ported from .maestro/config.yaml (smoke/*, repro/*, keyboard/*) and the
// flows' `appId: ${APP_ID || 'dev.tenplay.tentapexample'}`. Android and iOS
// share the app id; set APP_ID to drive another build. Build and install the
// Release app first (`yarn example build:ios:release`,
// `yarn example build:android:release`), as the Maestro flows expect.
const bundleId = process.env.APP_ID ?? 'dev.tenplay.tentapexample';

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: process.env.E2E_IOS_DEVICE }),
      app: { bundleId },
    },
    {
      name: 'android',
      engine: mobile({
        platform: 'android',
        device: process.env.E2E_ANDROID_DEVICE,
      }),
      app: { bundleId },
    },
  ],
  workers: 1,
  reporters: ['list', 'junit'],
} satisfies E2EConfig;
