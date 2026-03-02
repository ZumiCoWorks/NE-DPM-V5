import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test credentials from .env.test.local (gitignored)
dotenv.config({ path: path.join(__dirname, '..', '.env.test.local') });

export const ADMIN_STORAGE_STATE = 'playwright/.auth/admin.json';

async function globalSetup(config: FullConfig) {
    // Always log in against port 5173 — matches webServer and test baseURL
    const adminBaseURL = 'http://localhost:5173';

    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error(
            'Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD in .env.test.local\n' +
            'Create the file at dpm-web/.env.test.local with:\n' +
            '  TEST_ADMIN_EMAIL=your@email.com\n' +
            '  TEST_ADMIN_PASSWORD=yourpassword'
        );
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log('🔐 Logging in as admin...');
    await page.goto(`${adminBaseURL}/login`);

    // Fill login form
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to dashboard — confirms login succeeded
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Admin login successful — saving session');

    // Save auth session to file
    await page.context().storageState({ path: ADMIN_STORAGE_STATE });
    await browser.close();
}

export default globalSetup;
