import { test, expect } from '@playwright/test';

test.describe('Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/my-plants');
  });

  test('navigates to collection page', async ({ page }) => {
    await expect(page).toHaveURL('/my-plants');
    await expect(page.locator('text=My Plants')).toBeVisible();
  });

  test('plant cards navigate to detail', async ({ page }) => {
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    test.skip(count === 0, 'No plants in collection');
    await cards.first().click();
    await expect(page).toHaveURL(/\/plant\/.+/);
  });

  test('collection has no add-plant tile', async ({ page }) => {
    await expect(page.locator('text=Add New Plant')).toHaveCount(0);
  });
});
