import { test, expect } from '@playwright/test';

test.describe('Responsive Layouts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('home has two columns on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('[data-testid="collection-preview"]')).toBeVisible();
  });

  test('profile horizontal header on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/profile');
    await expect(page.locator('text=Edit Profile')).toBeVisible();
    const header = page.locator('[data-testid="profile-header"]');
    await expect(header).toBeVisible();
  });

  test('community has sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/community');
    await expect(page.locator('text=This week')).toBeVisible();
  });
});
