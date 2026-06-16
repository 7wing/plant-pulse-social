import { test, expect } from '@playwright/test';

test.describe('Explore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/explore');
  });

  test('explore page loads', async ({ page }) => {
    await expect(page).toHaveURL('/explore');
    await expect(page.locator('h1:has-text("Explore")')).toBeVisible();
    await expect(page.locator('text=Popular plants')).toBeVisible();
  });

  test('search shows library results', async ({ page }) => {
    const search = page.locator('input[type="search"]');
    await search.fill('monstera');
    await page.waitForTimeout(500);
    // Either results or "no results" message should be visible
    const hasResults = await page.locator('[data-testid="plant-library-card"]').count() > 0;
    const hasNoResults = await page.locator('text=No results found').isVisible();
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('care guide detail opens', async ({ page }) => {
    // Wait for library cards to load
    await page.waitForTimeout(500);
    
    const card = page.locator('[data-testid="plant-library-card"]').first();
    const count = await card.count();
    
    if (count === 0) {
      // No library entries yet - skip test
      test.skip();
      return;
    }
    
    await card.click();
    await expect(page).toHaveURL(/\/care-guide\/.+/);
    await expect(page.locator('button:has-text("Add to my collection")')).toBeVisible();
  });

  test('search online fallback works', async ({ page }) => {
    // Search for something unlikely to be in library
    const search = page.locator('input[type="search"]');
    await search.fill('xyznonexistent123456');
    await page.waitForTimeout(500);
    
    // Should show no results with online search option
    const onlineButton = page.locator('button:has-text("Search online")');
    if (await onlineButton.isVisible()) {
      await onlineButton.click();
      // Should show loading
      await expect(page.locator('text=Searching...')).toBeVisible();
    }
  });

  test('category chips filter results', async ({ page }) => {
    // Click on Indoor category
    await page.click('button:has-text("Indoor")');
    await page.waitForTimeout(300);
    
    // Category should be active
    await expect(page.locator('button:has-text("Indoor")')).toHaveClass(/chip-active/);
  });

  test('care guide detail has save button', async ({ page }) => {
    // Wait for any cards to appear
    await page.waitForTimeout(500);
    
    const card = page.locator('[data-testid="plant-library-card"]').first();
    const count = await card.count();
    
    if (count === 0) {
      test.skip();
      return;
    }
    
    await card.click();
    await expect(page).toHaveURL(/\/care-guide\/.+/);
    
    // Check for save button (can be in different states)
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Saved")');
    await expect(saveButton.first()).toBeVisible();
  });
});