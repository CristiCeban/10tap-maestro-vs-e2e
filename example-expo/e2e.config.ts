import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

// Ported from .maestro/config.yaml (smoke/*, keyboard/*, repro/*) and the
// flows' `appId: dev.tenplay.tentapexampleexpo`. The flows run against an
// installed development build on a Metro bundle (`METRO_URL`, default
// http://localhost:8081; Android reaches it through `adb reverse`).
const bundleId = 'dev.tenplay.tentapexampleexpo';
export const METRO_URL = process.env.METRO_URL ?? 'http://localhost:8081';
const port = new URL(METRO_URL).port || '8081';

// Metro serves the development build (skill: the one process that serves
// the app becomes `app.command`); an already running Metro is reused.
const metro = {
  command: {
    executable: 'npx',
    args: ['expo', 'start', '--dev-client', '--port', port],
    reuseExisting: true,
    startupTimeout: 120_000,
    log: '.e2e/logs/metro.log',
  },
  readyUrl: `${METRO_URL}/status`,
};

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: process.env.E2E_IOS_DEVICE }),
      app: { bundleId, ...metro },
    },
    {
      name: 'android',
      engine: mobile({
        platform: 'android',
        device: process.env.E2E_ANDROID_DEVICE,
      }),
      app: { bundleId, ...metro },
    },
  ],
  workers: 1,
  reporters: ['list', 'junit'],
} satisfies E2EConfig;
