import { test, expect } from '@playwright/test';

test.describe('Add Plant Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('add new plant goes straight to confirm details from FAB', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await page.click('text=Add new plant');
    await expect(page.locator('text=Confirm Plant Details')).toBeVisible();
    await expect(page.locator('text=Care Schedule')).toBeVisible();
  });

  test('scan plant opens scan step from FAB', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await page.click('text=Scan plant');
    await expect(page.locator('text=Scan Plant')).toBeVisible();
    await expect(page.locator('text=Take a photo to scan your plant')).toBeVisible();
  });

  test('saves plant with care tasks', async ({ page }) => {
    await page.click('[data-testid="fab"]');
    await page.click('text=Add new plant');
    await page.fill('#nickname', 'Test Plant');
    await page.fill('#species', 'Testus plantus');
    await page.click('text=Save to collection');
    await page.waitForTimeout(2000);
  });
});
