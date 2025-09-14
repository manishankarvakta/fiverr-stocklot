import { test, expect } from '@playwright/test';

test.describe('Admin Analytics Overview', () => {
  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@stocklot.co.za');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('admin analytics overview wires endpoints correctly', async ({ page }) => {
    // Navigate to analytics overview
    await page.goto('/admin/analytics/overview');

    // Wait for API calls to complete and verify endpoints are called
    const [dailyStatsResponse, dashboardStatsResponse] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/admin/analytics/daily') && 
        response.request().method() === 'GET'
      ),
      page.waitForResponse(response => 
        response.url().includes('/api/admin/dashboard/stats') && 
        response.request().method() === 'GET'
      )
    ]);

    // Verify API responses are successful
    expect(dailyStatsResponse.ok()).toBeTruthy();
    expect(dashboardStatsResponse.ok()).toBeTruthy();

    // Check page elements are visible
    await expect(page.getByRole('heading', { name: /Analytics Overview/i })).toBeVisible();
    
    // Verify KPI cards are present
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Active Users')).toBeVisible();
    await expect(page.getByText('Total Listings')).toBeVisible();
    await expect(page.getByText('Orders')).toBeVisible();

    // Check revenue chart is displayed
    await expect(page.locator('[data-chart="revenue"]')).toBeVisible();

    // Test export functionality
    const exportPromise = page.waitForResponse(response => 
      response.url().includes('/api/admin/reports/export') && 
      response.request().method() === 'POST'
    );
    
    await page.click('button:has-text("Export CSV")');
    const exportResponse = await exportPromise;
    expect(exportResponse.ok()).toBeTruthy();
  });

  test('date range filtering triggers API calls', async ({ page }) => {
    await page.goto('/admin/analytics/overview');

    // Wait for initial load
    await page.waitForResponse(response => response.url().includes('/api/admin/analytics/daily'));

    // Change date range
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    await startDateInput.fill('2024-01-01');
    await endDateInput.fill('2024-01-31');

    // Verify new API call with date parameters
    const filteredResponse = await page.waitForResponse(response => 
      response.url().includes('/api/admin/analytics/daily') &&
      response.url().includes('start=2024-01-01') &&
      response.url().includes('end=2024-01-31')
    );

    expect(filteredResponse.ok()).toBeTruthy();
  });

  test('loading states display correctly', async ({ page }) => {
    // Intercept API calls to delay them
    await page.route('**/api/admin/analytics/daily', route => {
      setTimeout(() => route.continue(), 2000);
    });

    await page.goto('/admin/analytics/overview');

    // Check loading skeleton is visible
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForResponse(response => response.url().includes('/api/admin/analytics/daily'));
    
    // Loading skeleton should disappear
    await expect(page.locator('.animate-pulse')).toBeHidden();
  });
});