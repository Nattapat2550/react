import { test, expect } from '@playwright/test';

const corsHeaders = { 
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization' 
};

test.describe('Forgot & Reset Password Flow', () => {
  
  test.describe('Part 1: Request Reset Link', () => {
    test('should show error on API failure', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', route => {
        route.fulfill({ status: 500, headers: corsHeaders, json: { error: 'Server Error' } });
      });

      await page.goto('/reset');
      // ใช้ Selector ที่เจาะจงกับลำดับของฟอร์ม
      await page.locator('input[type="email"]').first().fill('user@example.com');
      await page.locator('button:has-text("Send Link")').click();
      
      await expect(page.getByText(/server error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Part 2: Set New Password', () => {
    test('should reset password successfully', async ({ page }) => {
      await page.route('**/api/auth/reset-password', route => {
        route.fulfill({ status: 200, headers: corsHeaders, json: { ok: true } });
      });

      await page.goto('/reset?token=mock_token');
      
      const pwInput = page.locator('input[type="password"]');
      await pwInput.waitFor({ state: 'visible' });
      await pwInput.fill('NewStrongPass1!');
      await page.locator('button:has-text("Set Password")').click();

      // เช็คส่วนหนึ่งของข้อความ (Partial Match) จะเสถียรกว่าใน CI
      await expect(page.getByText(/Password set/i)).toBeVisible({ timeout: 10000 });
    });
  });
});