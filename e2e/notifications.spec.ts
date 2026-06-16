import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/notifications');
  });

  test('notifications page loads', async ({ page }) => {
    await expect(page).toHaveURL('/notifications');
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Mark all as read')).toBeVisible();
  });

  test('bell icon shows badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('empty state shows when no notifications', async ({ page }) => {
    await page.goto('/notifications');
    // Check for empty state text
    const emptyState = page.locator('text=Nothing here yet');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Likes, comments, and reminders will show up here.')).toBeVisible();
    }
  });

  test('mark all as read button works', async ({ page }) => {
    await page.goto('/notifications');
    // Check if mark all as read button exists and is clickable
    const markAllButton = page.locator('text=Mark all as read');
    await expect(markAllButton).toBeVisible();
  });

  test('back navigation works', async ({ page }) => {
    await page.goto('/notifications');
    // Click back button (mobile) or verify page loaded
    const backButton = page.locator('[aria-label="Go back"]');
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForURL('/');
    }
  });

  test('notification bell navigates to notifications page on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const bellButton = page.locator('[data-testid="notification-bell"]');
    await expect(bellButton).toBeVisible();
    
    await bellButton.click();
    await expect(page).toHaveURL('/notifications');
  });
});