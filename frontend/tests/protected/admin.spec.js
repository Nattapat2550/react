import { test, expect } from '@playwright/test';

test.describe('Admin Route Access Control', () => {
  
  test('🚫 should block NORMAL USER from /admin page and redirect to home', async ({ page }) => {
    // จำลอง Login เป็น User
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-user-token');
    });

    await page.route('**/api/users/me', route => {
      route.fulfill({ status: 200, json: { user: { role: 'user' } } });
    });

    await page.goto('/admin');
    
    // โดนเตะกลับหน้าแรก
    await expect(page).toHaveURL('/');
    await expect(page.locator('.toast-error').or(page.getByText('Access Denied'))).toBeVisible();
  });

  test('✅ should allow ADMIN access to /admin page', async ({ page }) => {
    // จำลอง Login เป็น Admin
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-admin-token');
    });

    // Mock ข้อมูล Admin
    await page.route('**/api/users/me', route => {
      route.fulfill({ status: 200, json: { user: { role: 'admin' } } });
    });

    // Mock API ของหน้า Admin Dashboard
    await page.route('**/api/admin/users', route => {
      route.fulfill({ status: 200, json: { users: [{ email: 'test@mail.com', role: 'user' }] } });
    });

    await page.goto('/admin');
    
    // เข้าได้ปกติ และเห็นข้อมูลบนจอ
    await expect(page).toHaveURL('/admin');
    await expect(page.getByText('test@mail.com')).toBeVisible(); // ตรวจสอบว่าดึง User มาโชว์ได้
  });
});