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

test('the avatar preset dialog saves and the tile shows the image', async ({ page }) => {
    // A successful login also resets the wrong-PIN count the previous test left on the administrator.
    await login(page, FAMILY.admin.name, FAMILY.admin.pin);
    await expect(page.getByRole('heading', { name: whoIsWatching })).toBeVisible();

    await page.getByRole('button', { name: 'Manage profiles' }).click();
    await expect(page.getByRole('heading', { name: 'Manage profiles' })).toBeVisible();

    const tile = page.getByRole('button', { name: FAMILY.child.name, exact: true });
    await expect(tile.locator('img')).toHaveCount(0);
    await tile.click();
    await page.getByRole('menuitem', { name: 'Avatar' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Choose an avatar' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(tile.locator('img')).toBeVisible();
});

/** Keep this one last: it locks the administrator profile for the rest of the run. */
test('five wrong PINs lock the profile and the tile shows the locked chip', async ({ page }) => {
    await login(page, FAMILY.child.name);
    await expect(page.getByRole('heading', { name: whoIsWatching })).toBeVisible();

    const tile = page.getByRole('button', { name: FAMILY.admin.name, exact: true });
    await tile.click();

    const prompt = page.getByRole('dialog');
    const pinField = prompt.getByLabel('PIN', { exact: true });
    const submit = prompt.getByRole('button', { name: 'Switch profile' });

    for (let attempt = 1; attempt < 5; attempt++) {
        await pinField.fill('0000');
        await submit.click();
        await expect(prompt.getByRole('alert')).toHaveText('Incorrect PIN.');
    }

    await pinField.fill('0000');
    await submit.click();
    await expect(prompt.getByRole('alert')).toContainText('locked after too many wrong PIN attempts');
    await expect(submit).toBeDisabled();

    await prompt.getByRole('button', { name: 'Cancel' }).click();
    await expect(tile.getByText(/^Locked/)).toBeVisible();
});
