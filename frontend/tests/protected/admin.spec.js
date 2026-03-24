import { test, expect } from '@playwright/test';

test.describe('Admin Route Access Control', () => {
  
  test('🚫 should block NORMAL USER from /admin page and redirect to home', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-user-token');
    });

    await page.route('**/api/users/me', route => {
      route.fulfill({ 
        status: 200, 
        headers: { 'Access-Control-Allow-Origin': '*' }, // กัน CORS
        contentType: 'application/json', 
        body: JSON.stringify({ id: 2, role: 'user' }) 
      });
    });

    await page.goto('/admin');
    
    // 🌟 แก้เป็น /home เพราะ ProtectedRoute เด้งไป '/' และหน้า '/' จะเด้งคนที่มีล็อกอินไป '/home' อีกที
    await expect(page).toHaveURL(/.*\/home/);
  });

  test('✅ should allow ADMIN access to /admin page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-admin-token');
    });

    await page.route('**/api/users/me', route => {
      route.fulfill({ 
        status: 200, 
        headers: { 'Access-Control-Allow-Origin': '*' }, 
        contentType: 'application/json', 
        body: JSON.stringify({ id: 1, role: 'admin' }) 
      });
    });

    await page.route('**/api/admin/users', route => {
      route.fulfill({ 
        status: 200, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json', 
        body: JSON.stringify({ users: [{ email: 'test@mail.com', role: 'user' }] }) 
      });
    });

    await page.goto('/admin');
    
    await expect(page).toHaveURL(/.*\/admin/);
  });
});