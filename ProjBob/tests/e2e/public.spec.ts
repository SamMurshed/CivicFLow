import { expect, test } from '@playwright/test';

test('landing page explains CivicFlow and links to sign in', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Procurement');
  await page
    .getByRole('link', { name: /sign in/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});

test('public pages support keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
