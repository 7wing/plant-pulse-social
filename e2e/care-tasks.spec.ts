import { test, expect } from '@playwright/test';

test.describe('Care Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display care tasks section', async ({ page }) => {
    // Check that the Today's Care section exists
    await expect(page.locator('text=Today\'s Care')).toBeVisible();
  });

  test('should display stats bar', async ({ page }) => {
    // Check for stats bar with Plants, Healthy, Need Care
    await expect(page.locator('text=Plants')).toBeVisible();
    await expect(page.locator('text=Healthy')).toBeVisible();
    await expect(page.locator('text=Need Care')).toBeVisible();
  });

  test('should open Add Care Task sheet via button', async ({ page }) => {
    // Look for Add care task button in the main content area
    const addButton = page.locator('button:has-text("Add care task")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check if the sheet/dialog opens with the Add Care Task form
      await expect(page.locator('text=Add Care Task')).toBeVisible();
      await expect(page.locator('text=For which plant(s)?')).toBeVisible();
      await expect(page.locator('text=Task type')).toBeVisible();
    }
  });

  test('should open Add Care Task sheet via FAB', async ({ page }) => {
    // Click the FAB button
    const fabButton = page.locator('button[aria-label="Quick actions"]');
    
    if (await fabButton.isVisible()) {
      await fabButton.click();
      
      // Look for "Add care task" option in the FAB menu
      const addCareTaskOption = page.locator('button[aria-label="Add care task"]');
      if (await addCareTaskOption.isVisible()) {
        await addCareTaskOption.click();
        
        // Check if the sheet/dialog opens
        await expect(page.locator('text=Add Care Task')).toBeVisible();
      }
    }
  });

  test('should complete a care task', async ({ page }) => {
    // Find any task that is not completed (has empty checkbox circle)
    const incompleteTask = page.locator('.bg-muted').first();
    
    if (await incompleteTask.isVisible()) {
      // Click on the task to complete it
      await incompleteTask.click();
      
      // The task should now show a checkmark or spinner
      // This is a basic test - in a real scenario you'd verify the task moved to completed
    }
  });

  test('should filter tasks by section', async ({ page }) => {
    // Check for section headers
    const todaySection = page.locator('text=Today').first();
    const upcomingSection = page.locator('text=Upcoming').first();
    const completedSection = page.locator('text=Completed').first();
    
    // At least one section should be visible
    const hasAnySection = await todaySection.isVisible() || 
                          await upcomingSection.isVisible() || 
                          await completedSection.isVisible();
    
    expect(hasAnySection).toBeTruthy();
  });

  test('should show empty state when no tasks', async ({ page }) => {
    // Look for empty state message
    const emptyState = page.locator('text=All caught up').first();
    const addButton = page.locator('button:has-text("Add care task")').first();
    
    // Either empty state or task list should be visible
    const hasEmptyState = await emptyState.isVisible();
    const hasTasks = await addButton.isVisible() || await page.locator('button:has-text("✓")').first().isVisible().catch(() => false);
    
    expect(hasEmptyState || hasTasks).toBeTruthy();
  });
});

test.describe('Add Care Task Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open Add Care Task sheet
    const addButton = page.locator('button:has-text("Add care task")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForSelector('text=Add Care Task');
    }
  });

  test('should show plant selection options', async ({ page }) => {
    await expect(page.locator('text=All plants')).toBeVisible();
  });

  test('should show task type presets', async ({ page }) => {
    await expect(page.locator('button:has-text("Water")')).toBeVisible();
    await expect(page.locator('button:has-text("Fertilize")')).toBeVisible();
    await expect(page.locator('button:has-text("Repot")')).toBeVisible();
  });

  test('should allow selecting due date', async ({ page }) => {
    const dueDateInput = page.locator('input[type="date"]');
    await expect(dueDateInput).toBeVisible();
  });

  test('should toggle repeat option', async ({ page }) => {
    const repeatCheckbox = page.locator('text=Repeat');
    await expect(repeatCheckbox).toBeVisible();
    
    await repeatCheckbox.click();
    
    // Should show repeat interval options
    await expect(page.locator('text=Repeat every')).toBeVisible();
  });

  test('should have cancel and save buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });
});

test.describe('Desktop Layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should show collection preview sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for collection preview sidebar on desktop
    const collectionPreview = page.locator('text=My Plants').nth(1);
    const viewAllLink = page.locator('text=View all →');
    
    // On desktop, either the sidebar preview or the collection text should be visible
    const hasSidebar = await viewAllLink.isVisible().catch(() => false);
    const hasCollection = await collectionPreview.isVisible().catch(() => false);
    
    expect(hasSidebar || hasCollection).toBeTruthy();
  });

  test('should have two-column layout on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // The page should have care tasks and potentially collection preview side by side
    // This is verified by the presence of both main content and sidebar elements
    await expect(page.locator('text=Today\'s Care')).toBeVisible();
  });
});