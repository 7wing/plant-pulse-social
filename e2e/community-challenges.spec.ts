import { test, expect } from '@playwright/test';

test.describe('Community Challenges', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to community page
    await page.goto('/community');
    await expect(page).toHaveURL('/community');
  });

  test('community page loads with challenges section', async ({ page }) => {
    // Header should be visible
    await expect(page.locator('h1:has-text("Community")')).toBeVisible();
    
    // Search bar should be visible
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Feed tabs should be visible
    await expect(page.getByRole('button', { name: 'For You' })).toBeVisible();
    
    // "This week" section should be visible on mobile
    await expect(page.getByText('This week')).toBeVisible();
    
    // "Propose" button should be visible
    await expect(page.getByRole('button', { name: /Propose/i })).toBeVisible();
  });

  test('can view challenge detail by clicking', async ({ page }) => {
    // Wait for challenges to load
    await page.waitForTimeout(1000);
    
    // Check if there are any challenge cards
    const challengeCards = page.locator('button:has-text("Join"), button:has-text("RSVP")');
    const count = await challengeCards.count();
    
    if (count > 0) {
      // Click on a challenge card (not the button itself)
      await page.locator('[class*="rounded-xl"][class*="shadow-card"]').first().click();
      
      // Detail sheet should open
      await expect(page.locator('h2:has-text("Repotting Day"), h2:has-text("Plant Swap"), [role="dialog"], [class*="sheet"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can propose a challenge', async ({ page }) => {
    // Click Propose button
    await page.click('button:has-text("Propose")');
    
    // Propose sheet should open
    await expect(page.getByText('Propose a Challenge or Event')).toBeVisible({ timeout: 5000 });
    
    // Fill in the form
    await page.fill('input[placeholder*="Weekend Watering"]', 'Weekend Watering');
    
    // Wait for form to be interactive
    await page.waitForTimeout(500);
    
    // Find and fill description
    const descField = page.locator('textarea').first();
    if (await descField.isVisible()) {
      await descField.fill('Water all your plants this weekend and share your progress!');
    }
    
    // Fill first date option
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill('2026-06-20');
    
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.first().fill('10:00');
    
    // Fill second date option
    await dateInputs.nth(1).fill('2026-06-21');
    await timeInputs.nth(1).fill('10:00');
    
    // Submit
    await page.click('button:has-text("Submit Proposal")');
    
    // Should show success
    await expect(page.getByText(/Proposal submitted|submitted/i)).toBeVisible({ timeout: 5000 });
  });

  test('search functionality works with tabs', async ({ page }) => {
    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('plant');
    
    // Search tabs should appear
    await expect(page.getByRole('tab', { name: 'Posts' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tags' })).toBeVisible();
    
    // Switch to Users tab
    await page.click('button:has-text("Users")');
    
    // Should show "Users matching"
    await expect(page.getByText(/Users matching/i)).toBeVisible();
    
    // Switch to Tags tab
    await page.click('button:has-text("Tags")');
    
    // Should show "Tags matching"
    await expect(page.getByText(/Tags matching/i)).toBeVisible();
  });

  test('FAB opens new post sheet', async ({ page }) => {
    // Click the FAB (floating action button)
    const fab = page.locator('button.fixed.bottom-20');
    await fab.click();
    
    // New post sheet should open
    await expect(page.getByText('New Post')).toBeVisible({ timeout: 5000 });
    
    // Form fields should be visible
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('desktop layout shows sidebar', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    
    // Sidebar "This week" section should be visible
    await expect(page.locator('h2:has-text("This week")')).toBeVisible();
    
    // Trending section in sidebar should be visible
    await expect(page.locator('text=Trending').first()).toBeVisible();
  });
});

test.describe('PostCard Comments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alice@plantpal.test');
    await page.fill('input[type="password"]', 'PlantPal123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/community');
  });

  test('comment sheet shows post preview', async ({ page }) => {
    // Wait for posts to load
    await page.waitForTimeout(2000);
    
    // Look for comment button on first post
    const commentButtons = page.locator('[aria-label="Comment"]');
    const count = await commentButtons.count();
    
    if (count > 0) {
      // Click the first comment button
      await commentButtons.first().click();
      
      // Comment sheet should open
      await expect(page.getByText('Comments')).toBeVisible({ timeout: 5000 });
      
      // Post preview should be visible at top
      const sheetContent = page.locator('[class*="sheet-content"]').first();
      await expect(sheetContent.locator('img').first()).toBeVisible();
    }
  });
});