import { test, expect } from '@playwright/test';

test.describe('Admin Users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/admin/users');
  });

  test('page loads', async ({ page }) => {
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('text=Users')).toBeVisible();
  });
});