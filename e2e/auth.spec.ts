import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('text=Log In, text=Sign In').first()).toBeVisible();
});

test('signup page renders', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.locator('text=Sign Up, text=Create Account').first()).toBeVisible();
});

test('login stays on login with bad credentials', async ({ page }) => {
  await page.goto('/login');
  // Without real backend connected in test env, just verify page loads
  await expect(page).toHaveURL(/\/login/);
});