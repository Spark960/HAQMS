const { test, expect } = require('@playwright/test');

test.describe('Global 401 Interceptor', () => {
  test('should forcefully redirect to /login when a protected API returns 401', async ({ page }) => {
    await page.route('**/api/**', route => {
      const request = route.request();
      if (request.url().includes('/api/auth/')) {
        route.continue();
      } else {
        route.fulfill({ status: 401, json: { error: 'Token expired' } });
      }
    });

    // Inject auth state into localStorage so the dashboard mounts and attempts to fetch
    await page.addInitScript(() => {
      localStorage.setItem('haqms_token', 'fake-token');
      localStorage.setItem('haqms_user', JSON.stringify({ id: '1', role: 'RECEPTIONIST' }));
    });

    // Go to dashboard
    await page.goto('/dashboard');
    
    // Wait for the parent AuthContext useEffect to bind the interceptor
    await page.waitForTimeout(1000);

    // Trigger a new fetch action by typing in the search bar
    const searchInput = page.locator('input[placeholder="Search by name, phone or email..."]');
    await searchInput.type('trigger fetch', { delay: 10 });
    
    // The page should redirect us to /login because the auth fetch interceptor catches the 401
    await expect(page).toHaveURL(/.*\/login/);
  });
});
