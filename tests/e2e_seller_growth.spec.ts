import { test, expect } from '@playwright/test';

test.describe('Seller Growth Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Seller login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'seller@stocklot.co.za');
    await page.fill('input[name="password"]', 'seller123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('seller analytics page loads performance data', async ({ page }) => {
    await page.goto('/seller/analytics');

    // Wait for analytics API call
    const analyticsResponse = await page.waitForResponse(response => 
      response.url().includes('/api/seller/analytics/performance') && 
      response.request().method() === 'GET'
    );

    expect(analyticsResponse.ok()).toBeTruthy();

    // Check page elements are visible
    await expect(page.getByRole('heading', { name: /Seller Analytics/i })).toBeVisible();
    await expect(page.getByText('Track your performance and grow your business')).toBeVisible();

    // Verify performance metric cards
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Views This Month')).toBeVisible();
    await expect(page.getByText('Active Listings')).toBeVisible();
    await expect(page.getByText('Average Rating')).toBeVisible();
    await expect(page.getByText('Conversion Rate')).toBeVisible();
    await expect(page.getByText('Repeat Customers')).toBeVisible();

    // Check charts are rendered
    await expect(page.getByText('Revenue Trend (Last 90 Days)')).toBeVisible();
    await expect(page.getByText('Listing Views')).toBeVisible();
    await expect(page.getByText('Daily Orders')).toBeVisible();
  });

  test('performance insights display correctly', async ({ page }) => {
    await page.goto('/seller/analytics');
    
    // Wait for data to load
    await page.waitForResponse(response => response.url().includes('/api/seller/analytics/performance'));

    // Check performance insights section
    await expect(page.getByText('Performance Insights')).toBeVisible();
    await expect(page.getByText('What\'s Working Well')).toBeVisible();
    await expect(page.getByText('Areas for Improvement')).toBeVisible();
  });

  test('top performing listings table displays', async ({ page }) => {
    await page.goto('/seller/analytics');
    
    // Wait for data to load
    await page.waitForResponse(response => response.url().includes('/api/seller/analytics/performance'));

    // Check top listings table
    await expect(page.getByText('Top Performing Listings')).toBeVisible();
    
    // Verify table headers
    await expect(page.getByText('Listing')).toBeVisible();
    await expect(page.getByText('Views')).toBeVisible();
    await expect(page.getByText('Orders')).toBeVisible();
    await expect(page.getByText('Conversion')).toBeVisible();
    await expect(page.getByText('Revenue')).toBeVisible();
  });

  test('loading states work correctly', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/api/seller/analytics/performance', route => {
      setTimeout(() => route.continue(), 1500);
    });

    await page.goto('/seller/analytics');

    // Check loading animation is visible
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Wait for API response
    await page.waitForResponse(response => response.url().includes('/api/seller/analytics/performance'));
    
    // Loading should disappear
    await expect(page.locator('.animate-pulse')).toBeHidden();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/seller/analytics');
    
    // Wait for data to load
    await page.waitForResponse(response => response.url().includes('/api/seller/analytics/performance'));

    // Check that key elements are still visible on mobile
    await expect(page.getByRole('heading', { name: /Seller Analytics/i })).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    
    // Check that grid layout adapts (metrics should stack vertically)
    const metricsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    await expect(metricsGrid).toBeVisible();
  });
});