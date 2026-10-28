import { expect, test } from '@playwright/test';

import { ADMIN_STATE, FAMILY } from './harness/config';

test.use({ storageState: ADMIN_STATE });

test('the dashboard Families page lists the family', async ({ page }) => {
    await page.goto('/web/#/dashboard/families');

    await expect(page.getByRole('heading', { name: 'Families', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: FAMILY.name, exact: true })).toBeVisible();
    await expect(page.getByText(/^2 of \d+ profiles$/)).toBeVisible();
});

test('the networking page offers the security settings and saves them', async ({ page }) => {
    await page.goto('/web/#/dashboard/networking');

    await expect(page.getByRole('heading', { name: 'Security', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Send security headers' })).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Content Security Policy' })).toHaveText('Report only');
    await expect(page.getByText('Report only logs violations without blocking.')).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Sign-in attempts per minute' })).toHaveValue('10');
    await expect(page.getByText('0 disables the limit.')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Settings saved.' })).toBeVisible();
});
