import { expect, test } from '@playwright/test';

import { ADMIN_STATE, AUTH_RATE_LIMIT, ENV_FAMILY_ID, FAMILY, LIBRARIES } from './harness/config';

test.use({ storageState: ADMIN_STATE });

test('the dashboard Families page lists the family', async ({ page }) => {
    await page.goto('/web/#/dashboard/families');

    await expect(page.getByRole('heading', { name: 'Families', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: FAMILY.name, exact: true })).toBeVisible();
    await expect(page.getByText(/^2 of \d+ profiles$/)).toBeVisible();
});

test('a family and its first profile are created through the dialog', async ({ page }) => {
    await page.goto('/web/#/dashboard/families');
    await expect(page.getByRole('heading', { name: 'Families', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'New family' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'New family' })).toBeVisible();
    await dialog.getByLabel('Family name').fill('Souza');
    await dialog.getByLabel('First profile name').fill('mae');
    await dialog.getByLabel('PIN (optional)').fill('4321');
    await dialog.getByRole('button', { name: 'Save' }).click();

    // The page moves on to the new family, whose only profile is the administrator it was created with.
    await expect(page).toHaveURL(/#\/dashboard\/families\/[0-9a-f-]+$/i);
    await expect(page.getByRole('heading', { name: 'Souza', exact: true })).toBeVisible();
    await expect(page.getByText(/^1 of \d+ profiles$/)).toBeVisible();

    const row = page.getByRole('listitem').filter({ hasText: 'mae' });
    await expect(row.getByText('Family administrator')).toBeVisible();
    await expect(row.getByText(/PIN protected/)).toBeVisible();
});

test('the member dialog offers only the libraries the family reaches', async ({ page }) => {
    const familyId = process.env[ENV_FAMILY_ID];
    expect(familyId, 'the global setup exports the family id').toBeTruthy();

    await page.goto(`/web/#/dashboard/families/${familyId}`);
    await expect(page.getByRole('heading', { name: FAMILY.name, exact: true })).toBeVisible();

    // Restrict the family from every library to Kids only.
    const allLibraries = page.getByRole('checkbox', { name: 'All libraries' });
    await expect(allLibraries).toBeChecked();
    await allLibraries.uncheck();
    await expect(page.getByRole('checkbox', { name: LIBRARIES.movies })).toBeVisible();
    await page.getByRole('checkbox', { name: LIBRARIES.kids }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Settings saved.' })).toBeVisible();

    // The profile's own library list is capped to what the family reaches.
    const row = page.getByRole('listitem').filter({ hasText: FAMILY.child.name });
    await row.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Edit profile' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Edit profile' })).toBeVisible();
    await dialog.getByRole('checkbox', { name: "All of the family's libraries" }).uncheck();
    await expect(dialog.getByRole('checkbox', { name: LIBRARIES.kids })).toBeVisible();
    await expect(dialog.getByRole('checkbox', { name: LIBRARIES.movies })).toHaveCount(0);
});

test('the networking page offers the security settings and saves them', async ({ page }) => {
    await page.goto('/web/#/dashboard/networking');

    await expect(page.getByRole('heading', { name: 'Security', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Send security headers' })).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Content Security Policy' })).toHaveText('Report only');
    await expect(page.getByText('Report only logs violations without blocking.')).toBeVisible();
    // The global setup raised the limit from the default ten; the page reads it back from the server.
    await expect(page.getByRole('spinbutton', { name: 'Sign-in attempts per minute' })).toHaveValue(String(AUTH_RATE_LIMIT));
    await expect(page.getByText('0 disables the limit.')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Settings saved.' })).toBeVisible();
});
