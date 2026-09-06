import { test, expect } from '@playwright/test';

test.describe('Rooms & Beds Module E2E', () => {
  test('renders rooms catalog page', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page).toHaveURL(/.*rooms/);
    await expect(page.locator('h1')).toContainText(/Rooms/i);
  });

  test('renders beds overview page', async ({ page }) => {
    await page.goto('/beds');
    await expect(page).toHaveURL(/.*beds/);
    await expect(page.locator('h1')).toContainText(/Beds/i);
  });
});
