import { test, expect } from '@playwright/test';

test.describe('Forgot & Reset Password Flow', () => {
  
  test.describe('Part 1: Request Reset Link', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password');
    });

    test('should show success message on valid email request', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', route => {
        route.fulfill({ status: 200, json: { ok: true } });
      });

      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByRole('button', { name: /ส่งลิงก์/i }).click();
      
      await expect(page.getByText(/ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว/i)).toBeVisible();
    });

    test('should show error on API failure', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', route => {
        route.fulfill({ status: 500, json: { error: 'Server Error' } });
      });

      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByRole('button', { name: /ส่งลิงก์/i }).click();
      
      await expect(page.locator('.toast-error')).toContainText('Server Error');
    });
  });

  test.describe('Part 2: Set New Password', () => {
    test.beforeEach(async ({ page }) => {
      // จำลองการเข้าเว็บผ่านลิงก์ที่มี Token
      await page.goto('/reset-password?token=mock_valid_token');
    });

    test('should reset password successfully', async ({ page }) => {
      await page.route('**/api/auth/reset-password', route => {
        route.fulfill({ status: 200, json: { ok: true } });
      });

      // ฟอร์มขอลิงก์ต้องถูกซ่อน
      await expect(page.getByRole('button', { name: /ส่งลิงก์/i })).not.toBeVisible();

      await page.getByLabel(/New Password/i).fill('NewStrongPass1!');
      await page.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i }).click();

      await expect(page.getByText(/เปลี่ยนรหัสผ่านสำเร็จ/i)).toBeVisible();
      await expect(page).toHaveURL(/.*\/login/); // เปลี่ยนเสร็จเด้งไปล็อกอิน
    });
  });
});