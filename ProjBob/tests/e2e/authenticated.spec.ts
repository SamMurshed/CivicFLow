import { expect, test } from '@playwright/test';

test('demo account reaches its role dashboard', async ({ page }) => {
  test.skip(
    !process.env.E2E_DEMO_EMAIL || !process.env.E2E_DEMO_PASSWORD,
    'Demo credentials are not configured.',
  );
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(process.env.E2E_DEMO_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_DEMO_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(agency|analyst|admin|vendor)\/dashboard/);
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
