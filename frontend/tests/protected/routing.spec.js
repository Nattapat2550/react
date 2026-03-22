import { test, expect } from '@playwright/test';

test.describe('Protected Routes & Role Authorization', () => {
  
  test('should redirect unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    // ต้องถูกเด้งกลับมาหน้า Login
    await expect(page).toHaveURL(/.*\/login/);
    // แจ้งเตือนว่าต้อง Login ก่อน
    await expect(page.getByText('Please login to access this page')).toBeVisible();
  });

  test('should redirect unauthenticated users from /settings to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should allow ADMIN access to /admin page', async ({ page }) => {
    // จำลองสถานะ Login เป็น Admin โดยฝัง Token และ Mock /me
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-admin-token');
    });

    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        json: { success: true, data: { name: 'Admin', role: 'admin' } }
      });
    });

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('should block NORMAL USER from /admin page and redirect to home', async ({ page }) => {
    // จำลองสถานะ Login เป็น User ธรรมดา
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-user-token');
    });

    await page.route('**/api/v1/auth/me', route => {
      route.fulfill({
        status: 200,
        json: { success: true, data: { name: 'Normal User', role: 'user' } }
      });
    });

    await page.goto('/admin');
    // ควรถูกเด้งกลับหน้า Home และแสดงข้อความปฏิเสธการเข้าถึง
    await expect(page).toHaveURL('/');
    await expect(page.locator('.toast-error')).toContainText('Access Denied');
  });
});