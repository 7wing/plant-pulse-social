import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('bottom nav has Home/Explore/Community/Profile', async ({ page }) => {
    await expect(page.locator('nav')).toContainText('Home');
    await expect(page.locator('nav')).toContainText('Explore');
    await expect(page.locator('nav')).toContainText('Community');
    await expect(page.locator('nav')).toContainText('Profile');
  });

  test('FAB has correct actions', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await expect(page.locator('text=Add care task')).toBeVisible();
    await expect(page.locator('text=Scan plant')).toBeVisible();
    await expect(page.locator('text=Add new plant')).toBeVisible();
    await expect(page.locator('text=New post')).toBeVisible();
  });
});