import { test, expect, Page } from '@playwright/test';

// Helper function to ensure we are on the main dashboard
const ensureOnDashboard = async (page: Page) => {
  // If we happen to be in the editor view, navigate back to the main dashboard
  const editorTitle = page.locator('h2:has-text("Editor")');
  if (await editorTitle.isVisible({ timeout: 2000 })) {
    await page.locator('button:has(svg.lucide-chevron-left)').click();
  }
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
};

// Ensure the user has the Event Admin role selected in-app
const ensureAdminRoleSelected = async (page: Page) => {
  // Start from the role selector
  await page.goto('/');
  // Click the Admin role button; text varies depending on auth state
  // The card title is "For Event Admins"; click the button within that card
  const adminCard = page.locator('div').filter({ hasText: 'For Event Admins' }).first();
  await expect(adminCard).toBeVisible({ timeout: 10000 });
  const adminButton = adminCard.getByRole('button', { name: /Continue as Admin|Sign In as Admin/i });
  await adminButton.click();
  // If clicking navigates to login, perform login, then click Admin again to set role
  if (page.url().includes('/login')) {
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  }
  // Arrive on dashboard with admin role set
  await page.waitForURL(/\/dashboard/);
};

test.describe('Authenticated user flows', () => {
  // Run tests in this file in series
  test.describe.configure({ mode: 'serial' });

  // Choose Event Admin role and log in if needed before each test
  test.beforeEach(async ({ page }) => {
    await ensureAdminRoleSelected(page);
  });

  test('should display the dashboard after role selection', async ({ page }) => {
    await ensureOnDashboard(page);
    // Dashboard has a button to navigate to Events
    await expect(page.getByRole('button', { name: /Go to Events/i })).toBeVisible();
  });

  test('should allow creating a new event and open editor', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await ensureOnDashboard(page);

    // Navigate to Events page
    await page.getByRole('button', { name: /Go to Events/i }).click();
    await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();

    // Create Event
    await page.getByRole('button', { name: /Create Event/i }).click();

    // Expect to be on the map editor for the new event
    await page.waitForURL(/\/map-editor\/[a-f0-9-]+/, { timeout: 15000 });

    // Editor may show upload prompt when no floorplan is set
    await expect(page.locator('h2:has-text("Upload Your Map")')).toBeVisible();
  });
});


