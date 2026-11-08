import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { users } from '../../src/data/users';

test.describe('Login', { tag: '@ui' }, () => {
  test('standard user can log in', async ({ page }) => {
    // To link this result to an existing Xray Test issue, add:
    // test.info().annotations.push({ type: 'test_key', description: 'ABJ-1' });
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.standard);
    await new InventoryPage(page).expectLoaded();
  });

  test('locked out user sees an error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.lockedOut);
    await expect(login.error).toContainText('Sorry, this user has been locked out');
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('empty credentials are rejected', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginButton.click();
    await expect(login.error).toContainText('Username is required');
  });
});
