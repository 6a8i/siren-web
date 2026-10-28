import { expect, test } from '@playwright/test';

import { ADMIN_STATE, FAMILY } from './harness/config';

test.use({ storageState: ADMIN_STATE });

test('the dashboard Families page lists the family', async ({ page }) => {
    await page.goto('/web/#/dashboard/families');

    await expect(page.getByRole('heading', { name: 'Families', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: FAMILY.name, exact: true })).toBeVisible();
    await expect(page.getByText(/^2 of \d+ profiles$/)).toBeVisible();
});
