import { test, expect } from '@playwright/test';

test.describe('Checkout & Settlement Module E2E', () => {
  test('renders checkout settlements page', async ({ page }) => {
    await page.goto('/check-out');
    await expect(page).toHaveURL(/.*check-out/);
    await expect(page.locator('h1')).toContainText(/Checkout/i);
  });
});
