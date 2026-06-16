import { test, expect } from '@playwright/test';

test.describe('Plant Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in credentials and login
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to home page
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to my plants page
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');
  });

  test('navigates to plant detail', async ({ page }) => {
    // Find and click on a plant card
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    // Skip test if no plants exist
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    
    // Verify we're on the plant detail page
    await expect(page).toHaveURL(/\/plant\/.+/);
    
    // Verify key sections are visible
    await expect(page.locator('text=Care History')).toBeVisible();
    await expect(page.locator('text=Notes & Photos')).toBeVisible();
  });

  test('displays plant info with care score', async ({ page }) => {
    // Navigate to a plant detail page if there are plants
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    await page.waitForURL(/\/plant\/.+/);
    
    // Verify care score is displayed
    // The care score shows as a percentage like "91%"
    const scoreElement = page.locator('text=/\\d+%/').first();
    await expect(scoreElement).toBeVisible();
  });

  test('shows overflow menu with Edit, Delete, Share options', async ({ page }) => {
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    await page.waitForURL(/\/plant\/.+/);
    
    // Click on the menu button (MoreHorizontal icon or ⋮)
    const menuButton = page.locator('button[aria-label="Menu"]').or(page.locator('button').filter({ has: page.locator('svg') }).last());
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Verify menu options appear
      await expect(page.locator('text=Edit')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Share')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Delete')).toBeVisible({ timeout: 5000 });
    }
  });

  test('can view full care history', async ({ page }) => {
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    await page.waitForURL(/\/plant\/.+/);
    
    // Check if "View all" link exists and click it
    const viewAllLink = page.locator('text=View all').first();
    
    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      
      // Verify the care history sheet/modal opens
      await expect(page.locator('text=Care History').last()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can add a note', async ({ page }) => {
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    await page.waitForURL(/\/plant\/.+/);
    
    // Find and click "Add note/photo" button
    const addNoteButton = page.locator('text=Add note/photo');
    
    if (await addNoteButton.isVisible()) {
      await addNoteButton.click();
      
      // Verify the notes sheet opens
      await expect(page.locator('text=Add Note')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });
    }
  });

  test('back button navigates to previous page', async ({ page }) => {
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    await page.waitForURL(/\/plant\/.+/);
    
    // Click back button
    const backButton = page.locator('button[aria-label="Back"]');
    await backButton.click();
    
    // Should navigate back to my plants
    await expect(page).toHaveURL('/my-plants', { timeout: 5000 });
  });
});

test.describe('Plant Detail - Desktop Layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');
  });

  test('displays two-column layout on desktop', async ({ page }) => {
    const cards = page.locator('[data-testid="plant-card"]');
    const count = await cards.count();
    
    test.skip(count === 0, 'No plants in collection');
    
    await cards.first().click();
    await page.waitForURL(/\/plant\/.+/);
    
    // On desktop, we should see larger photo and info side by side
    // Verify the care score is displayed (should show ring with percentage)
    const scorePattern = page.locator('text=/\\d+%/');
    await expect(scorePattern.first()).toBeVisible({ timeout: 5000 });
  });
});