import { test, expect } from '@playwright/test';

test.describe('Admin Moderation Actions', () => {
  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@stocklot.co.za');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('user moderation page loads and functions', async ({ page }) => {
    await page.goto('/admin/moderation/users');

    // Wait for users to load
    const usersResponse = await page.waitForResponse(response => 
      response.url().includes('/api/admin/users') && 
      response.request().method() === 'GET'
    );

    expect(usersResponse.ok()).toBeTruthy();

    // Check page elements
    await expect(page.getByRole('heading', { name: /User Moderation/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();

    // Test filtering
    await page.selectOption('select', 'active');
    
    const filterResponse = await page.waitForResponse(response => 
      response.url().includes('/api/admin/users') &&
      response.url().includes('status=active')
    );

    expect(filterResponse.ok()).toBeTruthy();
  });

  test('user suspension workflow', async ({ page }) => {
    await page.goto('/admin/moderation/users');
    
    // Wait for users to load
    await page.waitForResponse(response => response.url().includes('/api/admin/users'));

    // Find first active user and attempt suspension
    const suspendButton = page.locator('button[title="Suspend User"]').first();
    
    if (await suspendButton.isVisible()) {
      // Mock the prompt dialog
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.message()).toContain('Reason for suspension');
        await dialog.accept('Test suspension reason');
      });

      const suspendPromise = page.waitForResponse(response => 
        response.url().includes('/api/admin/users/') &&
        response.url().includes('/suspend') &&
        response.request().method() === 'POST'
      );

      await suspendButton.click();
      
      const suspendResponse = await suspendPromise;
      expect(suspendResponse.ok()).toBeTruthy();

      // Verify suspension request payload
      const requestBody = await suspendResponse.request().postDataJSON();
      expect(requestBody.reason).toBe('Test suspension reason');
    }
  });

  test('user search functionality', async ({ page }) => {
    await page.goto('/admin/moderation/users');
    
    // Wait for initial load
    await page.waitForResponse(response => response.url().includes('/api/admin/users'));

    // Test search
    const searchInput = page.getByPlaceholder('Search users...');
    await searchInput.fill('test@example.com');

    const searchResponse = await page.waitForResponse(response => 
      response.url().includes('/api/admin/users') &&
      response.url().includes('search=test%40example.com')
    );

    expect(searchResponse.ok()).toBeTruthy();
  });

  test('user promotion workflow', async ({ page }) => {
    await page.goto('/admin/moderation/users');
    
    // Wait for users to load
    await page.waitForResponse(response => response.url().includes('/api/admin/users'));

    // Click on more actions for first user
    const moreButton = page.locator('button[title="More Actions"]').first();
    
    if (await moreButton.isVisible()) {
      await moreButton.click();

      // Check if user detail modal appears
      const modal = page.locator('.fixed.inset-0.bg-black');
      await expect(modal).toBeVisible();

      // Find promote button if user is not already a seller
      const promoteButton = page.getByText('Promote to Seller');
      
      if (await promoteButton.isVisible()) {
        const promotePromise = page.waitForResponse(response => 
          response.url().includes('/api/admin/users/') &&
          response.url().includes('/promote') &&
          response.request().method() === 'POST'
        );

        await promoteButton.click();
        
        const promoteResponse = await promotePromise;
        expect(promoteResponse.ok()).toBeTruthy();

        // Verify promotion request payload
        const requestBody = await promoteResponse.request().postDataJSON();
        expect(requestBody.role).toBe('seller');
      }

      // Close modal
      await page.getByText('Close').click();
      await expect(modal).toBeHidden();
    }
  });
});