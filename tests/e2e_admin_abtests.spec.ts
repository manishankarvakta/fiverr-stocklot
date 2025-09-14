import { test, expect } from '@playwright/test';

test.describe('Admin A/B Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@stocklot.co.za');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('experiments page loads and displays overview', async ({ page }) => {
    await page.goto('/admin/experiments');

    // Wait for experiments API call
    const experimentsResponse = await page.waitForResponse(response => 
      response.url().includes('/api/admin/ab-tests') && 
      response.request().method() === 'GET'
    );

    expect(experimentsResponse.ok()).toBeTruthy();

    // Check page elements
    await expect(page.getByRole('heading', { name: /A\/B Testing Experiments/i })).toBeVisible();
    await expect(page.getByText('Create and manage conversion optimization tests')).toBeVisible();

    // Verify overview stats cards
    await expect(page.getByText('Active Tests')).toBeVisible();
    await expect(page.getByText('Total Tests')).toBeVisible();
    await expect(page.getByText('Avg Improvement')).toBeVisible();
    await expect(page.getByText('Total Visitors')).toBeVisible();

    // Check create button
    await expect(page.getByText('New Experiment')).toBeVisible();
  });

  test('create new experiment workflow', async ({ page }) => {
    await page.goto('/admin/experiments');
    
    // Wait for page load
    await page.waitForResponse(response => response.url().includes('/api/admin/ab-tests'));

    // Click create experiment button
    await page.click('button:has-text("New Experiment")');

    // Check modal appears
    const modal = page.locator('.fixed.inset-0.bg-black');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Create New Experiment')).toBeVisible();

    // Fill out experiment form
    await page.fill('input[placeholder*="e.g., PDP Buy Button Color Test"]', 'Test Experiment');
    await page.fill('textarea[placeholder*="Describe what you\'re testing"]', 'Testing button color impact on conversions');
    await page.fill('input[placeholder="/listing/:id"]', '/listing/:id');

    // Adjust traffic split
    const slider = page.locator('input[type="range"]');
    await slider.fill('60');

    // Submit form
    const createPromise = page.waitForResponse(response => 
      response.url().includes('/api/admin/ab-tests') && 
      response.request().method() === 'POST'
    );

    await page.click('button:has-text("Create Experiment")');

    const createResponse = await createPromise;
    expect(createResponse.ok()).toBeTruthy();

    // Verify request payload
    const requestBody = await createResponse.request().postDataJSON();
    expect(requestBody.name).toBe('Test Experiment');
    expect(requestBody.description).toBe('Testing button color impact on conversions');
    expect(requestBody.target_url).toBe('/listing/:id');
    expect(requestBody.traffic_split).toBe(60);

    // Modal should close and experiments should reload
    await expect(modal).toBeHidden();
  });

  test('experiment toggle functionality', async ({ page }) => {
    await page.goto('/admin/experiments');
    
    // Wait for experiments to load
    await page.waitForResponse(response => response.url().includes('/api/admin/ab-tests'));

    // Find first experiment toggle button
    const toggleButton = page.locator('button[title*="Experiment"]').first();
    
    if (await toggleButton.isVisible()) {
      const togglePromise = page.waitForResponse(response => 
        response.url().includes('/api/admin/ab-tests/') &&
        (response.url().includes('/start') || response.url().includes('/pause')) &&
        response.request().method() === 'POST'
      );

      await toggleButton.click();
      
      const toggleResponse = await togglePromise;
      expect(toggleResponse.ok()).toBeTruthy();
    }
  });

  test('experiment results navigation', async ({ page }) => {
    await page.goto('/admin/experiments');
    
    // Wait for experiments to load
    await page.waitForResponse(response => response.url().includes('/api/admin/ab-tests'));

    // Find first "View Results" button
    const resultsButton = page.locator('a:has-text("View Results")').first();
    
    if (await resultsButton.isVisible()) {
      // Click should navigate to results page
      await resultsButton.click();
      
      // Verify navigation (URL should contain experiment ID)
      await expect(page).toHaveURL(/\/admin\/experiments\/[^\/]+$/);
    }
  });

  test('empty state displays correctly', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/admin/ab-tests', route => 
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ experiments: [] })
      })
    );

    await page.goto('/admin/experiments');

    // Check empty state
    await expect(page.getByText('No experiments yet')).toBeVisible();
    await expect(page.getByText('Create your first A/B test')).toBeVisible();
  });

  test('experiment status badges display correctly', async ({ page }) => {
    // Mock response with different experiment statuses
    await page.route('**/api/admin/ab-tests', route => 
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          experiments: [
            {
              id: '1',
              name: 'Active Test',
              status: 'active',
              description: 'Running test',
              traffic_split: 50,
              visitors: 1000
            },
            {
              id: '2', 
              name: 'Paused Test',
              status: 'paused',
              description: 'Paused test',
              traffic_split: 50,
              visitors: 500
            },
            {
              id: '3',
              name: 'Completed Test',
              status: 'completed', 
              description: 'Finished test',
              traffic_split: 50,
              visitors: 2000,
              improvement: 0.15
            }
          ]
        })
      })
    );

    await page.goto('/admin/experiments');

    // Check status badges
    await expect(page.locator('.bg-green-100.text-green-800')).toBeVisible(); // Active
    await expect(page.locator('.bg-yellow-100.text-yellow-800')).toBeVisible(); // Paused
    await expect(page.locator('.bg-blue-100.text-blue-800')).toBeVisible(); // Completed

    // Check improvement indicator
    await expect(page.getByText('+15.0%')).toBeVisible();
  });
});