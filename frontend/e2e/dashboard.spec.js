const { test, expect } = require('@playwright/test');

test.describe('Dashboard Features', () => {
  
  test('should debounce search requests to exactly 1 call for Receptionist', async ({ page }) => {
    // Intercept patients API to count search calls and mock the response
    let searchRequestCount = 0;
    await page.route('**/api/patients*', async route => {
      searchRequestCount++;
      await route.fulfill({
        status: 200, json: {
          success: true,
          patients: [{ id: '123', name: 'John Doe', age: 30, gender: 'Male', medicalHistory: null }],
          pagination: { page: 1, totalPages: 1, totalPatients: 1 }
        }
      });
    });

    // Mock doctors and reports API
    await page.route('**/api/reports/doctor-stats', route => route.fulfill({ status: 200, json: { success: true, data: [] } }));
    await page.route('**/api/doctors*', route => route.fulfill({ status: 200, json: [] }));

    // Inject auth state for RECEPTIONIST
    await page.addInitScript(() => {
      localStorage.setItem('haqms_token', 'fake-token');
      localStorage.setItem('haqms_user', JSON.stringify({ id: '1', role: 'RECEPTIONIST' }));
    });

    await page.goto('/dashboard');
    
    // Wait for the app to load
    await expect(page.locator('text=Patient Lookup Directory')).toBeVisible();

    // Type rapidly into the search bar
    const searchInput = page.locator('input[placeholder="Search by name, phone or email..."]');
    await searchInput.type('John Doe', { delay: 50 });

    // Wait exactly 600ms for debounce timer to fire and the request to go out
    await page.waitForRequest('**/api/patients*');

    // Wait a moment longer to ensure no follow-up requests were sent
    await page.waitForTimeout(500);

    // Verify exactly ONE request was made
    expect(searchRequestCount).toBe(1);
  });

  test('should handle null history without crashing for Doctor', async ({ page }) => {
    // Mock appointments API for DOCTOR
    await page.route('**/api/appointments*', async route => {
      await route.fulfill({
        status: 200, json: {
          success: true,
          appointments: [
            {
              id: 'app-123',
              appointmentDate: new Date().toISOString(),
              status: 'SCHEDULED',
              patient: { id: '123', name: 'John Doe', age: 30, gender: 'Male', medicalHistory: null }
            }
          ]
        }
      });
    });

    // Mock doctor worklist API
    await page.route('**/api/queue*', route => route.fulfill({ status: 200, json: [] }));
    await page.route('**/api/doctors*', route => route.fulfill({ status: 200, json: [{ id: 'doc-1', userId: '2', name: 'Dr. Smith' }] }));

    // Inject auth state for DOCTOR
    await page.addInitScript(() => {
      localStorage.setItem('haqms_token', 'fake-token');
      localStorage.setItem('haqms_user', JSON.stringify({ id: '2', role: 'DOCTOR' }));
    });

    await page.goto('/dashboard');

    // Wait for the appointments table to load
    await expect(page.locator('text=Scheduled Daily Bookings List')).toBeVisible();

    // The name "John Doe" acts as a button to open Medical Records in the DOCTOR view
    await page.locator('button', { hasText: 'John Doe' }).click();

    await page.screenshot({ path: 'after-click.png', fullPage: true });

    // Verify the modal opens and doesn't crash on null medical history
    await expect(page.locator('text=Medical Records: John Doe')).toBeVisible();
    await expect(page.locator('text=NO MEDICAL HISTORY RECORDED')).toBeVisible();
  });
});
