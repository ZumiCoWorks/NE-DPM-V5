import { test, expect } from '@playwright/test';

test.describe('Attendee PWA Onboarding & Magic Links', () => {
    test('should display POPIA consent banner on first visit', async ({ page }) => {
        await page.goto('/e2e-attendee');

        // Wait for landing screen and click "Find Your Way"
        const findWayButton = page.locator('button', { hasText: 'Find Your Way' });
        await expect(findWayButton).toBeVisible({ timeout: 10000 });
        await findWayButton.click();

        // Wait for event selection screen and click the first event
        await expect(page.locator('text=Select an Event')).toBeVisible({ timeout: 10000 });
        const firstEvent = page.locator('div.cursor-pointer.bg-white').first();
        await expect(firstEvent).toBeVisible({ timeout: 10000 });
        await firstEvent.click();

        // Wait for POPIA Consent banner
        await expect(page.locator('text=Welcome to NavEaze')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Accept & Continue')).toBeVisible();

        // Verify localStorage doesn't have consent yet
        const hasConsented = await page.evaluate(() => localStorage.getItem('naveaze_consent'));
        expect(hasConsented).toBeNull();
    });

    test('should accept POPIA consent and bypass banner', async ({ page }) => {
        await page.goto('/e2e-attendee');

        const findWayButton = page.locator('button', { hasText: 'Find Your Way' });
        await expect(findWayButton).toBeVisible({ timeout: 10000 });
        await findWayButton.click();

        await expect(page.locator('text=Select an Event')).toBeVisible({ timeout: 10000 });
        const firstEvent = page.locator('div.cursor-pointer.bg-white').first();
        await expect(firstEvent).toBeVisible({ timeout: 10000 });
        await firstEvent.click();

        const acceptButton = page.locator('button', { hasText: 'Accept & Continue' });
        await expect(acceptButton).toBeVisible({ timeout: 10000 });

        // Click Accept
        await acceptButton.click();

        // Banner should be hidden
        await expect(page.locator('text=Welcome to NavEaze')).toBeHidden();

        // Verify localStorage is set
        const consentVal = await page.evaluate(() => localStorage.getItem('naveaze_consent'));
        expect(consentVal).toBe('true');
    });

    test('should inject Magic Link attendee_id from URL into localStorage after consent', async ({ page }) => {
        // Navigate WITH a magic link
        const magicId = 'vip_test_777';
        await page.goto(`/e2e-attendee?attendee_id=${magicId}`);

        const findWayButton = page.locator('button', { hasText: 'Find Your Way' });
        await expect(findWayButton).toBeVisible({ timeout: 15000 });
        await findWayButton.click();

        await expect(page.locator('text=Select an Event')).toBeVisible({ timeout: 15000 });
        const firstEvent = page.locator('div.cursor-pointer.bg-white').first();
        await expect(firstEvent).toBeVisible({ timeout: 15000 });
        await firstEvent.click();

        const acceptButton = page.locator('button', { hasText: 'Accept & Continue' });
        await expect(acceptButton).toBeVisible({ timeout: 15000 });
        await acceptButton.click();

        // Read localStorage to verify the attendee_id is vip_test_777 and not anon_uuid
        const savedId = await page.evaluate(() => localStorage.getItem('naveaze_attendee_id'));
        expect(savedId).toBe(magicId);
    });
});
