import { test, expect } from '@playwright/test';

test.describe('Completed Tasks Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('completed tasks show toggle button', async ({ page }) => {
    // Scroll to completed section if needed
    const showAllBtn = page.locator('text=/Show all/');
    await expect(showAllBtn).toBeVisible();
  });

  test('clicking show all expands completed tasks', async ({ page }) => {
    const showAllBtn = page.locator('text=/Show all/');
    await showAllBtn.click();
    await expect(page.locator('text=Hide completed')).toBeVisible();
  });
});
