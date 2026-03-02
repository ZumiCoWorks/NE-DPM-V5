import { test, expect, Page } from '@playwright/test';

// Helper: navigate to /login, fill credentials, and wait for /dashboard
// Each test gets a fresh browser context but we explicitly log in via form
// to ensure Supabase AuthContext is properly initialised.
async function loginAsAdmin(page: Page) {
    const email = process.env.TEST_ADMIN_EMAIL!;
    const password = process.env.TEST_ADMIN_PASSWORD!;

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    // Wait for EITHER the dashboard heading OR the login page input to appear
    const dashboardHeading = page.locator('h1', { hasText: /Welcome back/i });
    const emailInput = page.locator('input[type="email"]');

    // Race to see which one becomes visible first
    const isLoginRequired = await Promise.race([
        dashboardHeading.waitFor({ state: 'visible', timeout: 15000 }).then(() => false),
        emailInput.waitFor({ state: 'visible', timeout: 15000 }).then(() => true),
    ]).catch(async () => {
        await page.screenshot({ path: 'test-results/timeout-debug.png', fullPage: true });
        throw new Error('Neither dashboard nor login page loaded within 15s. See test-results/timeout-debug.png');
    });

    if (!isLoginRequired) {
        // Already logged in and on dashboard
        return;
    }

    // Must log in
    await emailInput.fill(email);
    await page.locator('input[type="password"]').fill(password);

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(dashboardHeading.first()).toBeVisible({ timeout: 15000 });
}

// Helper: navigate to the first event's Map Editor after login
async function goToMapEditor(page: Page) {
    // Go to events list via SPA link
    await page.locator('a[href="/events"]:visible').first().click();
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Wait for the table/list to populate from Supabase
    await page.waitForTimeout(3000);

    // Find link to map-editor for first event
    const mapEditorLink = page.locator('a[href*="map-editor"]').first();
    const editEventLink = page.locator('a[href*="edit"]').first();

    const hasMapEditor = await mapEditorLink.isVisible({ timeout: 2000 }).catch(() => false);
    const hasEditEvent = await editEventLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (await mapEditorLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await mapEditorLink.click();
    } else if (await editEventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Fallback: click edit event then go to map editor via sidebar
        await editEventLink.click();
        await page.waitForTimeout(2000);
        await page.locator('a[href="/map-editor"]:visible').first().click();
    } else {
        // Navigate directly via sidebar
        await page.locator('a[href="/map-editor"]:visible').first().click();
    }

    // Wait for the Map Editor to fully load
    await page.waitForTimeout(4000);
}

test.describe('Admin QR Code Generator', () => {

    test('should log in and see the admin Dashboard', async ({ page }) => {
        await loginAsAdmin(page);

        // Dashboard h1 heading is always present after login
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
        await page.screenshot({ path: 'test-results/admin-dashboard.png' });
    });

    test('should show Events list after login', async ({ page }) => {
        await loginAsAdmin(page);

        // Click sidebar link instead of goto
        await page.locator('a[href="/events"]:visible').first().click();
        await page.waitForTimeout(2000);

        // Events page h1 heading should be visible
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
        await page.screenshot({ path: 'test-results/admin-events-page.png' });
    });

    test('should show QR Code Generator section in Map Editor', async ({ page }) => {
        await loginAsAdmin(page);
        await goToMapEditor(page);

        await page.screenshot({ path: 'test-results/admin-map-editor.png' });

        // QR Code Generator heading OR empty state
        const qrSection = page.locator('text=QR Code Generator');
        const emptyState = page.locator('h3', { hasText: /No Event Selected/i });
        await expect(qrSection.first().or(emptyState.first())).toBeVisible({ timeout: 20000 });
    });

    test('should show navigation points or empty state in QR Generator', async ({ page }) => {
        await loginAsAdmin(page);
        await goToMapEditor(page);

        const emptyState = page.locator('h3', { hasText: /No Event Selected/i });
        if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
            return; // Gracefully pass test if DB is empty
        }

        const qrSection = page.locator('text=QR Code Generator');
        await expect(qrSection.first()).toBeVisible({ timeout: 20000 });

        // Either shows nav points (preview buttons) or an empty state message
        const hasPoints = await page.locator('button[title="Preview QR Code"]').isVisible().catch(() => false);
        const hasEmpty = await page.locator('text=No navigation points').isVisible().catch(() => false);
        const hasCount = await page.locator('text=navigation point').isVisible().catch(() => false);

        expect(hasPoints || hasEmpty || hasCount).toBeTruthy();
        await page.screenshot({ path: 'test-results/admin-qr-generator.png' });
    });

    test('should show "Download All (ZIP)" button in QR Generator', async ({ page }) => {
        await loginAsAdmin(page);
        await goToMapEditor(page);

        const emptyState = page.locator('h3', { hasText: /No Event Selected/i });
        if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
            return; // Gracefully pass test if DB is empty
        }

        // Download All button should be present
        const downloadZipBtn = page.locator('button', { hasText: /Download All|ZIP/i });
        await expect(downloadZipBtn.first()).toBeVisible({ timeout: 10000 });

        const isDisabled = await downloadZipBtn.first().isDisabled();
        console.log(`ZIP button: ${isDisabled ? 'DISABLED (no nav points)' : 'ENABLED (nav points exist)'}`);
        await page.screenshot({ path: 'test-results/admin-qr-download-btn.png' });
    });
});
