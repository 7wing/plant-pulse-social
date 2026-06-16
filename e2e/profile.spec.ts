import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/profile');
  });

  test('own profile tabs are Posts/Saved/Badges', async ({ page }) => {
    await expect(page.locator('text=Posts')).toBeVisible();
    await expect(page.locator('text=Saved')).toBeVisible();
    await expect(page.locator('text=Badges')).toBeVisible();
  });

  test('followers count opens list', async ({ page }) => {
    await page.click('text=Followers');
    await expect(page.locator('text=Followers')).toBeVisible();
  });

  test('edit profile opens dialog', async ({ page }) => {
    await page.click('text=Edit Profile');
    await expect(page.locator('text=Edit Profile')).toBeVisible();
    await expect(page.locator('text=Username')).toBeVisible();
    await expect(page.locator('text=Interests')).toBeVisible();
  });
});
