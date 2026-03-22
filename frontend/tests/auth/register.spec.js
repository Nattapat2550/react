import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should register successfully and redirect to verify page', async ({ page }) => {
    await page.route('**/api/auth/register', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, emailSent: true })
      });
    });

    await page.locator('input[name="email"]').fill('newuser@example.com');
    await page.locator('button[type="submit"]').click();

    // เปลี่ยนให้ตรงกับ Router ของคุณที่ใช้ path "/check"
    await expect(page).toHaveURL(/.*\/check/);
  });
});