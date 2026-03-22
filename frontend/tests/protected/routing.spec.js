import { test, expect } from '@playwright/test';
const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
test.describe('Protected Routes & Role Authorization', () => {
  
  test('should redirect unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should redirect unauthenticated users from /settings to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should allow ADMIN access to /admin page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-admin-token');
    });

    // ✅ เปลี่ยน route ให้ตรงกับที่ API ฝั่ง Frontend คอลิงก์จริงๆ (/api/users/me) พร้อมใส่ id
    await page.route('**/api/users/me', route => {
      route.fulfill({
        status: 200,
        json: { id: 1, name: 'Admin', role: 'admin' }
      });
    });

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
  });

  test('should block NORMAL USER from /admin page and redirect to home', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-user-token');
    });

    await page.route('**/api/users/me', route => {
      route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: { id: 2, role: 'user' } 
      });
    });

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });
});