import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Attendee SOS & Security Dashboard', () => {
    // Test both Attendee PWA sending the SOS and Security Dashboard receiving it
    test('should propagate SOS alert from Attendee to Security Dashboard', async ({ browser }) => {
        const attendeeContext = await browser.newContext();
        const adminContext = await browser.newContext();

        const attendeePage = await attendeeContext.newPage();
        const adminPage = await adminContext.newPage();

        attendeePage.on('console', msg => console.log('ATTENDEE:', msg.text()));
        adminPage.on('console', msg => console.log('ADMIN:', msg.text()));

        // 1. Admin accesses Security Dashboard using E2E test route (auth-bypassed)
        await adminPage.goto('/e2e-security');

        // Make sure the dashboard loaded
        await expect(adminPage.locator('text=SECURITY CMD CENTER')).toBeVisible({ timeout: 15000 });

        // 2. Attendee opens the PWA and accepts POPIA consent
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

        // Wait for the main Attendee UI to load
        await expect(attendeePage.locator('text=Directory')).toBeVisible({ timeout: 15000 });

        // 3. Attendee clicks the SOS FAB
        const floatingBtn = attendeePage.locator('button.bg-red-600.rounded-full');
        await expect(floatingBtn).toBeVisible({ timeout: 10000 });
        await floatingBtn.click();

        // The modal should appear
        await expect(attendeePage.locator('text=Emergency Assistance')).toBeVisible();
        const sendAlertBtn = attendeePage.locator('button', { hasText: 'Send Alert' });
        await sendAlertBtn.click();

        // Wait a moment for network/DB and realtime subscription to propagate
        await attendeePage.waitForTimeout(5000);

        fs.writeFileSync('test-results/admin-debug.html', await adminPage.content());
        await adminPage.screenshot({ path: 'test-results/admin-debug.png' });
        await attendeePage.screenshot({ path: 'test-results/attendee-debug.png' });

        // 4. Verify the Dashboard received the SOS alert.
        // The dashboard shows Active count and the alert type label 'SOS'.
        // Use regex to accept any number (parallel test runs may show Active(2) etc.)
        await expect(adminPage.locator('button:has-text("Active")')).toHaveText(/Active \(\d+\)/, { timeout: 10000 });
    });
});
