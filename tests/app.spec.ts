import { test, expect, Page } from '@playwright/test';

// Helper function to ensure we are on the main dashboard
const ensureOnDashboard = async (page: Page) => {
  // After login, the app might be on the editor page. If so, go back.
  const editorTitle = page.locator('h2:has-text("Editor")');
  // Use a short timeout to quickly check if we're in the editor
  if (await editorTitle.isVisible({ timeout: 2000 })) {
    // The back button is the one with the ChevronLeft icon in the editor header.
    await page.locator('button:has(svg.lucide-chevron-left)').click();
  }
  // Now we should be on the main dashboard. Wait for it to be ready.
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
};

test.describe('Authenticated user flows', () => {
  // Run tests in this file in series
  test.describe.configure({ mode: 'serial' });

  // Log in before each test. The app might redirect to the main dashboard or a specific event.
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    // Wait for login to complete and URL to be on any dashboard page
    await page.waitForURL(/\/dashboard/);
  });

  test('should display the dashboard after login', async ({ page }) => {
    // Ensure we are on the main dashboard view
    await ensureOnDashboard(page);
    // Now we can safely check for the "Create New Event" button
    await expect(page.locator('button:has-text("Create New Event")')).toBeVisible();
  });

  test('should allow creating a new event from scratch', async ({ page }) => {
    // Listen for console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Ensure we start from the main dashboard
    await ensureOnDashboard(page);

    await page.getByRole('button', { name: 'Create New Event' }).click();

    // Wait for the create event section to be visible
    await expect(page.locator('h3:has-text("Create New Event")')).toBeVisible({ timeout: 10000 });

    // Use a specific selector for the "From Scratch" file input
    const fromScratchUploader = page.locator('h4:has-text("From Scratch") + div').locator('input[type="file"]');

    // Upload a dummy file
    await fromScratchUploader.setInputFiles({
      name: 'floorplan.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64'),
    });

    // After upload, the app should navigate to the editor for the new event.
    await page.waitForURL(/\/dashboard\/[a-f0-9-]+/, { timeout: 10000 });

    // Check if the editor view is now visible
    await expect(page.locator('h2:has-text("Editor")')).toBeVisible();
  });
});


