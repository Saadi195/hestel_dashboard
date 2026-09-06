import { test, expect } from '@playwright/test';

test.describe('Residents Module E2E', () => {
  test('renders residents page and table structure', async ({ page }) => {
    await page.goto('/residents');
    await expect(page).toHaveURL(/.*residents/);
    await expect(page.locator('h1')).toContainText(/Residents/i);
  });
});
