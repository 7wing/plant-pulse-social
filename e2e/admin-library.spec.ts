import { test, expect } from '@playwright/test';

test.describe('Admin Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/admin/library');
  });

  test('page loads', async ({ page }) => {
    await expect(page).toHaveURL('/admin/library');
    await expect(page.locator('h1:has-text("Library")')).toBeVisible();
  });

  test('displays source filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Curated' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'API Fallback' })).toBeVisible();
  });

  test('has search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by species"]');
    await expect(searchInput).toBeVisible();
  });

  test('displays table headers', async ({ page }) => {
    await expect(page.locator('th:has-text("Species")')).toBeVisible();
    await expect(page.locator('th:has-text("Common Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Source")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('filter buttons work', async ({ page }) => {
    // Click Curated filter
    await page.getByRole('button', { name: 'Curated' }).click();
    await expect(page.getByRole('button', { name: 'Curated' })).toHaveClass(/bg-/);
    
    // Click API Fallback filter
    await page.getByRole('button', { name: 'API Fallback' }).click();
    await expect(page.getByRole('button', { name: 'API Fallback' })).toHaveClass(/bg-/);
    
    // Click All filter
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByRole('button', { name: 'All' })).toHaveClass(/bg-/);
  });

  test('search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by species"]');
    
    // Type in search
    await searchInput.fill('Monstera');
    
    // Wait for filter to apply
    await page.waitForTimeout(300);
    
    // Search should still have the value
    await expect(searchInput).toHaveValue('Monstera');
  });

  test('shows empty state when no results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by species"]');
    
    // Search for something unlikely to exist
    await searchInput.fill('xyznonexistent123');
    await page.waitForTimeout(300);
    
    // Should show empty state
    const tableBody = page.locator('tbody');
    await expect(tableBody.locator('tr')).toHaveCount(1);
    await expect(page.locator('td[colspan="8"]')).toBeVisible();
  });
});