import { test, expect } from '@playwright/test';

test.describe('Login Flow & Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display required validation errors on empty submission', async ({ page }) => {
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();
    await expect(page.getByText('Please enter your email')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    await expect(page.locator('.toast-error')).toContainText('Invalid credentials');
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'fake-jwt-token', user: { email: 'user@example.com' } })
      });
    });

    await page.route('**/api/users/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { username: 'Test User', role: 'user' } })
      });
    });

    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

    // เปลี่ยนจาก home.html เป็น Route /
    await expect(page).toHaveURL('/');
    
    // เช็คว่าเมนูเปลี่ยนไป (จำลองการแสดงชื่อ)
    await expect(page.getByText('Test User')).toBeVisible();
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('fake-jwt-token');
  });
});