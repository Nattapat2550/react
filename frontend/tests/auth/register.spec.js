import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should register successfully and redirect to verify page', async ({ page }) => {
    // Mock API
    await page.route('**/api/auth/register', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, emailSent: true })
      });
    });

    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByRole('button', { name: /สมัครสมาชิก/i }).click();

    // เปลี่ยนเป็นหน้า check-code ตาม React Router
    await expect(page).toHaveURL(/.*\/check-code/);
    await expect(page.getByText(/โปรดตรวจสอบอีเมลของคุณ/i)).toBeVisible();
  });
});