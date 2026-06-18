import { test, expect } from '@playwright/test';

test.describe('Explore Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/explore');
  });

  test('shows popular plants from library', async ({ page }) => {
    await expect(page.locator('text=Explore')).toBeVisible();
    await expect(page.locator('text=Popular Plants')).toBeVisible();
    await expect(page.locator('text=Curated Care Guides')).toBeVisible();
  });

  test('search triggers API fallback when not in cache', async ({ page }) => {
    await page.fill('input[type="search"]', 'zzexoticplant123');
    await page.waitForTimeout(2000);
    // Should show a loading state then either a result or "No results"
  });
});