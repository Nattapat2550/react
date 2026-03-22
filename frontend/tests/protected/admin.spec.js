import { test, expect } from '@playwright/test';

test.describe('Admin Route Access Control', () => {
  
  test('🚫 should block NORMAL USER from /admin page and redirect to home', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-user-token');
    });

    // ✅ เพิ่ม id เข้าไปเพื่อให้ authSlice.js ผ่าน
    await page.route('**/api/users/me', route => {
      route.fulfill({ status: 200, json: { id: 2, role: 'user' } });
    });

    await page.goto('/admin');
    
    // โดนเตะกลับหน้าแรกตามสเปคของ ProtectedRoute
    await expect(page).toHaveURL('/');
  });

  test('✅ should allow ADMIN access to /admin page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-admin-token');
    });

    // ✅ เพิ่ม id เข้าไปเพื่อให้ authSlice.js ผ่าน
    await page.route('**/api/users/me', route => {
      route.fulfill({ status: 200, json: { id: 1, role: 'admin' } });
    });

    await page.route('**/api/admin/users', route => {
      route.fulfill({ status: 200, json: { users: [{ email: 'test@mail.com', role: 'user' }] } });
    });

    await page.goto('/admin');
    
    await expect(page).toHaveURL('/admin');
  });
});