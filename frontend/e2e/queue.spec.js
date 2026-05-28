const { test, expect } = require('@playwright/test');

test.describe('Queue Polling Memory Leak', () => {
  test('should clear polling interval when navigating away from queue page', async ({ page }) => {
    let queueRequestCount = 0;
    
    // Intercept queue API calls
    await page.route('**/api/queue**', async route => {
      queueRequestCount++;
      await route.fulfill({ status: 200, json: [] });
    });

    // Mock reports API for dashboard
    await page.route('**/api/reports/doctor-stats', route => route.fulfill({
      status: 200, json: { success: true, data: [] }
    }));

    // Mock dashboard patients API
    await page.route('**/api/patients*', route => route.fulfill({
      status: 200, json: { success: true, patients: [], pagination: { page: 1, totalPages: 1, totalPatients: 0 } }
    }));

    await page.route('**/api/doctors*', route => route.fulfill({ status: 200, json: [] }));

    // Inject auth state into localStorage
    await page.addInitScript(() => {
      localStorage.setItem('haqms_token', 'fake-token');
      localStorage.setItem('haqms_user', JSON.stringify({ id: '1', role: 'RECEPTIONIST' }));
    });

    // Go to Dashboard
    await page.goto('/dashboard');
    
    // Navigate to Queue using the sidebar link to trigger SPA routing
    await page.locator('a[href="/queue"]').click();
    await expect(page).toHaveURL(/.*\/queue/);

    // Wait a brief moment so the queue page mounts and polling might start
    await page.waitForTimeout(1000);

    // Navigate BACK to Dashboard to unmount Queue
    await page.locator('a[href="/dashboard"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Record the number of requests fired up to the exact moment of unmounting
    const requestsAtUnmount = queueRequestCount;

    // The polling interval is 3000ms. Wait 4000ms.
    // If the clearInterval is missing, it will poll at least once more.
    await page.waitForTimeout(4000);

    // Assert that NO additional background polling occurred after navigating away
    expect(queueRequestCount).toBe(requestsAtUnmount);
  });
});
