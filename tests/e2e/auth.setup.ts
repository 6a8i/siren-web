import { test as setup } from '@playwright/test';

import { ADMIN, ADMIN_STATE } from './harness/config';
import { expectHome, login } from './helpers/login';

/**
 * The administrator's login is a test of its own and the source of the signed-in state the
 * dashboard and settings specs start from, so the server sees one administrator login per run.
 */
setup('admin login lands on home', async ({ page }) => {
    await login(page, ADMIN.name, ADMIN.password);
    await expectHome(page);

    await page.context().storageState({ path: ADMIN_STATE });
});
