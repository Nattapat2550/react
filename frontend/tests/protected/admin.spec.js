import { test, expect } from '@playwright/test';

// 🌟 Helper ที่สะท้อน Origin ต้นทาง ป้องกันปัญหา CORS wildcard (*)
const mockWithCors = async (page, url, status, body) => {
  await page.route(url, async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': route.request().headers().origin || 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    return route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
  });
};

test.describe('Admin Route Access Control', () => {
  
  test('🚫 should block NORMAL USER from /admin page and redirect to home', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-user-token');
    });

    // ใช้ Helper เพื่อจำลองข้อมูล User
    await mockWithCors(page, '**/api/users/me', 200, { id: 2, role: 'user' });

    await page.goto('/admin');
    
    // พอ Request สำเร็จ ระบบจะเห็นว่าเป็น user และเตะไป '/' ซึ่งก็คือ '/home'
    await expect(page).toHaveURL(/.*\/home/);
  });

  test('✅ should allow ADMIN access to /admin page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-admin-token');
    });

    await mockWithCors(page, '**/api/users/me', 200, { id: 1, role: 'admin' });
    await mockWithCors(page, '**/api/admin/users', 200, { users: [{ email: 'test@mail.com', role: 'user' }] });

    await page.goto('/admin');
    
    await expect(page).toHaveURL(/.*\/admin/);
  });
});