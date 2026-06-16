import { test, expect } from '@playwright/test';

test.describe('Add Plant Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('opens add plant flow from FAB', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await page.click('text=Add new plant');
    await expect(page.locator('text=Scan to Identify')).toBeVisible();
    await expect(page.locator('text=Enter Manually')).toBeVisible();
  });

  test('manual entry shows confirm details', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await page.click('text=Add new plant');
    await page.click('text=Enter Manually');
    await expect(page.locator('text=Confirm Plant Details')).toBeVisible();
    await expect(page.locator('text=Care Schedule')).toBeVisible();
  });

  test('saves plant with care tasks', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await page.click('text=Add new plant');
    await page.click('text=Enter Manually');
    await page.fill('input[name="nickname"]', 'Test Plant');
    await page.fill('input[name="species"]', 'Testus plantus');
    await page.click('text=Save to collection');
    await page.waitForTimeout(2000);
  });
});
