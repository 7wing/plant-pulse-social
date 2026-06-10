import { test, expect } from '@playwright/test';

test('My Plants page renders', async ({ page }) => {
  await page.goto('/my-plants');
  await expect(page.locator('text=My Plants')).toBeVisible();
});

test('Explore page has scan banner', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.locator('text=Identify Any Plant')).toBeVisible();
});