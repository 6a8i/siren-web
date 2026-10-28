import { expect, test } from '@playwright/test';

import { ADMIN_STATE } from './harness/config';

test.use({ storageState: ADMIN_STATE });

test('the display settings page shows the accent colour select', async ({ page }) => {
    await page.goto('/web/#/mypreferencesdisplay');

    const accent = page.getByRole('combobox', { name: 'Accent color' });
    await expect(accent).toBeVisible();
    await expect(accent).toHaveText('Siren teal (default)');

    await accent.click();
    await expect(page.getByRole('option', { name: 'Violet' })).toBeVisible();
});
