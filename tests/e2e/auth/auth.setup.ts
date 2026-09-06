import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authDir = path.resolve('./tests/e2e/.auth');
const authFile = path.join(authDir, 'user.json');

setup('authenticate', async ({ page }) => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto('/login');
  await page.fill('input[type="email"]', 'owner@hostel.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');

  await page.context().storageState({ path: authFile });
});
