import { test, expect } from '@playwright/test';

// 🌟 ตัวจัดการ Mock API ขั้นสุดยอด
const mockApi = async (page, url, status, body) => {
  await page.route(url, async (route) => {
    // 🌟 เปลี่ยน fallback เป็น 3000 ให้ตรงกับที่ Playwright รันจริง
    const origin = route.request().headers().origin || 'http://localhost:3000';
    const headers = {
      'Access-Control-Allow-Origin': origin,
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

test.describe('Login Flow & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // กำหนดให้หน้าแรกเริ่มมายังไม่ล็อกอิน
    await mockApi(page, '**/api/users/me', 401, { error: 'Not logged in' });
    
    await page.goto('/login');
    
    // 🌟 รอให้ React โหลดทุกอย่างเสร็จสมบูรณ์ ป้องกันหน้ารีเฟรชตอน Playwright รีบกดคลิก submit
    await page.waitForLoadState('networkidle'); 
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // บังคับให้ Mock พ่น 400 เพื่อให้ Axios โยน Error ส่งเข้า Redux ได้ชัวร์ๆ
    await mockApi(page, '**/api/auth/login', 400, { error: 'Invalid credentials' });

    await page.locator('input[name="email"]').fill('wrong_user@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');

    // ดักรอ Request ที่เป็น POST เพื่อให้เข้าจังหวะเป๊ะๆ
    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    // หาข้อความตรงๆ
    await expect(page.locator('text="Invalid credentials"')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    // Mock สมมติว่าล็อกอินผ่านและเซ็ต user เป็น 200
    await mockApi(page, '**/api/auth/login', 200, { token: 'fake-jwt-token', user: { id: 1, role: 'user' } });
    await mockApi(page, '**/api/users/me', 200, { id: 1, username: 'TestUser', role: 'user' });

    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');

    const responsePromise = page.waitForResponse(res => 
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    await responsePromise;

    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });
});