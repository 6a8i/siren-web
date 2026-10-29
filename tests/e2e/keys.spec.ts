import { expect, test } from '@playwright/test';

import { ADMIN_STATE, ENV_READONLY_KEYS } from './harness/config';

test.use({ storageState: ADMIN_STATE });

test('the API keys page creates a read-only key and shows the chip', async ({ page }) => {
    test.skip(process.env[ENV_READONLY_KEYS] !== '1', 'the server does not list IsReadOnly on API keys yet');

    await page.goto('/web/#/dashboard/keys');
    await expect(page.getByRole('heading', { name: 'API Keys', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'New API Key' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'New API Key' })).toBeVisible();
    await dialog.getByLabel('App name').fill('e2e read-only');
    await dialog.getByRole('checkbox', { name: 'Read only' }).check();
    await dialog.getByRole('button', { name: 'Create' }).click();

    const row = page.getByRole('row').filter({ hasText: 'e2e read-only' });
    await expect(row).toBeVisible();
    await expect(row.getByText('Read only', { exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Allow changes with this key' })).toBeVisible();
});
