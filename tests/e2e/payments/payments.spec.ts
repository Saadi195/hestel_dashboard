import { test, expect } from '@playwright/test';

test.describe('Payments & Financials Module E2E', () => {
  test('renders payments ledger page', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL(/.*payments/);
    await expect(page.locator('h1')).toContainText(/Payments/i);
  });

  test('renders security deposits page', async ({ page }) => {
    await page.goto('/deposits');
    await expect(page).toHaveURL(/.*deposits/);
    await expect(page.locator('h1')).toContainText(/Security Deposits/i);
  });

  test('renders fines management page', async ({ page }) => {
    await page.goto('/fines');
    await expect(page).toHaveURL(/.*fines/);
    await expect(page.locator('h1')).toContainText(/Fines/i);
  });
});
