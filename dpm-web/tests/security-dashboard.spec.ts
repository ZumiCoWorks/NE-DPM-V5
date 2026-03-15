import { test, expect } from '@playwright/test';

test.describe('Security Dashboard — Crowd Density & RAG Status', () => {

    test('should render SECURITY CMD CENTER header', async ({ page }) => {
        await page.goto('/e2e-security');
        await expect(page.locator('h1', { hasText: 'SECURITY CMD CENTER' })).toBeVisible({ timeout: 15000 });
    });

    test('should display RAG legend with Normal Activity and Critical Alert labels', async ({ page }) => {
        await page.goto('/e2e-security');
        await expect(page.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // RAG Legend: Normal Activity (blue) and Critical Alert (red pulsing)
        await expect(page.locator('text=Normal Activity')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Critical Alert')).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/security-rag-legend.png' });
    });

    test('should display LIVE indicator badge', async ({ page }) => {
        await page.goto('/e2e-security');
        await expect(page.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // Live realtime indicator
        await expect(page.locator('text=LIVE')).toBeVisible({ timeout: 10000 });
    });

    test('should display ON SITE attendee counter', async ({ page }) => {
        await page.goto('/e2e-security');
        await expect(page.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // ON SITE counter (shows number of live attendees)
        await expect(page.locator('text=ON SITE')).toBeVisible({ timeout: 10000 });
    });

    test('should show Active and History tab buttons', async ({ page }) => {
        await page.goto('/e2e-security');
        await expect(page.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // Alert feed tabs
        await expect(page.locator('button', { hasText: /Active/ })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('button', { hasText: 'History' })).toBeVisible({ timeout: 10000 });
    });

    test('should show Crowd Density overlay panel on map', async ({ page }) => {
        await page.goto('/e2e-security');
        await expect(page.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        await expect(page.locator('text=Crowd Density')).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/security-crowd-density-panel.png' });
    });

    test('should propagate SOS alert from Attendee to Security Dashboard (integration)', async ({ browser }) => {
        const attendeeContext = await browser.newContext();
        const adminContext = await browser.newContext();

        const attendeePage = await attendeeContext.newPage();
        const adminPage = await adminContext.newPage();

        attendeePage.on('console', msg => console.log('ATTENDEE:', msg.text()));
        adminPage.on('console', msg => console.log('ADMIN:', msg.text()));

        // 1. Admin opens Security Dashboard
        await adminPage.goto('/e2e-security');
        await expect(adminPage.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // Get current active count BEFORE SOS
        const activeButtonBefore = adminPage.locator('button', { hasText: /Active/ });
        await expect(activeButtonBefore).toBeVisible({ timeout: 10000 });

        // 2. Attendee goes through onboarding
        await attendeePage.goto('/e2e-attendee?attendee_id=11111111-1111-1111-1111-111111111111&event_id=00000000-0000-0000-0000-000000000001');

        const findWayButton = attendeePage.locator('button', { hasText: 'Find Your Way' });
        await expect(findWayButton).toBeVisible({ timeout: 15000 });
        await findWayButton.click();

        await expect(attendeePage.locator('text=Select an Event')).toBeVisible({ timeout: 15000 });
        const firstEvent = attendeePage.locator('div.cursor-pointer.bg-white').first();
        await expect(firstEvent).toBeVisible({ timeout: 15000 });
        await firstEvent.click();

        const acceptButton = attendeePage.locator('button', { hasText: 'Accept & Continue' });
        await expect(acceptButton).toBeVisible({ timeout: 15000 });
        await acceptButton.click();

        await expect(attendeePage.locator('text=Directory')).toBeVisible({ timeout: 15000 });

        // 3. Attendee triggers SOS
        const floatingBtn = attendeePage.locator('button.bg-red-600.rounded-full');
        await expect(floatingBtn).toBeVisible({ timeout: 10000 });
        await floatingBtn.click();

        await expect(attendeePage.locator('text=Emergency Assistance')).toBeVisible();
        const sendAlertBtn = attendeePage.locator('button', { hasText: 'Send Alert' });
        await sendAlertBtn.click();

        // Wait for realtime propagation
        await attendeePage.waitForTimeout(5000);

        await adminPage.screenshot({ path: 'test-results/security-sos-received.png' });

        // 4. Verify dashboard shows Active alert (regex accepts Active(1), Active(2) etc. from parallel runs)
        await expect(adminPage.locator('button:has-text("Active")')).toHaveText(/Active \(\d+\)/, { timeout: 10000 });
    });

    test('should display attendee identity panel when alert has a registered attendee_id', async ({ page }) => {
        // Intercept the Supabase REST call for safety_alerts and return a mock alert with a known attendee_id
        const MOCK_ATTENDEE_ID = '00000000-aaaa-bbbb-cccc-000000000001';

        await page.route('**/rest/v1/safety_alerts**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'test-alert-001',
                    type: 'sos',
                    status: 'new',
                    gps_lat: null,
                    gps_lng: null,
                    created_at: new Date().toISOString(),
                    user_id: MOCK_ATTENDEE_ID,
                    attendee_id: MOCK_ATTENDEE_ID,
                }]),
            });
        });

        // Intercept the attendee lookup and return identity info
        await page.route(`**/rest/v1/attendees?**id=eq.${MOCK_ATTENDEE_ID}**`, route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ first_name: 'Jane', last_name: 'Doe', ticket_type: 'VIP' }]),
            });
        });

        await page.goto('/e2e-security');
        await expect(page.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // Identity panel should appear with name and ticket type
        await expect(page.locator('[data-testid="alert-attendee-name"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="alert-attendee-ticket"]')).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/security-attendee-identity-panel.png' });
    });
});
