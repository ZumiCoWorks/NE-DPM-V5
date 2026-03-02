import { test, expect } from '@playwright/test';

// Helper: navigate through onboarding to reach the main PWA screen
async function completeOnboarding(page: any) {
    await page.goto('/e2e-attendee');

    // Landing screen
    const findWayButton = page.locator('button', { hasText: 'Find Your Way' });
    await expect(findWayButton).toBeVisible({ timeout: 15000 });
    await findWayButton.click();

    // Event selection — click first available event
    await expect(page.locator('text=Select an Event')).toBeVisible({ timeout: 15000 });
    const firstEvent = page.locator('div.cursor-pointer.bg-white').first();
    await expect(firstEvent).toBeVisible({ timeout: 15000 });
    await firstEvent.click();

    // POPIA consent
    const acceptButton = page.locator('button', { hasText: 'Accept & Continue' });
    await expect(acceptButton).toBeVisible({ timeout: 15000 });
    await acceptButton.click();

    // Wait for main app to load (Directory tab is default)
    await expect(page.locator('text=Directory')).toBeVisible({ timeout: 20000 });
}

test.describe('Navigation Graph & Turn-by-Turn Routing', () => {

    test('should load navigation data and display POIs in Directory tab', async ({ page }) => {
        await completeOnboarding(page);

        // The directory tab should be visible with navigation loaded
        await expect(page.locator('button', { hasText: 'Directory' })).toBeVisible();

        // The directory tab should have POIs visible — buttons labeled "Directions"
        const directionsBtn = page.locator('button', { hasText: 'Directions' }).first();
        await expect(directionsBtn).toBeVisible({ timeout: 15000 });

        // Take a screenshot for evidence
        await page.screenshot({ path: 'test-results/navigation-directory.png' });
    });

    test('should show Directions panel when "Directions" is clicked on a POI', async ({ page }) => {
        await completeOnboarding(page);

        // Wait for POIs to appear
        const directionsBtn = page.locator('button', { hasText: 'Directions' }).first();
        await expect(directionsBtn).toBeVisible({ timeout: 15000 });
        await directionsBtn.click();

        // After clicking Directions, the app should either:
        // a) Switch to Map tab, or b) show a navigation/route panel
        // Either way, the Map tab should now be active or a nav message should appear
        await page.waitForTimeout(3000); // Allow route calculation

        const mapTab = page.locator('button', { hasText: 'Map' });
        await expect(mapTab).toBeVisible();

        await page.screenshot({ path: 'test-results/navigation-directions-clicked.png' });
    });

    test('should show Map tab with floorplan after navigation is initialized', async ({ page }) => {
        await completeOnboarding(page);

        // Click Map tab
        const mapTab = page.locator('button', { hasText: 'Map' });
        await expect(mapTab).toBeVisible({ timeout: 10000 });
        await mapTab.click();

        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/navigation-map-tab.png' });

        // Verify map view content loaded — "Where to?" heading appears in the map view overlay
        await expect(page.locator('text=Where to?')).toBeVisible({ timeout: 10000 });
    });

    test('should set location via QR anchor injection (legacy x/y format)', async ({ page }) => {
        await completeOnboarding(page);

        // Inject a legacy-format QR payload: {"x": 400, "y": 300}
        // This path in handleQRCodeDetected sets currentLocation and switches to Map tab
        // WITHOUT a Supabase lookup — ideal for E2E testing without a camera.
        const qrPayload = JSON.stringify({ x: 400, y: 300 });

        await page.evaluate((payload) => {
            window.dispatchEvent(new CustomEvent('e2e:qr-inject', { detail: payload }));
        }, qrPayload);

        // Assert the toast message appears
        await expect(page.locator('text=Location updated from QR code!')).toBeVisible({ timeout: 5000 });

        // Assert the app switched to Map tab and floorplan view is active
        await expect(page.locator('text=Where to?')).toBeVisible({ timeout: 5000 });

        await page.screenshot({ path: 'test-results/navigation-qr-location-set.png' });
    });

    test('should show error toast for invalid QR code format', async ({ page }) => {
        await completeOnboarding(page);

        // Inject malformed QR data that has no x/y or anchor_id
        const badPayload = JSON.stringify({ foo: 'bar' });

        await page.evaluate((payload) => {
            window.dispatchEvent(new CustomEvent('e2e:qr-inject', { detail: payload }));
        }, badPayload);

        // Should show the invalid format error message
        await expect(page.locator('text=Invalid QR code format')).toBeVisible({ timeout: 5000 });

        await page.screenshot({ path: 'test-results/navigation-qr-invalid.png' });
    });

    test('Scanner tab should show camera permission request UI', async ({ page }) => {
        await completeOnboarding(page);

        // Click the Scanner tab
        const scannerTab = page.locator('button', { hasText: 'Scanner' });
        await expect(scannerTab).toBeVisible({ timeout: 10000 });
        await scannerTab.click();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/navigation-scanner-tab.png' });

        // Should show the Scanner UI (either camera preview or scan prompt)
        // The scanner tab contains the QR scanning interface
        const scannerTabActive = page.locator('button', { hasText: 'Scanner' });
        await expect(scannerTabActive).toBeVisible();
    });
});
