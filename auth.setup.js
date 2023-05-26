import { test as setup } from '@playwright/test';

import fs from 'fs';
const realm = process.env.REALM || 'mac-portal';
const clientId = process.env.CLIENT_ID || 'clientId'
const clientSecret = process.env.CLIENT_SECRET || 'clientSecret'
const authFile = `playwright/.auth/agent.json`;
setup('authenticate', async ({ page }) => {
    await page.goto('https://portal-uat.mac-non-prod.appmanteam.com/apps/case-keeper');
    // wait to be redirected to the login page
    await page.waitForSelector('#username');
    await page.type('#username', "jidapa.o");
    await page.type('#password', "!QAZ2wsx");
    await page.click('button[type="submit"]');
    await page.waitForURL("https://portal-uat.mac-non-prod.appmanteam.com/apps/case-keeper/cases");
    await page.context().storageState({ path: authFile });
});