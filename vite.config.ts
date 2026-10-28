/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [ tsconfigPaths() ],
    test: {
        coverage: {
            include: [ 'src' ]
        },
        environment: 'jsdom',
        // Unit tests live next to the code; the Playwright suite in tests/e2e has its own runner.
        include: [ 'src/**/*.{test,spec}.{js,jsx,ts,tsx}' ],
        restoreMocks: true
    }
});
