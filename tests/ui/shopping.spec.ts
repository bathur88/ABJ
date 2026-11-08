import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { users } from '../../src/data/users';

test.describe('Shopping', { tag: '@ui' }, () => {
  let inventory: InventoryPage;

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.standard);
    inventory = new InventoryPage(page);
    await inventory.expectLoaded();
  });

  test('products can be sorted by price, low to high', async () => {
    await inventory.sortBy('lohi');
    const prices = await inventory.priceValues();
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('adding items updates the cart badge', async () => {
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.addToCart('sauce-labs-bike-light');
    await expect(inventory.cartBadge).toHaveText('2');
  });

  test('user can complete a checkout', async ({ page }) => {
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.openCart();
    const checkout = new CheckoutPage(page);
    await checkout.startFromCart();
    await checkout.fillDetails('Ada', 'Lovelace', 'SW1A 1AA');
    await checkout.finish();
    await checkout.expectComplete();
  });
});
