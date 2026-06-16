import { test, expect } from '@playwright/test';

test.describe('Critical User Flow', () => {
  test('full journey', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 2. Add plant
    await page.click('[data-testid="fab"]');
    await page.click('text=Add new plant');
    await page.click('text=Enter Manually');
    await page.fill('input[name="nickname"]', 'Test Flow Plant');
    await page.fill('input[name="species"]', 'Testus Flowus');
    await page.click('text=Save to collection');
    // Wait for navigation to plant detail
    await page.waitForTimeout(2000);

    // 3. Create care task
    await page.goto('/');
    await page.click('[data-testid="fab"]');
    await page.click('text=Add care task');
    await page.fill('input[name="task_name"]', 'Water Test Flow Plant');
    await page.click('text=Save');
    await page.waitForTimeout(1000);

    // 4. Explore search
    await page.goto('/explore');
    await expect(page).toHaveURL('/explore');
    await page.fill('input[placeholder*="Search"]', 'monstera');
    await page.waitForTimeout(500);

    // 5. Join challenge
    await page.goto('/community');
    await expect(page.locator('text=This week')).toBeVisible();
    // If challenges exist, try joining
    const joinButton = page.locator('text=Join').first();
    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click();
    }

    // 6. View notifications
    await page.goto('/notifications');
    await expect(page).toHaveURL('/notifications');
    await expect(page.locator('text=Notifications')).toBeVisible();

    // 7. Admin check
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    // Verify stats cards exist
    await expect(page.locator('text=Pending proposals')).toBeVisible();
    await expect(page.locator('text=Open reports')).toBeVisible();
    await expect(page.locator('text=Total users')).toBeVisible();
  });
});