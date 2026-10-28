import { expect, type Page } from '@playwright/test';

/**
 * Signs in through the login page's manual form. The page lists the public users behind a
 * "Manual Login" button, or opens the form straight away when the server lists none; the helper
 * waits for the controller to decide and handles both.
 */
export async function login(page: Page, name: string, password = ''): Promise<void> {
    await page.goto('/');

    const loginPage = page.locator('#loginPage');
    await expect(loginPage.locator('.manualLoginForm:not(.hide), #divUsers .card').first()).toBeVisible();

    const manualLogin = page.getByRole('button', { name: 'Manual Login' });
    if (await manualLogin.isVisible()) {
        await manualLogin.click();
    }

    const userField = page.getByLabel('User', { exact: true });
    await expect(userField).toBeVisible();
    await userField.fill(name);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
}

/** The home page: the route plus its page element, since the route changes before the view mounts. */
export async function expectHome(page: Page): Promise<void> {
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('#indexPage')).toBeVisible();
}
