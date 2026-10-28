import { expect, test } from '@playwright/test';

import { FAMILY } from './harness/config';
import { expectHome, login } from './helpers/login';

const whoIsWatching = /Who's watching\?/;

test('family profile login lands on "Who\'s watching?" with the continue chip', async ({ page }) => {
    await login(page, FAMILY.admin.name, FAMILY.admin.pin);

    await expect(page).toHaveURL(/#\/family/);
    await expect(page.getByRole('heading', { name: whoIsWatching })).toBeVisible();
    await expect(page.getByRole('button', { name: `Continue as ${FAMILY.admin.name}` })).toBeVisible();
    await expect(page.getByRole('button', { name: FAMILY.child.name, exact: true })).toBeVisible();
});

test('switching to the PIN-less profile reloads into home', async ({ page }) => {
    await login(page, FAMILY.admin.name, FAMILY.admin.pin);
    await expect(page.getByRole('heading', { name: whoIsWatching })).toBeVisible();

    await page.getByRole('button', { name: FAMILY.child.name, exact: true }).click();

    await expectHome(page);
    // The switch reloads the page as the other profile: the selector is not shown again.
    await expect(page.getByRole('heading', { name: whoIsWatching })).toHaveCount(0);
});

test('a wrong PIN shows "Incorrect PIN."', async ({ page }) => {
    await login(page, FAMILY.child.name);
    await expect(page.getByRole('heading', { name: whoIsWatching })).toBeVisible();

    await page.getByRole('button', { name: FAMILY.admin.name, exact: true }).click();

    const prompt = page.getByRole('dialog');
    await expect(prompt.getByRole('heading', { name: `Enter the PIN for ${FAMILY.admin.name}` })).toBeVisible();
    await prompt.getByLabel('PIN', { exact: true }).fill('0000');
    await prompt.getByRole('button', { name: 'Switch profile' }).click();

    await expect(prompt.getByRole('alert')).toHaveText('Incorrect PIN.');
    await expect(page).toHaveURL(/#\/family/);
});
