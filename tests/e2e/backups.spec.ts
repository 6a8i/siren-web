import { expect, test } from '@playwright/test';

import { ADMIN_STATE } from './harness/config';

test.use({ storageState: ADMIN_STATE });

test('the backups page renders its list (empty on a fresh server)', async ({ page }) => {
    await page.goto('/web/#/dashboard/backups');

    await expect(page.getByRole('heading', { name: 'Backups', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Backup' })).toBeVisible();
    // A fresh server has no archive yet; the page says so instead of showing nothing.
    await expect(page.getByText('No backups available')).toBeVisible();
});
