import { defineConfig, devices } from '@playwright/test';

import { BASE_URL } from './tests/e2e/harness/config';

/**
 * End-to-end suite against a throwaway Siren server (see tests/e2e/global-setup.ts and
 * docs/e2e.md). Chromium only; the server's authentication rate limit (ten a minute per address)
 * is why the files run one at a time and the administrator signs in once, in the setup project.
 */
export default defineConfig({
    testDir: 'tests/e2e',
    globalSetup: './tests/e2e/global-setup.ts',
    globalTeardown: './tests/e2e/global-teardown.ts',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    forbidOnly: !!process.env.CI,
    timeout: 60_000,
    expect: {
        timeout: 15_000
    },
    // No HTML report unless asked for: E2E_REPORT=html npm run test:e2e
    reporter: process.env.E2E_REPORT === 'html' ? [ [ 'list' ], [ 'html', { open: 'never' } ] ] : 'list',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        locale: 'en-US'
    },
    projects: [
        {
            name: 'setup',
            testMatch: '**/*.setup.ts',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'chromium',
            testMatch: '**/*.spec.ts',
            dependencies: [ 'setup' ],
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
