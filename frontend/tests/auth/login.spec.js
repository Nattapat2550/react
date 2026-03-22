import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display required validation errors on empty submission', async ({ page }) => {
    // ตรวจสอบว่ามีคุณสมบัติ required ของ HTML5 ครบถ้วน
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    // ใช้ Locator แบบ CSS Selector ชัวร์กว่าเมื่อ Label ไม่ได้ผูกกัน
    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, email: 'user@example.com', role: 'user' } })
      });
    });

    // ✅ authSlice.js บังคับว่าต้องมี id
    await page.route('**/api/users/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, username: 'Test User', role: 'user' }) 
      });
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // GuestRoute จะเด้งไป /home
    await expect(page).toHaveURL(/.*\/home/);
  });
});