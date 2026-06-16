import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/settings');
  });

  test('all sections are accessible', async ({ page }) => {
    // Account section is visible by default
    await expect(page.locator('text=Account')).toBeVisible();
    await expect(page.locator('text=Display Name')).toBeVisible();
    await expect(page.locator('text=Username')).toBeVisible();
    await expect(page.locator('text=Bio')).toBeVisible();
    await expect(page.locator('text=Location')).toBeVisible();
    await expect(page.locator('text=Interests')).toBeVisible();
  });

  test('privacy section toggles show location', async ({ page }) => {
    // Click Privacy tab (mobile) / section
    const privacyBtn = page.locator('button', { hasText: 'Privacy' });
    await privacyBtn.first().click();
    await expect(page.locator('text=Show location on profile')).toBeVisible();
  });

  test('notifications section shows toggles', async ({ page }) => {
    const notificationsBtn = page.locator('button', { hasText: 'Notifications' });
    await notificationsBtn.first().click();
    await expect(page.locator('text=Care reminders')).toBeVisible();
    await expect(page.locator('text=Social')).toBeVisible();
    await expect(page.locator('text=Challenges')).toBeVisible();
  });

  test('account actions shows logout and delete', async ({ page }) => {
    const actionsBtn = page.locator('button', { hasText: 'Account actions' });
    await actionsBtn.first().click();
    await expect(page.locator('text=Sign Out')).toBeVisible();
    await expect(page.locator('text=Delete Account')).toBeVisible();
  });

  test('delete account shows confirmation dialog', async ({ page }) => {
    const actionsBtn = page.locator('button', { hasText: 'Account actions' });
    await actionsBtn.first().click();
    await page.locator('text=Delete Account').click();
    await expect(page.locator('text=Delete your account')).toBeVisible();
    await expect(page.locator('text=Cancel')).toBeVisible();
    // Confirm button present
    const confirmBtn = page.getByRole('button', { name: 'Delete Account' });
    await expect(confirmBtn).toBeVisible();
  });
});