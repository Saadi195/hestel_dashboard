import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Start unauthenticated for auth tests

  test('redirects unauthenticated user accessing protected route back to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('renders login page correctly with form fields and owner credentials note', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Sign In/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('text=Owner Sign In Credentials')).toBeVisible();
  });

  test('successfully authenticates via credentials form and navigates to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@hostel.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('health check API returns 200 OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { status: string };
    expect(body.status).toBe('ok');
  });
});
