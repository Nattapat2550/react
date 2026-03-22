import { test, expect } from '@playwright/test';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

test.describe('Forgot & Reset Password Flow', () => {
  
  test.describe('Part 1: Request Reset Link', () => {
    test('should show error on API failure', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', route => {
        route.fulfill({ status: 500, headers: corsHeaders, json: { error: 'Server Error' } });
      });

      await page.goto('/reset');
      await page.locator('input[type="email"]').fill('user@example.com');
      await page.locator('button[type="submit"]').click();
      
      // 🌟 ใช้ text match แบบไม่สนใจตัวพิมพ์เล็กพิมพ์ใหญ่ และรอให้แสดงผล
      await expect(page.getByText(/server error/i)).toBeVisible({ timeout: 7000 });
    });
  });

  test.describe('Part 2: Set New Password', () => {
    test('should reset password successfully', async ({ page }) => {
      await page.route('**/api/auth/reset-password', route => {
        route.fulfill({ status: 200, headers: corsHeaders, json: { ok: true } });
      });

      await page.goto('/reset?token=mock_valid_token');
      
      const pwInput = page.locator('input[type="password"]');
      await pwInput.fill('NewStrongPass1!');
      await page.locator('button[type="submit"]').click();

      // 🌟 ตรวจสอบข้อความเป๊ะๆ จาก ResetPasswordPage.jsx
      await expect(page.getByText('Password set. You can login now.')).toBeVisible({ timeout: 7000 });
    });
  });
});